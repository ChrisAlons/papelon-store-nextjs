import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  return NextResponse.json(category);
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = params;
  const data = await req.json();
  const updated = await prisma.category.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = params;
  
  try {
    // Verificar si la categoría tiene productos asociados
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar la categoría "${category.name}" porque tiene ${category._count.products} producto(s) asociado(s). Primero mueva o elimine los productos de esta categoría.` 
      }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Categoría eliminada exitosamente' });
    
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor al eliminar la categoría' 
    }, { status: 500 });
  }
}
