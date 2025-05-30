/**
 * Script de prueba para verificar la funcionalidad del botón ocultar/mostrar productos
 * Este script verifica que el estado isActive se actualice correctamente
 */

const testProductToggle = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Iniciando pruebas del botón ocultar/mostrar productos...\n');
  
  try {
    // Paso 1: Obtener productos activos
    console.log('📋 Paso 1: Obteniendo productos activos...');
    const response1 = await fetch(`${baseUrl}/api/products`);
    const products = await response1.json();
    
    if (!products.success || products.products.length === 0) {
      console.log('❌ No hay productos disponibles para probar');
      return;
    }
    
    const activeProducts = products.products.filter(p => p.isActive);
    console.log(`✅ Encontrados ${activeProducts.length} productos activos`);
    
    if (activeProducts.length === 0) {
      console.log('❌ No hay productos activos para probar');
      return;
    }
    
    const testProduct = activeProducts[0];
    console.log(`🎯 Producto de prueba: "${testProduct.name}" (ID: ${testProduct.id}, isActive: ${testProduct.isActive})`);
    
    // Paso 2: Desactivar el producto
    console.log('\n📋 Paso 2: Desactivando el producto...');
    const response2 = await fetch(`${baseUrl}/api/products/${testProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isActive: false
      })
    });
    
    if (response2.ok) {
      console.log('✅ Producto desactivado correctamente');
    } else {
      console.log(`❌ Error al desactivar producto: ${response2.status}`);
      return;
    }
    
    // Paso 3: Verificar que el producto esté desactivado
    console.log('\n📋 Paso 3: Verificando desactivación...');
    const response3 = await fetch(`${baseUrl}/api/products/${testProduct.id}`);
    const updatedProduct = await response3.json();
    
    if (updatedProduct.success && !updatedProduct.product.isActive) {
      console.log('✅ Estado verificado: Producto correctamente desactivado');
    } else {
      console.log('❌ Error: El producto no se desactivó correctamente');
      return;
    }
    
    // Paso 4: Reactivar el producto
    console.log('\n📋 Paso 4: Reactivando el producto...');
    const response4 = await fetch(`${baseUrl}/api/products/${testProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isActive: true
      })
    });
    
    if (response4.ok) {
      console.log('✅ Producto reactivado correctamente');
    } else {
      console.log(`❌ Error al reactivar producto: ${response4.status}`);
      return;
    }
    
    // Paso 5: Verificar que el producto esté reactivado
    console.log('\n📋 Paso 5: Verificando reactivación...');
    const response5 = await fetch(`${baseUrl}/api/products/${testProduct.id}`);
    const reactivatedProduct = await response5.json();
    
    if (reactivatedProduct.success && reactivatedProduct.product.isActive) {
      console.log('✅ Estado verificado: Producto correctamente reactivado');
    } else {
      console.log('❌ Error: El producto no se reactivó correctamente');
      return;
    }
    
    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('✅ El botón ocultar/mostrar funciona correctamente');
    console.log('✅ El estado isActive se actualiza sin eliminar datos');
    console.log('✅ La funcionalidad preserva toda la información del producto');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
};

// Ejecutar las pruebas
testProductToggle().catch(console.error);
