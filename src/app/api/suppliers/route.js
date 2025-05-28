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

    const suppliers = await prisma.supplier.findMany({
      include: {
        purchases: {
          take: 5,
          orderBy: { purchaseDate: 'desc' }
        },
        _count: {
          select: { purchases: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Error al obtener proveedores' },
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
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del proveedor es requerido' }, 
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name.trim(),
        contactName: data.contactName?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
      }
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese nombre o email' }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear proveedor' }, 
      { status: 500 }
    );
  }
}
