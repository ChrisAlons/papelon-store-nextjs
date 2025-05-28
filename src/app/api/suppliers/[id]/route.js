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
    
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          include: {
            items: {
              include: {
                product: true
              }
            },
            user: {
              select: { username: true }
            }
          },
          orderBy: { purchaseDate: 'desc' }
        },
        _count: {
          select: { purchases: true }
        }
      }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedor' }, 
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

    // Validación básica
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del proveedor es requerido' }, 
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name.trim(),
        contactName: data.contactName?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
      }
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' }, 
        { status: 404 }
      );
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre o email' }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar proveedor' }, 
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

    // Verificar si el proveedor tiene compras asociadas
    const purchaseCount = await prisma.purchase.count({
      where: { supplierId: id }
    });

    if (purchaseCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el proveedor porque tiene compras asociadas' }, 
        { status: 409 }
      );
    }

    await prisma.supplier.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error al eliminar proveedor' }, 
      { status: 500 }
    );
  }
}
