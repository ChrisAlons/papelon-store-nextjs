import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener todas las ventas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const userId = searchParams.get('userId')
    const customerId = searchParams.get('customerId')

    const skip = (page - 1) * limit

    // Construir filtros
    const where = {}
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (fromDate) {
      where.saleDate = { ...where.saleDate, gte: new Date(fromDate) }
    }

    if (toDate) {
      const endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999)
      where.saleDate = { ...where.saleDate, lte: endDate }
    }

    if (userId) {
      where.userId = userId
    }

    if (customerId) {
      where.customerId = customerId
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          user: { select: { id: true, username: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } }
            }
          },
          _count: { select: { items: true } }
        },
        orderBy: { saleDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.sale.count({ where })
    ])

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nueva venta
export async function POST(request) {
  try {
    const data = await request.json()
    const { 
      customerId, 
      userId, 
      items, 
      paymentType, 
      cashRegisterSessionId,
      totalAmount 
    } = data

    // Si no se proporciona userId, usar el usuario admin por defecto
    let finalUserId = userId
    if (!finalUserId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })
      finalUserId = defaultUser?.id
    }

    // Validaciones básicas
    if (!finalUserId || !items || items.length === 0) {
      return NextResponse.json({ 
        error: 'Datos requeridos: items y usuario válido' 
      }, { status: 400 })
    }

    // Validar stock disponible para todos los productos
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json({ 
          error: `Producto con ID ${item.productId} no encontrado` 
        }, { status: 404 })
      }

      if (!product.isActive) {
        return NextResponse.json({ 
          error: `El producto ${product.name} no está activo` 
        }, { status: 400 })
      }

      if (product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}` 
        }, { status: 400 })
      }
    }

    // Crear la venta en una transacción
    const result = await prisma.$transaction(async (tx) => {      // Crear la venta
      const sale = await tx.sale.create({
        data: {
          totalAmount: totalAmount || items.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0),
          userId: finalUserId,
          customerId: customerId || null,
          paymentType: paymentType || 'EFECTIVO',
          cashRegisterSessionId: cashRegisterSessionId || null,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtSale: item.priceAtSale
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: { select: { username: true } },
          customer: { select: { name: true, email: true } }
        }
      })

      // Actualizar el stock de los productos y crear movimientos de inventario
      for (const item of items) {
        // Actualizar stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })        // Crear movimiento de inventario
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            userId: finalUserId,
            type: 'VENTA',
            movementType: 'VENTA',
            quantity: item.quantity,
            quantityChange: -item.quantity, // Negativo porque es una salida
            reason: `Venta #${sale.id}`,
            notes: `Venta de ${item.quantity} unidades`,
            relatedSaleId: sale.id
          }
        })
      }

      return sale
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}
