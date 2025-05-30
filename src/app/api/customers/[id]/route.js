import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient()

// GET - Obtener cliente por ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        sales: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { saleDate: 'desc' }
        },
        _count: {
          select: { sales: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar cliente
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json()
    const { name, email, phone, address, rfc } = data

    // Validaciones básicas
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ 
        error: 'El nombre del cliente es requerido' 
      }, { status: 400 })
    }

    // Verificar si el cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Verificar si el RFC ya existe (si se proporciona)
    if (rfc && rfc.trim() !== '') {
      const rfcExists = await prisma.customer.findFirst({
        where: { 
          rfc: rfc.trim(),
          id: { not: params.id }
        }
      })

      if (rfcExists) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con este RFC' 
        }, { status: 400 })
      }
    }

    // Verificar si el email ya existe (si se proporciona)
    if (email && email.trim() !== '') {
      const emailExists = await prisma.customer.findFirst({
        where: { 
          email: email.trim(),
          id: { not: params.id }
        }
      })

      if (emailExists) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con este email' 
        }, { status: 400 })
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        rfc: rfc?.trim() || null
      }
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar cliente
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verificar si el cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { sales: true }
        }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Verificar si el cliente tiene ventas asociadas
    if (existingCustomer._count.sales > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar el cliente porque tiene ventas asociadas' 
      }, { status: 400 })
    }

    await prisma.customer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
