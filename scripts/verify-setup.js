#!/usr/bin/env node

/**
 * Script para verificar que la configuración de la base de datos esté completa
 * Ejecutar con: npm run verify
 */

const { PrismaClient } = require('@prisma/client');

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
    log('🔍 Verificando configuración de la base de datos...', 'bright');
    log('', 'reset');

    // Verificar usuarios
    const users = await prisma.user.findMany();
    log(`👥 Usuarios encontrados: ${users.length}`, users.length > 0 ? 'green' : 'red');
    users.forEach(user => {
      log(`   • ${user.username} (${user.role})`, 'cyan');
    });
    log('', 'reset');

    // Verificar categorías
    const categories = await prisma.category.findMany();
    log(`📂 Categorías encontradas: ${categories.length}`, categories.length > 0 ? 'green' : 'red');
    categories.forEach(cat => {
      log(`   • ${cat.name}`, 'cyan');
    });
    log('', 'reset');

    // Verificar productos
    const products = await prisma.product.findMany({
      include: { category: true }
    });
    log(`📦 Productos encontrados: ${products.length}`, products.length > 0 ? 'green' : 'red');
    products.slice(0, 5).forEach(product => {
      log(`   • ${product.name} (Stock: ${product.stock}, Categoría: ${product.category?.name || 'N/A'})`, 'cyan');
    });
    if (products.length > 5) {
      log(`   ... y ${products.length - 5} más`, 'cyan');
    }
    log('', 'reset');

    // Verificar proveedores
    const suppliers = await prisma.supplier.findMany();
    log(`🏢 Proveedores encontrados: ${suppliers.length}`, suppliers.length > 0 ? 'green' : 'red');
    suppliers.forEach(supplier => {
      log(`   • ${supplier.name}`, 'cyan');
    });
    log('', 'reset');

    // Verificar clientes
    const customers = await prisma.customer.findMany();
    log(`👤 Clientes encontrados: ${customers.length}`, customers.length > 0 ? 'green' : 'red');
    customers.forEach(customer => {
      log(`   • ${customer.name}`, 'cyan');
    });
    log('', 'reset');

    // Verificar compras
    const purchases = await prisma.purchase.findMany({
      include: { items: true }
    });
    log(`📥 Compras encontradas: ${purchases.length}`, purchases.length > 0 ? 'green' : 'red');
    purchases.forEach(purchase => {
      log(`   • Total: $${purchase.totalAmount} (${purchase.items.length} items)`, 'cyan');
    });
    log('', 'reset');

    // Verificar ventas
    const sales = await prisma.sale.findMany({
      include: { items: true }
    });
    log(`📤 Ventas encontradas: ${sales.length}`, sales.length > 0 ? 'green' : 'red');
    sales.forEach(sale => {
      log(`   • Total: $${sale.totalAmount} (${sale.items.length} items)`, 'cyan');
    });
    log('', 'reset');

    // Verificar movimientos de inventario
    const movements = await prisma.inventoryMovement.findMany();
    log(`📊 Movimientos de inventario: ${movements.length}`, movements.length > 0 ? 'green' : 'red');
    log('', 'reset');

    // Resumen general
    const totalRecords = users.length + categories.length + products.length + 
                        suppliers.length + customers.length + purchases.length + 
                        sales.length + movements.length;

    if (totalRecords > 0) {
      log('✅ ¡Base de datos configurada correctamente!', 'green');
      log(`📊 Total de registros: ${totalRecords}`, 'bright');
      log('', 'reset');
      log('🔐 Credenciales para hacer login:', 'yellow');
      log('   • Username: admin, Password: admin123', 'magenta');
      log('   • Username: vendedor1, Password: vendedor123', 'magenta');
      log('   • Username: cajero1, Password: cajero123', 'magenta');
    } else {
      log('❌ La base de datos parece estar vacía', 'red');
      log('   Ejecuta: npm run setup', 'yellow');
    }

  } catch (error) {
    log('❌ Error durante la verificación:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { main };
