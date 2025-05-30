import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient()

// GET - Buscar productos para POS
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit')) || 20
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where = {
      isActive: includeInactive ? undefined : true,
      OR: search ? [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ] : undefined
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } }
      },
      orderBy: [
        { name: 'asc' }
      ],
      take: limit
    })

    // Formatear productos para el POS
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      sku: product.sku,
      isActive: product.isActive,
      category: product.category?.name || 'Sin categoría',
      // Información adicional para el POS
      canSell: product.isActive && product.stock > 0,
      stockStatus: product.stock === 0 ? 'sin_stock' : 
                   product.stock <= 10 ? 'stock_bajo' : 'stock_normal'
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('Error searching products for POS:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
