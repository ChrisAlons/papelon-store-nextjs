import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            inventoryMovements: true,
            saleItems: true,
            purchaseItems: true,
            saleReturnItems: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verificar si tiene registros asociados
    const hasMovements = product._count.inventoryMovements > 0;
    const hasSales = product._count.saleItems > 0;
    const hasPurchases = product._count.purchaseItems > 0;
    const hasReturns = product._count.saleReturnItems > 0;

    if (hasMovements || hasSales || hasPurchases || hasReturns) {
      let reason = 'Este producto no puede eliminarse porque tiene ';
      const reasons = [];
      
      if (hasSales) reasons.push('ventas registradas');
      if (hasPurchases) reasons.push('compras registradas');
      if (hasMovements) reasons.push('movimientos de inventario');
      if (hasReturns) reasons.push('devoluciones registradas');
      
      reason += reasons.join(', ') + '.';
      
      return NextResponse.json({
        canDelete: false,
        reason: reason,
        details: {
          sales: product._count.saleItems,
          purchases: product._count.purchaseItems,
          movements: product._count.inventoryMovements,
          returns: product._count.saleReturnItems
        }
      });
    }

    return NextResponse.json({
      canDelete: true,
      reason: 'El producto puede eliminarse safely'
    });

  } catch (error) {
    console.error('Error checking if product can be deleted:', error);
    return NextResponse.json(
      { error: 'Error al verificar si el producto puede eliminarse' },
      { status: 500 }
    );
  }
}
