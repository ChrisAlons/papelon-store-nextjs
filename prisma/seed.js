const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // --- Clean up existing data (optional, but useful for repeatable seeds) ---
  // Order matters due to foreign key constraints
  await prisma.saleReturnItem.deleteMany({});
  await prisma.saleReturn.deleteMany({});
  await prisma.inventoryMovement.deleteMany({});
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.purchaseItem.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.cashRegisterSession.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({});

  // --- Create Users ---
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPasswordAdmin,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${adminUser.username}`);

  const hashedPasswordSeller = await bcrypt.hash('seller123', 10);
  const sellerUser = await prisma.user.create({
    data: {
      username: 'vendedor1',
      password: hashedPasswordSeller,
      role: 'SELLER',
    },
  });
  console.log(`Created seller user: ${sellerUser.username}`);

  // --- Create Categories ---
  const catCuadernos = await prisma.category.create({
    data: { name: 'Cuadernos', description: 'Cuadernos de diferentes tipos y tamaños' },
  });
  const catEscritura = await prisma.category.create({
    data: { name: 'Escritura', description: 'Lápices, plumas, marcadores, etc.' },
  });
  const catOficina = await prisma.category.create({
    data: { name: 'Oficina', description: 'Artículos generales de oficina' },
  });
  console.log('Created categories');

  // --- Create Products ---
  await prisma.product.createMany({
    data: [
      {
        name: 'Cuaderno Profesional Rayado 100 Hojas',
        price: 35.50,
        cost: 20.00,
        stock: 50,
        sku: 'CUAD-PRO-100R',
        categoryId: catCuadernos.id,
      },
      {
        name: 'Lápiz Mirado No. 2',
        price: 5.00,
        cost: 2.50,
        stock: 200,
        sku: 'LAP-MIR-NO2',
        categoryId: catEscritura.id,
      },
      {
        name: 'Paquete de 500 Hojas Blancas Bond',
        price: 90.00,
        cost: 65.00,
        stock: 30,
        sku: 'PAP-BOND-500',
        categoryId: catOficina.id,
      },
      {
        name: 'Pluma BIC Cristal Negra Punto Mediano',
        price: 7.00,
        cost: 3.50,
        stock: 150,
        sku: 'PLU-BIC-NEGM',
        categoryId: catEscritura.id,
      },
    ],
  });
  console.log('Created products');

  // --- Create a Supplier ---
  const supplierPapelera = await prisma.supplier.create({
    data: {
      name: 'Papelera Principal S.A. de C.V.',
      contactName: 'Juan Carlos Proveedor',
      email: 'contacto@papeleraprincipal.com',
      phone: '5512345678',
    },
  });
  console.log(`Created supplier: ${supplierPapelera.name}`);

  // --- Create a Customer ---
  const customerEjemplo = await prisma.customer.create({
    data: {
      name: 'Ana Cliente Frecuente',
      email: 'ana.cliente@example.com',
      phone: '3398765432',
      rfc: 'ANAC800101XYZ'
    }
  });
  console.log(`Created customer: ${customerEjemplo.name}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
