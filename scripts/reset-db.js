const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🗑️  Limpiando base de datos...');

    // Eliminar todos los datos en orden correcto debido a foreign keys
    await prisma.saleReturnItem.deleteMany({});
    console.log('   ✅ Elementos de devolución eliminados');

    await prisma.saleReturn.deleteMany({});
    console.log('   ✅ Devoluciones eliminadas');

    await prisma.inventoryMovement.deleteMany({});
    console.log('   ✅ Movimientos de inventario eliminados');

    await prisma.saleItem.deleteMany({});
    console.log('   ✅ Elementos de venta eliminados');

    await prisma.sale.deleteMany({});
    console.log('   ✅ Ventas eliminadas');

    await prisma.purchaseItem.deleteMany({});
    console.log('   ✅ Elementos de compra eliminados');

    await prisma.purchase.deleteMany({});
    console.log('   ✅ Compras eliminadas');

    await prisma.expense.deleteMany({});
    console.log('   ✅ Gastos eliminados');

    await prisma.cashRegisterSession.deleteMany({});
    console.log('   ✅ Sesiones de caja eliminadas');

    await prisma.product.deleteMany({});
    console.log('   ✅ Productos eliminados');

    await prisma.category.deleteMany({});
    console.log('   ✅ Categorías eliminadas');

    await prisma.supplier.deleteMany({});
    console.log('   ✅ Proveedores eliminados');

    await prisma.customer.deleteMany({});
    console.log('   ✅ Clientes eliminados');

    await prisma.user.deleteMany({});
    console.log('   ✅ Usuarios eliminados');

    console.log('🎉 Base de datos limpiada exitosamente');
  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };
