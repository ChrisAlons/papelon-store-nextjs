import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Obtener productos con stock bajo (menos de 10 unidades) - solo activos
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 10
        },
        isActive: true
      },
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: { stock: 'asc' }
    });

    // Obtener productos sin stock - solo activos
    const outOfStockProducts = await prisma.product.findMany({
      where: {        stock: 0,
        isActive: true
      },
      include: {
        category: {
          select: { name: true }
        }
      }
    });    // Obtener valor total del inventario - solo productos activos
    const inventoryValue = await prisma.product.aggregate({
      where: {
        isActive: true
      },
      _sum: {
        stock: true
      },
      _avg: {
        cost: true
      }
    });

    // Obtener movimientos recientes (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMovements = await prisma.inventoryMovement.findMany({
      where: {
        movementDate: {
          gte: sevenDaysAgo
        }
      },
      include: {
        product: {
          select: { name: true, sku: true }
        },
        user: {
          select: { username: true }
        }
      },
      orderBy: { movementDate: 'desc' },
      take: 20
    });

    // Estadísticas por categoría
    const categoryStats = await prisma.category.findMany({
      include: {
        products: {
          select: {
            stock: true,
            cost: true,
            price: true
          }
        }
      }
    });

    const categoryInventory = categoryStats.map(category => {
      const totalStock = category.products.reduce((sum, product) => sum + product.stock, 0);
      const totalValue = category.products.reduce((sum, product) => sum + (product.stock * product.cost), 0);
      const productCount = category.products.length;
      
      return {
        id: category.id,
        name: category.name,
        productCount,
        totalStock,
        totalValue: Math.round(totalValue * 100) / 100
      };
    });

    // Calcular valor total del inventario
    const totalInventoryValue = await prisma.$queryRaw`
      SELECT SUM(stock * cost) as total_value
      FROM "Product"
      WHERE stock > 0
    `;

    const report = {
      summary: {
        totalProducts: await prisma.product.count(),
        totalStock: inventoryValue._sum.stock || 0,
        averageCost: Math.round((inventoryValue._avg.cost || 0) * 100) / 100,
        totalInventoryValue: Math.round((totalInventoryValue[0]?.total_value || 0) * 100) / 100,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length
      },
      lowStockProducts,
      outOfStockProducts,
      recentMovements,
      categoryInventory
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return NextResponse.json(
      { error: 'Error al generar reporte de inventario' }, 
      { status: 500 }
    );
  }
}
