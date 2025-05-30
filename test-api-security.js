#!/usr/bin/env node

/**
 * Security Test Script - API Endpoint Protection
 * Tests that all API endpoints are properly protected with authentication
 */

const BASE_URL = 'http://localhost:3000';

const API_ENDPOINTS = [
  // Products
  { method: 'GET', url: '/api/products' },
  { method: 'POST', url: '/api/products' },
  { method: 'GET', url: '/api/products/test-id' },
  { method: 'PUT', url: '/api/products/test-id' },
  { method: 'DELETE', url: '/api/products/test-id' },
  
  // Categories
  { method: 'GET', url: '/api/categories' },
  { method: 'POST', url: '/api/categories' },
  { method: 'GET', url: '/api/categories/test-id' },
  { method: 'PUT', url: '/api/categories/test-id' },
  { method: 'DELETE', url: '/api/categories/test-id' },
  
  // Suppliers
  { method: 'GET', url: '/api/suppliers' },
  { method: 'POST', url: '/api/suppliers' },
  { method: 'GET', url: '/api/suppliers/test-id' },
  { method: 'PUT', url: '/api/suppliers/test-id' },
  { method: 'DELETE', url: '/api/suppliers/test-id' },
  
  // Customers
  { method: 'GET', url: '/api/customers' },
  { method: 'POST', url: '/api/customers' },
  { method: 'GET', url: '/api/customers/test-id' },
  { method: 'PUT', url: '/api/customers/test-id' },
  { method: 'DELETE', url: '/api/customers/test-id' },
  
  // Sales
  { method: 'GET', url: '/api/sales' },
  { method: 'POST', url: '/api/sales' },
  { method: 'GET', url: '/api/sales/test-id' },
  { method: 'GET', url: '/api/sales/stats' },
  { method: 'GET', url: '/api/sales/reports' },
  { method: 'GET', url: '/api/sales/products' },
  
  // Purchases
  { method: 'GET', url: '/api/purchases' },
  { method: 'POST', url: '/api/purchases' },
  { method: 'GET', url: '/api/purchases/test-id' },
  
  // Inventory
  { method: 'GET', url: '/api/inventory-movements' },
  { method: 'POST', url: '/api/inventory-movements' },
  { method: 'GET', url: '/api/inventory/report' },
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.url}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
      // No authentication headers - should be rejected
    });

    const status = response.status;
    const isProtected = status === 401;
    
    return {
      endpoint: `${endpoint.method} ${endpoint.url}`,
      status,
      protected: isProtected,
      success: isProtected
    };
  } catch (error) {
    return {
      endpoint: `${endpoint.method} ${endpoint.url}`,
      error: error.message,
      protected: false,
      success: false
    };
  }
}

async function runSecurityTest() {
  console.log('🔒 API Security Test - Verifying Endpoint Protection');
  console.log('=' .repeat(60));
  console.log('Testing that all API endpoints return 401 Unauthorized without authentication...\n');

  const results = [];
  let protected = 0;
  let total = 0;

  for (const endpoint of API_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    total++;
    
    if (result.success) {
      protected++;
      console.log(`✅ ${result.endpoint} - PROTECTED (${result.status})`);
    } else {
      console.log(`❌ ${result.endpoint} - VULNERABLE (${result.status || result.error})`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log(`🛡️  SECURITY TEST RESULTS:`);
  console.log(`   Protected: ${protected}/${total} endpoints`);
  console.log(`   Success Rate: ${Math.round((protected/total) * 100)}%`);
  
  if (protected === total) {
    console.log(`\n🎉 ALL ENDPOINTS ARE PROPERLY PROTECTED!`);
    console.log(`   All API routes correctly return 401 Unauthorized without authentication.`);
  } else {
    console.log(`\n⚠️  SECURITY VULNERABILITIES DETECTED!`);
    console.log(`   ${total - protected} endpoints are not properly protected.`);
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. Ensure server is running (npm run dev)');
  console.log('   2. Test authenticated access through the web interface');
  console.log('   3. Verify user roles and permissions work correctly');
  
  return protected === total;
}

// Run the test
runSecurityTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
