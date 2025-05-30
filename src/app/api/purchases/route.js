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

    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: {
          select: { id: true, name: true }
        },
        user: {
          select: { id: true, username: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { purchaseDate: 'desc' }
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json(
      { error: 'Error al obtener compras' }, 
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }    const data = await req.json();
    
    console.log('Received purchase data:', JSON.stringify(data, null, 2));
    console.log('Session user:', session.user);
      // Validación básica
    if (!data.supplierId || typeof data.supplierId !== 'string') {
      return NextResponse.json(
        { error: 'ID del proveedor es requerido y debe ser válido' }, 
        { status: 400 }
      );
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un producto en la compra' }, 
        { status: 400 }
      );    }

    // Validar items
    for (const item of data.items) {
      if (!item.productId || typeof item.productId !== 'string' || !item.quantity || item.quantity <= 0 || !item.costAtPurchase || item.costAtPurchase <= 0) {
        return NextResponse.json(
          { error: 'Todos los productos deben tener ID válido, cantidad > 0 y costo > 0' }, 
          { status: 400 }
        );
      }
    }

    // Verificar que todos los productos existen
    const productIds = data.items.map(item => item.productId);
    const existingProducts = await prisma.product.findMany({
      where: { 
        id: { in: productIds },
        isActive: true 
      }
    });
    
    if (existingProducts.length !== productIds.length) {
      const missingProducts = productIds.filter(id => 
        !existingProducts.find(product => product.id === id)
      );
      return NextResponse.json(
        { error: `Los siguientes productos no existen o están inactivos: ${missingProducts.join(', ')}` }, 
        { status: 400 }
      );
    }

    // Calcular total
    const totalAmount = data.items.reduce((sum, item) => 
      sum + (item.quantity * item.costAtPurchase), 0
    );    // Verificar que el proveedor existe
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId }
    });
    
    console.log('Supplier found:', supplier);
    
    if (!supplier) {
      return NextResponse.json(
        { error: 'El proveedor especificado no existe' }, 
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    console.log('User found:', user);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no válido' }, 
        { status: 400 }
      );
    }    // Crear compra en transacción
    const purchase = await prisma.$transaction(async (tx) => {
      console.log('Creating purchase with:', {
        supplierId: data.supplierId,
        userId: session.user.id,
        totalAmount: totalAmount
      });
      
      // Crear la compra
      const newPurchase = await tx.purchase.create({
        data: {
          supplierId: data.supplierId,
          userId: session.user.id,
          totalAmount: totalAmount,
          invoiceNumber: data.invoiceNumber?.trim() || null,
          notes: data.notes?.trim() || null,
        },
        include: {
          supplier: true,
          user: {
            select: { username: true }
          }
        }
      });

      console.log('Purchase created successfully:', newPurchase.id);      // Crear items de compra
      const createdItems = [];
      for (const item of data.items) {
        console.log('Creating purchase item:', {
          purchaseId: newPurchase.id,
          productId: item.productId,
          quantity: item.quantity,
          costAtPurchase: item.costAtPurchase
        });
        
        const purchaseItem = await tx.purchaseItem.create({
          data: {
            purchaseId: newPurchase.id,
            productId: item.productId,
            quantity: item.quantity,
            costAtPurchase: item.costAtPurchase
          },
          include: {
            product: true
          }
        });
        createdItems.push(purchaseItem);
      }// Actualizar stock de productos y crear movimientos de inventario
      for (const item of data.items) {
        // Actualizar stock del producto
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            },
            cost: item.costAtPurchase // Actualizar costo del producto
          }
        });

        // Crear movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            type: 'COMPRA_PROVEEDOR',
            quantityChange: item.quantity,
            reason: `Compra a proveedor - Factura: ${data.invoiceNumber || 'Sin factura'}`,
            relatedPurchaseId: newPurchase.id
          }
        });
      }

      // Retornar compra con items incluidos
      const finalPurchase = await tx.purchase.findUnique({
        where: { id: newPurchase.id },
        include: {
          items: {
            include: {
              product: true
            }
          },
          supplier: true,
          user: {
            select: { username: true }
          }
        }
      });

      return finalPurchase;
    });

    return NextResponse.json(purchase, { status: 201 });  } catch (error) {
    console.error('Error creating purchase:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una compra con ese número de factura' }, 
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      console.error('Foreign key constraint failed:', error.meta);
      return NextResponse.json(
        { error: 'Error de referencia: Uno de los IDs especificados no existe en la base de datos' }, 
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Proveedor o producto no encontrado' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear compra', details: error.message }, 
      { status: 500 }
    );
  }
}
