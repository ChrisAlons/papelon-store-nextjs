import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener una venta específica
export async function GET(request, { params }) {
  try {
    const { id } = params

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, role: true } },
        customer: true,
        items: {
          include: {
            product: {
              select: { 
                id: true, 
                name: true, 
                sku: true, 
                description: true,
                category: { select: { name: true } }
              }
            }
          }
        },
        inventoryMovements: {
          include: {
            product: { select: { name: true } }
          }
        },
        cashRegisterSession: {
          select: { id: true, openingTime: true, closingTime: true }
        },
        returns: {
          include: {
            items: {
              include: {
                product: { select: { name: true } }
              }
            }
          }
        }
      }
    })

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar una venta (principalmente para devoluciones parciales)
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()

    // Verificar que la venta existe
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Solo permitir actualizar campos específicos
    const allowedUpdates = ['paymentType', 'customerId']
    const updateData = {}
    
    for (const key of allowedUpdates) {
      if (data[key] !== undefined) {
        updateData[key] = data[key]
      }
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { username: true } },
        customer: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } }
          }
        }
      }
    })

    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Anular una venta (solo si no hay devoluciones y es del mismo día)
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Verificar que la venta existe y obtener detalles
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        returns: true,
        inventoryMovements: true
      }
    })

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Verificar que no tenga devoluciones
    if (sale.returns.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede anular una venta que ya tiene devoluciones' 
      }, { status: 400 })
    }

    // Verificar que sea del mismo día (opcional, según políticas del negocio)
    const today = new Date()
    const saleDate = new Date(sale.saleDate)
    const isToday = today.toDateString() === saleDate.toDateString()

    if (!isToday) {
      return NextResponse.json({ 
        error: 'Solo se pueden anular ventas del día actual' 
      }, { status: 400 })
    }

    // Anular la venta en una transacción
    await prisma.$transaction(async (tx) => {
      // Restaurar el stock de los productos
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        })

        // Crear movimiento de inventario de corrección
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            userId: sale.userId,
            type: 'AJUSTE_POSITIVO',
            movementType: 'AJUSTE_POSITIVO',
            quantity: item.quantity,
            quantityChange: item.quantity,
            reason: `Anulación de venta #${sale.id}`,
            notes: `Restauración de stock por anulación de venta`
          }
        })
      }

      // Eliminar los movimientos de inventario relacionados con la venta
      await tx.inventoryMovement.deleteMany({
        where: { relatedSaleId: id }
      })

      // Eliminar los items de la venta
      await tx.saleItem.deleteMany({
        where: { saleId: id }
      })

      // Eliminar la venta
      await tx.sale.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Venta anulada exitosamente' })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
