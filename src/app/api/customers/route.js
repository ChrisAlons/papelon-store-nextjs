import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient()

// GET - Obtener todos los clientes
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit')) || 50

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { rfc: { contains: search, mode: 'insensitive' } }
      ]
    } : {}

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: { sales: true }
        }
      },
      orderBy: { name: 'asc' },
      take: limit
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nuevo cliente
export async function POST(request) {
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

    // Verificar que el email no esté en uso (si se proporciona)
    if (email) {
      const existingCustomerByEmail = await prisma.customer.findUnique({
        where: { email }
      })
      
      if (existingCustomerByEmail) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con este email' 
        }, { status: 400 })
      }
    }

    // Verificar que el RFC no esté en uso (si se proporciona)
    if (rfc) {
      const existingCustomerByRFC = await prisma.customer.findUnique({
        where: { rfc }
      })
      
      if (existingCustomerByRFC) {
        return NextResponse.json({ 
          error: 'Ya existe un cliente con este RFC' 
        }, { status: 400 })
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        rfc: rfc?.trim() || null
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    
    // Manejar errores de unicidad de Prisma
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0]
      return NextResponse.json({ 
        error: `Ya existe un cliente con este ${field === 'email' ? 'email' : 'RFC'}` 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
