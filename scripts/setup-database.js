#!/usr/bin/env node

/**
 * Script automatizado para configurar la base de datos completa
 * Ejecutar con: npm run setup
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Colores para console.log
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(colors[color] + message + colors.reset);
};

async function main() {
  try {
    log('🚀 Iniciando configuración automática de la base de datos...', 'bright');
    log('', 'reset');

    // === PASO 1: LIMPIAR BASE DE DATOS ===
    log('🧹 PASO 1: Limpiando base de datos existente...', 'yellow');
    await cleanDatabase();
    log('✅ Base de datos limpiada exitosamente', 'green');
    log('', 'reset');

    // === PASO 2: CREAR USUARIOS ===
    log('👥 PASO 2: Creando usuarios del sistema...', 'yellow');
    const users = await createUsers();
    log('✅ Usuarios creados exitosamente', 'green');
    log('', 'reset');

    // === PASO 3: CREAR CATEGORÍAS ===
    log('📂 PASO 3: Creando categorías de productos...', 'yellow');
    const categories = await createCategories();
    log('✅ Categorías creadas exitosamente', 'green');
    log('', 'reset');

    // === PASO 4: CREAR PRODUCTOS ===
    log('📦 PASO 4: Creando productos...', 'yellow');
    const products = await createProducts(categories);
    log('✅ Productos creados exitosamente', 'green');
    log('', 'reset');

    // === PASO 5: CREAR PROVEEDORES ===
    log('🏢 PASO 5: Creando proveedores...', 'yellow');
    const suppliers = await createSuppliers();
    log('✅ Proveedores creados exitosamente', 'green');
    log('', 'reset');

    // === PASO 6: CREAR CLIENTES ===
    log('👤 PASO 6: Creando clientes...', 'yellow');
    const customers = await createCustomers();
    log('✅ Clientes creados exitosamente', 'green');
    log('', 'reset');

    // === PASO 7: CREAR DATOS DE EJEMPLO ===
    log('📊 PASO 7: Creando datos de ejemplo (compras, ventas)...', 'yellow');
    await createSampleData(users, products, suppliers, customers);
    log('✅ Datos de ejemplo creados exitosamente', 'green');
    log('', 'reset');

    // === RESUMEN FINAL ===
    log('🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!', 'bright');
    log('', 'reset');
    printSummary(users, categories, products, suppliers, customers);

  } catch (error) {
    log('❌ ERROR durante la configuración:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Limpiar todas las tablas en el orden correcto
 */
async function cleanDatabase() {
  const tables = [
    'saleReturnItem',
    'saleReturn', 
    'inventoryMovement',
    'saleItem',
    'sale',
    'purchaseItem',
    'purchase',
    'expense',
    'cashRegisterSession',
    'product',
    'category',
    'supplier',
    'customer',
    'user'
  ];

  for (const table of tables) {
    try {
      await prisma[table].deleteMany({});
      log(`  ⭕ Tabla ${table} limpiada`, 'cyan');
    } catch (error) {
      log(`  ⚠️ Error limpiando tabla ${table}: ${error.message}`, 'yellow');
    }
  }
}

/**
 * Crear usuarios del sistema
 */
async function createUsers() {
  const users = [];

  // Usuario Admin
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPasswordAdmin,
      role: 'ADMIN',
    },
  });
  users.push(adminUser);
  log(`  👑 Admin creado: ${adminUser.username}`, 'magenta');

  // Usuario Vendedor
  const hashedPasswordSeller = await bcrypt.hash('vendedor123', 10);
  const sellerUser = await prisma.user.create({
    data: {
      username: 'vendedor1',
      password: hashedPasswordSeller,
      role: 'SELLER',
    },
  });
  users.push(sellerUser);
  log(`  🛒 Vendedor creado: ${sellerUser.username}`, 'magenta');

  // Usuario Cajero
  const hashedPasswordCashier = await bcrypt.hash('cajero123', 10);
  const cashierUser = await prisma.user.create({
    data: {
      username: 'cajero1',
      password: hashedPasswordCashier,
      role: 'SELLER',
    },
  });
  users.push(cashierUser);
  log(`  💰 Cajero creado: ${cashierUser.username}`, 'magenta');

  return users;
}

/**
 * Crear categorías de productos
 */
async function createCategories() {
  const categoriesData = [
    {
      name: 'Cuadernos',
      description: 'Cuadernos de diferentes tipos y tamaños'
    },
    {
      name: 'Escritura',
      description: 'Lápices, plumas, marcadores, etc.'
    },
    {
      name: 'Oficina',
      description: 'Artículos generales de oficina'
    },
    {
      name: 'Escolar',
      description: 'Materiales para estudiantes'
    },
    {
      name: 'Arte',
      description: 'Materiales para arte y manualidades'
    },
    {
      name: 'Tecnología',
      description: 'Productos tecnológicos y electrónicos'
    }
  ];

  const categories = [];
  for (const categoryData of categoriesData) {
    const category = await prisma.category.create({
      data: categoryData
    });
    categories.push(category);
    log(`  📁 Categoría creada: ${category.name}`, 'cyan');
  }

  return categories;
}

/**
 * Crear productos
 */
async function createProducts(categories) {
  const productsData = [    // Cuadernos
    {
      name: 'Cuaderno Profesional Rayado 100 Hojas',
      price: 35.50,
      cost: 20.00,
      stock: 50,
      sku: 'CUAD-PRO-100R',
      categoryName: 'Cuadernos'
    },
    {
      name: 'Cuaderno Universitario Cuadriculado 200 Hojas',
      price: 55.00,
      cost: 32.00,
      stock: 30,
      sku: 'CUAD-UNI-200C',
      categoryName: 'Cuadernos'
    },
    {
      name: 'Libreta Pequeña Rayada 80 Hojas',
      price: 18.00,
      cost: 10.00,
      stock: 75,
      sku: 'LIB-PEQ-80R',
      categoryName: 'Cuadernos'
    },    // Escritura
    {
      name: 'Lápiz Mirado No. 2',
      price: 5.00,
      cost: 2.50,
      stock: 200,
      sku: 'LAP-MIR-NO2',
      categoryName: 'Escritura'
    },
    {
      name: 'Pluma BIC Cristal Negra Punto Mediano',
      price: 7.00,
      cost: 3.50,
      stock: 150,
      sku: 'PLU-BIC-NEGM',
      categoryName: 'Escritura'
    },
    {
      name: 'Marcador Sharpie Negro',
      price: 25.00,
      cost: 15.00,
      stock: 40,
      sku: 'MAR-SHA-NEG',
      categoryName: 'Escritura'
    },
    {
      name: 'Bolígrafo Pilot G2 Azul',
      price: 12.00,
      cost: 7.00,
      stock: 80,
      sku: 'BOL-PIL-AZU',
      categoryName: 'Escritura'
    },

    // Oficina
    {
      name: 'Paquete de 500 Hojas Blancas Bond',
      price: 90.00,
      cost: 65.00,
      stock: 30,
      sku: 'PAP-BOND-500',
      categoryName: 'Oficina'
    },
    {
      name: 'Grapadora Estándar',
      price: 85.00,
      cost: 50.00,
      stock: 15,
      sku: 'GRA-EST-001',
      categoryName: 'Oficina'
    },
    {
      name: 'Clips Metálicos 100 Piezas',
      price: 15.00,
      cost: 8.00,
      stock: 60,
      sku: 'CLI-MET-100',
      categoryName: 'Oficina'
    },    // Escolar
    {
      name: 'Regla de 30cm Transparente',
      price: 8.00,
      cost: 4.50,
      stock: 90,
      sku: 'REG-30T-001',
      categoryName: 'Escolar'
    },
    {
      name: 'Compás Escolar Metálico',
      price: 45.00,
      cost: 28.00,
      stock: 25,
      sku: 'COM-ESC-MET',
      categoryName: 'Escolar'
    },
    {
      name: 'Calculadora Básica',
      price: 120.00,
      cost: 75.00,
      stock: 20,
      sku: 'CAL-BAS-001',
      categoryName: 'Escolar'
    },

    // Arte
    {
      name: 'Colores de Madera 12 Piezas',
      price: 35.00,
      cost: 20.00,
      stock: 45,
      sku: 'COL-MAD-12',
      categoryName: 'Arte'
    },
    {
      name: 'Acuarelas 18 Colores',
      price: 85.00,
      cost: 50.00,
      stock: 20,
      sku: 'ACU-18C-001',
      categoryName: 'Arte'
    },

    // Tecnología
    {
      name: 'USB 32GB',
      price: 180.00,
      cost: 120.00,
      stock: 25,
      sku: 'USB-32G-001',
      categoryName: 'Tecnología'
    }
  ];

  const products = [];
  for (const productData of productsData) {
    const category = categories.find(cat => cat.name === productData.categoryName);
    if (category) {
      const { categoryName, ...productDataWithoutCategory } = productData;
      const product = await prisma.product.create({
        data: {
          ...productDataWithoutCategory,
          categoryId: category.id
        }
      });
      products.push(product);
      log(`  📦 Producto creado: ${product.name} (Stock: ${product.stock})`, 'cyan');
    }
  }

  return products;
}

/**
 * Crear proveedores
 */
async function createSuppliers() {  const suppliersData = [
    {
      name: 'Papelera Principal S.A. de C.V.',
      email: 'ventas@papeleraprincipal.com',
      phone: '55-1234-5678',
      address: 'Av. Insurgentes Sur 1234, Col. Del Valle, CDMX',
      contactName: 'Carlos Mendoza'
    },
    {
      name: 'Distribuidora Escolar Morelos',
      email: 'pedidos@escolarmorelos.com',
      phone: '55-9876-5432',
      address: 'Calle Morelos 567, Centro, Guadalajara, JAL',
      contactName: 'Ana García'
    },
    {
      name: 'Tecnología Educativa del Norte',
      email: 'contacto@tecnologianorte.com',
      phone: '81-2468-1357',
      address: 'Av. Constitución 890, Monterrey, NL',
      contactName: 'Roberto Silva'
    },
    {
      name: 'Arte y Manualidades Express',
      email: 'info@arteexpress.com',
      phone: '33-1357-2468',
      address: 'Calzada del Arte 321, Zapopan, JAL',
      contactName: 'María López'
    }
  ];

  const suppliers = [];
  for (const supplierData of suppliersData) {
    const supplier = await prisma.supplier.create({
      data: supplierData
    });
    suppliers.push(supplier);
    log(`  🏢 Proveedor creado: ${supplier.name}`, 'cyan');
  }

  return suppliers;
}

/**
 * Crear clientes
 */
async function createCustomers() {
  const customersData = [
    {
      name: 'Ana Cliente Frecuente',
      email: 'ana.cliente@email.com',
      phone: '55-1111-2222',
      address: 'Calle Principal 123, Col. Centro'
    },
    {
      name: 'Escuela Primaria Benito Juárez',
      email: 'direccion@escuelajuarez.edu.mx',
      phone: '55-3333-4444',
      address: 'Av. Educación 456, Col. Escolar'
    },
    {
      name: 'Oficina Contable Torres',
      email: 'contacto@oficinatorres.com',
      phone: '55-5555-6666',
      address: 'Torre Corporativa 789, Piso 12'
    },
    {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '55-7777-8888',
      address: 'Calle Secundaria 321, Col. Residencial'
    },
    {
      name: 'Instituto Técnico Regional',
      email: 'compras@institutoregional.edu.mx',
      phone: '55-9999-0000',
      address: 'Blvd. Técnico 654, Ciudad Universitaria'
    }
  ];

  const customers = [];
  for (const customerData of customersData) {
    const customer = await prisma.customer.create({
      data: customerData
    });
    customers.push(customer);
    log(`  👤 Cliente creado: ${customer.name}`, 'cyan');
  }

  return customers;
}

/**
 * Crear datos de ejemplo (compras y ventas)
 */
async function createSampleData(users, products, suppliers, customers) {
  const adminUser = users.find(u => u.role === 'ADMIN');
  
  // Crear algunas compras de ejemplo
  log('  📥 Creando compras de ejemplo...', 'blue');
    const purchase1 = await prisma.purchase.create({
    data: {
      supplierId: suppliers[0].id,
      userId: adminUser.id,
      totalAmount: 1250.00,
      purchaseDate: new Date('2025-05-20'),
      invoiceNumber: 'INV-001',
      notes: 'Compra inicial de inventario',
      items: {
        create: [
          {
            productId: products[0].id, // Cuaderno Profesional
            quantity: 25,
            costAtPurchase: 20.00
          },
          {
            productId: products[3].id, // Lápiz Mirado
            quantity: 100,
            costAtPurchase: 2.50
          }
        ]
      }
    }
  });
  log(`    💰 Compra creada: $${purchase1.totalAmount}`, 'blue');

  // Crear algunas ventas de ejemplo
  log('  📤 Creando ventas de ejemplo...', 'blue');
  
  const sale1 = await prisma.sale.create({
    data: {
      userId: adminUser.id,
      customerId: customers[0].id,
      totalAmount: 92.50,
      paymentType: 'EFECTIVO',
      saleDate: new Date('2025-05-27'),
      items: {
        create: [
          {
            productId: products[0].id, // Cuaderno Profesional
            quantity: 2,
            priceAtSale: 35.50
          },
          {
            productId: products[4].id, // Pluma BIC
            quantity: 3,
            priceAtSale: 7.00
          }
        ]
      }
    }
  });
  log(`    💸 Venta creada: $${sale1.totalAmount}`, 'blue');

  // Actualizar stock después de las ventas
  await prisma.product.update({
    where: { id: products[0].id },
    data: { stock: { decrement: 2 } }
  });
  
  await prisma.product.update({
    where: { id: products[4].id },
    data: { stock: { decrement: 3 } }
  });

  // Crear movimientos de inventario para las ventas
  await prisma.inventoryMovement.create({
    data: {
      productId: products[0].id,
      userId: adminUser.id,
      type: 'VENTA',
      movementType: 'VENTA',
      quantity: 2,
      quantityChange: -2,
      reason: `Venta #${sale1.id}`,
      notes: 'Venta de ejemplo',
      relatedSaleId: sale1.id
    }
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: products[4].id,
      userId: adminUser.id,
      type: 'VENTA',
      movementType: 'VENTA',
      quantity: 3,
      quantityChange: -3,
      reason: `Venta #${sale1.id}`,
      notes: 'Venta de ejemplo',
      relatedSaleId: sale1.id
    }
  });

  log('  ✅ Datos de ejemplo creados', 'blue');
}

/**
 * Mostrar resumen final
 */
function printSummary(users, categories, products, suppliers, customers) {
  log('📋 RESUMEN DE LA CONFIGURACIÓN:', 'bright');
  log('', 'reset');
  
  log(`👥 Usuarios creados: ${users.length}`, 'green');
  users.forEach(user => {
    log(`   • ${user.username} (${user.role})`, 'cyan');
  });
  log('', 'reset');

  log(`📂 Categorías creadas: ${categories.length}`, 'green');
  categories.forEach(cat => {
    log(`   • ${cat.name}`, 'cyan');
  });
  log('', 'reset');

  log(`📦 Productos creados: ${products.length}`, 'green');
  log(`🏢 Proveedores creados: ${suppliers.length}`, 'green');
  log(`👤 Clientes creados: ${customers.length}`, 'green');
  log('', 'reset');

  log('🔐 CREDENCIALES DE ACCESO:', 'yellow');
  log('   • Admin: username=admin, password=admin123', 'magenta');
  log('   • Vendedor: username=vendedor1, password=vendedor123', 'magenta');
  log('   • Cajero: username=cajero1, password=cajero123', 'magenta');
  log('', 'reset');

  log('🚀 Para iniciar la aplicación ejecuta:', 'yellow');
  log('   npm run dev', 'cyan');
  log('', 'reset');

  log('💻 Para abrir Prisma Studio ejecuta:', 'yellow');
  log('   npm run prisma:studio', 'cyan');
  log('', 'reset');
}

// Ejecutar el script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { main };
