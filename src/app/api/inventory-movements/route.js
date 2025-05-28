import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const movementType = searchParams.get('movementType') || searchParams.get('type');
    const limit = parseInt(searchParams.get('limit')) || 50;

    const where = {};
    if (productId) where.productId = productId;
    if (movementType) {
      where.OR = [
        { type: movementType },
        { movementType: movementType }
      ];
    }const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },        user: {
          select: { id: true, username: true }
        },
        sale: {
          select: { id: true, totalAmount: true }
        },
        purchase: {
          select: { id: true, totalAmount: true, supplier: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return NextResponse.json(
      { error: 'Error al obtener movimientos de inventario' }, 
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const data = await req.json();
    
    // Validación básica
    if (!data.productId || !data.movementType || !data.quantity || data.quantity === 0) {
      return NextResponse.json(
        { error: 'Producto, tipo y cantidad son requeridos' }, 
        { status: 400 }
      );
    }

    // Validar tipos permitidos para ajustes manuales
    const allowedTypes = ['ENTRY', 'EXIT', 'ADJUSTMENT', 'DAMAGE'];
    if (!allowedTypes.includes(data.movementType)) {
      return NextResponse.json(
        { error: 'Tipo de movimiento no válido' }, 
        { status: 400 }
      );
    }

    // Crear movimiento en transacción
    const movement = await prisma.$transaction(async (tx) => {
      // Verificar que el producto existe
      const product = await tx.product.findUnique({
        where: { id: parseInt(data.productId) }
      });

      if (!product) {
        throw new Error('Producto no encontrado');
      }

      // Calcular el cambio de cantidad basado en el tipo de movimiento
      let quantityChange;
      switch (data.movementType) {
        case 'ENTRY':
        case 'ADJUSTMENT':
          quantityChange = Math.abs(data.quantity);
          break;
        case 'EXIT':
        case 'DAMAGE':
          quantityChange = -Math.abs(data.quantity);
          break;
        default:
          throw new Error('Tipo de movimiento no válido');
      }

      // Para movimientos que reducen stock, verificar que hay suficiente
      if (quantityChange < 0 && Math.abs(quantityChange) > product.stock) {
        throw new Error('No hay suficiente stock para realizar este movimiento');
      }

      // Actualizar stock del producto
      await tx.product.update({
        where: { id: parseInt(data.productId) },
        data: {
          stock: {
            increment: quantityChange
          }
        }
      });      // Crear movimiento de inventario
      const newMovement = await tx.inventoryMovement.create({
        data: {
          productId: parseInt(data.productId),
          userId: session.user.id,
          type: data.movementType,
          movementType: data.movementType, // Para compatibilidad
          quantity: Math.abs(data.quantity),
          quantityChange: quantityChange,
          reason: data.reason?.trim() || 'Movimiento manual de inventario',
          notes: data.notes?.trim() || null,
          movementDate: new Date()
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, stock: true }
          },
          user: {
            select: { id: true, username: true, name: true }
          }
        }
      });

      return newMovement;
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    
    if (error.message === 'Producto no encontrado') {
      return NextResponse.json(
        { error: 'Producto no encontrado' }, 
        { status: 404 }
      );
    }

    if (error.message.includes('No hay suficiente stock')) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear movimiento de inventario' }, 
      { status: 500 }
    );
  }
}
