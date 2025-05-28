import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: {
          select: { id: true, username: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, category: true }
            }
          }
        },
        inventoryMovements: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra no encontrada' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error('Error fetching purchase:', error);
    return NextResponse.json(
      { error: 'Error al obtener compra' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const data = await req.json();

    // Solo permitir actualizar ciertos campos
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data: {
        invoiceNumber: data.invoiceNumber?.trim() || null,
        notes: data.notes?.trim() || null,
      },
      include: {
        supplier: true,
        user: {
          select: { username: true }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(updatedPurchase);
  } catch (error) {
    console.error('Error updating purchase:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Compra no encontrada' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar compra' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verificar que la compra existe y obtener los items
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existingPurchase) {
      return NextResponse.json(
        { error: 'Compra no encontrada' }, 
        { status: 404 }
      );
    }

    // Eliminar en transacción (reversar el inventario)
    await prisma.$transaction(async (tx) => {
      // Reversar movimientos de inventario
      for (const item of existingPurchase.items) {
        // Reducir stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        // Crear movimiento de inventario de reversión
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            type: 'AJUSTE_NEGATIVO',
            quantityChange: -item.quantity,
            reason: `Eliminación de compra - ID: ${id}`,
          }
        });
      }

      // Eliminar movimientos de inventario relacionados
      await tx.inventoryMovement.deleteMany({
        where: { relatedPurchaseId: id }
      });

      // Eliminar items de compra
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id }
      });

      // Eliminar compra
      await tx.purchase.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: 'Compra eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Compra no encontrada' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error al eliminar compra' }, 
      { status: 500 }
    );
  }
}
