import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req, { params }) {
  // const session = await getServerSession(authOptions);
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { category: true } });
  if (!product) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req, { params }) {
  // const session = await getServerSession(authOptions);
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const data = await req.json();
  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json(product);
}

export async function DELETE(req, { params }) {
  // const session = await getServerSession(authOptions);
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id } = await params;
  
  // Check if product has associated records
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      saleItems: true,
      purchaseItems: true,
      inventoryMovements: true,
      saleReturnItems: true
    }
  });
  
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  
  const hasAssociatedRecords = 
    product.saleItems.length > 0 || 
    product.purchaseItems.length > 0 || 
    product.inventoryMovements.length > 0 ||
    product.saleReturnItems.length > 0;
  
  if (hasAssociatedRecords) {
    // Soft delete - deactivate the product instead of deleting
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });
    return NextResponse.json({ 
      message: 'Product deactivated (has transaction history)',
      product: updatedProduct,
      deactivated: true
    });
  } else {
    // Hard delete if no associated records
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: 'Product deleted completely' });
  }
}
