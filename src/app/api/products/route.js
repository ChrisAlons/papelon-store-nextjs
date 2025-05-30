import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  
  const where = includeInactive ? {} : { isActive: true };
  
  const products = await prisma.product.findMany({ 
    where,
    include: { category: true },
    orderBy: [
      { isActive: 'desc' }, // Active products first
      { name: 'asc' }
    ]
  });
  
  return NextResponse.json(products);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await req.json();
  const product = await prisma.product.create({ data });
  return NextResponse.json(product);
}
