import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient()

// GET - Obtener estadísticas de ventas
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today' // today, week, month, year
    
    let startDate = new Date()
    let endDate = new Date()
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'week':
        const startOfWeek = startDate.getDate() - startDate.getDay()
        startDate.setDate(startOfWeek)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'month':
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'year':
        startDate.setMonth(0, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setMonth(11, 31)
        endDate.setHours(23, 59, 59, 999)
        break
    }

    const [
      totalSales,
      totalRevenue,
      salesCount,
      topProducts,
      salesByPaymentType,
      recentSales
    ] = await Promise.all([
      // Total de ventas en el período
      prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      }),
      
      // Ingresos totales (separado para claridad)
      prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalAmount: true
        }
      }),

      // Conteo de ventas
      prisma.sale.count({
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // Productos más vendidos
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: {
            saleDate: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        _sum: {
          quantity: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }),

      // Ventas por tipo de pago
      prisma.sale.groupBy({
        by: ['paymentType'],
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      }),

      // Ventas recientes
      prisma.sale.findMany({
        where: {
          saleDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          user: { select: { username: true } },
          customer: { select: { name: true } },
          _count: { select: { items: true } }
        },
        orderBy: { saleDate: 'desc' },
        take: 10
      })
    ])

    // Obtener detalles de productos para los más vendidos
    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true, price: true }
        })
        return {
          ...item,
          product
        }
      })
    )

    // Calcular promedio de venta
    const averageSaleAmount = salesCount > 0 
      ? (totalRevenue._sum.totalAmount || 0) / salesCount 
      : 0

    const stats = {
      period,
      dateRange: {
        start: startDate,
        end: endDate
      },
      summary: {
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        salesCount,
        averageSaleAmount,
        totalItems: topProducts.reduce((sum, item) => sum + (item._sum.quantity || 0), 0)
      },
      topProducts: topProductsWithDetails,
      salesByPaymentType,
      recentSales
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching sales stats:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
