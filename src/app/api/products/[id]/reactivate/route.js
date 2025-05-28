import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = params;
  
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Reactivate the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { isActive: true },
      include: { category: true }
    });
    
    return NextResponse.json({ 
      message: 'Product reactivated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error reactivating product:', error);
    return NextResponse.json({ 
      error: 'Failed to reactivate product' 
    }, { status: 500 });
  }
}
