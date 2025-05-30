"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { IconTrendingUp, IconTrendingDown, IconPackage, IconShoppingCart, IconUsers, IconAlertCircle, IconCurrencyDollar, IconUserCheck, IconCalendar, IconChartBar } from "@tabler/icons-react"
import { TrendingUp, TrendingDown, RotateCcw, AlertTriangle, Package } from 'lucide-react'
// Copia de helpers visuales de movimientos
const getMovementIcon = (type) => {
  const movementType = type || 'UNKNOWN';
  switch (movementType) {
    case 'ENTRY':
    case 'COMPRA_PROVEEDOR':
      return <TrendingUp className="h-4 w-4 text-green-600" />
    case 'EXIT':
    case 'VENTA':
      return <TrendingDown className="h-4 w-4 text-red-600" />
    case 'ADJUSTMENT':
      return <RotateCcw className="h-4 w-4 text-blue-600" />
    case 'DAMAGE':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />
    default:
      return <Package className="h-4 w-4" />
  }
}

const getMovementColor = (type) => {
  const movementType = type || 'UNKNOWN';
  switch (movementType) {
    case 'ENTRY':
    case 'COMPRA_PROVEEDOR':
      return 'bg-green-100 text-green-800'
    case 'EXIT':
    case 'VENTA':
      return 'bg-red-100 text-red-800'
    case 'ADJUSTMENT':
      return 'bg-blue-100 text-blue-800'
    case 'DAMAGE':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getMovementLabel = (type) => {
  const movementType = type || 'UNKNOWN';
  switch (movementType) {
    case 'ENTRY':
      return 'Entrada'
    case 'EXIT':
      return 'Salida'
    case 'ADJUSTMENT':
      return 'Ajuste'
    case 'DAMAGE':
      return 'Daño'
    case 'COMPRA_PROVEEDOR':
      return 'Compra'
    case 'VENTA':
      return 'Venta'
    default:
      return type
  }
}

export default function DashboardPage() {  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockProducts: 0,
    totalSuppliers: 0,
    recentPurchases: 0,
    totalCategories: 0,
    recentMovements: 0,
    totalSales: 0,
    totalCustomers: 0,
    todaysSales: 0,
    weeklySales: 0
  })
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [recentPurchases, setRecentPurchases] = useState([])
  const [recentMovements, setRecentMovements] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Obtener estadísticas generales
      const [productsRes, suppliersRes, categoriesRes, purchasesRes, movementsRes, salesRes, customersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/suppliers'),
        fetch('/api/categories'),
        fetch('/api/purchases'),
        fetch('/api/inventory-movements'),
        fetch('/api/sales?limit=100'),
        fetch('/api/customers')
      ])

      const products = await productsRes.json()
      const suppliers = await suppliersRes.json()
      const categories = await categoriesRes.json()
      const purchases = await purchasesRes.json()
      const movements = await movementsRes.json()
      const salesData = await salesRes.json()
      const customers = await customersRes.json()

      // Extraer el array de ventas del objeto respuesta
      const sales = Array.isArray(salesData) ? salesData : (salesData.sales || [])

      // Calcular estadísticas de ventas
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const todaysSales = sales.filter(sale => 
        sale.saleDate && sale.saleDate.startsWith(todayStr)
      ).length
      
      const weeklySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate)
        return saleDate >= weekAgo
      }).length

      // Calcular estadísticas
      const lowStock = Array.isArray(products) ? products.filter(p => p.stock < 10) : []
      const recentPurchasesData = Array.isArray(purchases) ? purchases.slice(0, 5) : []
      const recentMovementsData = Array.isArray(movements) ? movements.slice(0, 5) : []
      const recentSalesData = sales.slice(0, 5)

      setStats({
        totalProducts: Array.isArray(products) ? products.length : 0,
        lowStockProducts: lowStock.length,
        totalSuppliers: Array.isArray(suppliers) ? suppliers.length : 0,
        recentPurchases: Array.isArray(purchases) ? purchases.length : 0,
        totalCategories: Array.isArray(categories) ? categories.length : 0,
        recentMovements: Array.isArray(movements) ? movements.length : 0,
        totalSales: sales.length,
        totalCustomers: Array.isArray(customers) ? customers.length : 0,
        todaysSales: todaysSales,
        weeklySales: weeklySales
      })

      setLowStockProducts(lowStock)
      setRecentPurchases(recentPurchasesData)
      setRecentMovements(recentMovementsData)
      setRecentSales(recentSalesData)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return <div className="p-6">Cargando dashboard...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de Papelon Store</p>
      </div>      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <IconPackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              productos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <IconAlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              productos con stock menor a 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <IconCurrencyDollar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              ventas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <IconUserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              clientes registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              proveedores activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras Totales</CardTitle>
            <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentPurchases}</div>
            <p className="text-xs text-muted-foreground">
              compras registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <IconCalendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todaysSales}</div>
            <p className="text-xs text-muted-foreground">
              ventas realizadas hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <IconPackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              categorías de productos
            </p>
          </CardContent>
        </Card>
      </div>      {/* Alertas y tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos con stock bajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconAlertCircle className="h-5 w-5 text-orange-600" />
              Productos con Stock Bajo
            </CardTitle>
            <CardDescription>
              Productos que necesitan reposición (stock {'<'} 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos con stock bajo</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Stock Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{product.stock}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Ventas recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCurrencyDollar className="h-5 w-5 text-green-600" />
              Ventas Recientes
            </CardTitle>
            <CardDescription>
              Últimas 5 ventas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ventas recientes</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.customer?.name || sale.customerName || 'Cliente general'}
                      </TableCell>
                      <TableCell>{formatDate(sale.saleDate || sale.createdAt)}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        ${sale.totalAmount?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Compras recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShoppingCart className="h-5 w-5 text-blue-600" />
              Compras Recientes
            </CardTitle>
            <CardDescription>
              Últimas 5 compras realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay compras recientes</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {purchase.supplier?.name || 'Sin proveedor'}
                      </TableCell>
                      <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        ${purchase.totalAmount?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos y métricas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accesos rápidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartBar className="h-5 w-5 text-purple-600" />
              Accesos Rápidos
            </CardTitle>
            <CardDescription>
              Enlaces rápidos a funcionalidades principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="/dashboard/sales" 
                className="flex items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <IconCurrencyDollar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Ventas</span>
              </a>
              <a 
                href="/dashboard/customers" 
                className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <IconUserCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Clientes</span>
              </a>
              <a 
                href="/dashboard/purchases" 
                className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <IconShoppingCart className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Compras</span>
              </a>
              <a 
                href="/dashboard/reports" 
                className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <IconChartBar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Reportes</span>
              </a>
              <a 
                href="/dashboard/inventory" 
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <IconPackage className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Inventario</span>
              </a>
              <a 
                href="/dashboard/movements" 
                className="flex items-center gap-2 p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <IconTrendingUp className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium">Movimientos</span>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de la semana */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalendar className="h-5 w-5 text-indigo-600" />
              Métricas de la Semana
            </CardTitle>
            <CardDescription>
              Resumen de actividad de los últimos 7 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCurrencyDollar className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Ventas esta semana</span>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {stats.weeklySales}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCalendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Ventas hoy</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {stats.todaysSales}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconAlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Productos con stock bajo</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">
                  {stats.lowStockProducts}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconTrendingUp className="h-4 w-4 text-teal-600" />
                  <span className="text-sm">Movimientos totales</span>
                </div>
                <Badge className="bg-teal-100 text-teal-800">
                  {stats.recentMovements}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movimientos recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconTrendingUp className="h-5 w-5 text-green-600" />
            Movimientos de Inventario Recientes
          </CardTitle>
          <CardDescription>
            Últimos 5 movimientos de inventario
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay movimientos recientes</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">
                      {movement.product?.name || 'Producto no encontrado'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getMovementColor(movement.movementType || movement.type)}>
                        <div className="flex items-center gap-1">
                          {getMovementIcon(movement.movementType || movement.type)}
                          {getMovementLabel(movement.movementType || movement.type)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const type = movement.movementType || movement.type;
                        let value = '-';
                        if (typeof movement.quantity === 'number') {
                          value = Math.abs(movement.quantity);
                        } else if (typeof movement.quantityChange === 'number') {
                          value = Math.abs(movement.quantityChange);
                        }
                        const isNegative = (['EXIT', 'DAMAGE', 'VENTA'].includes(type) || (typeof movement.quantityChange === 'number' && movement.quantityChange < 0) || (typeof movement.quantity === 'number' && movement.quantity < 0));
                        return (
                          <span className={isNegative ? 'text-red-600' : 'text-green-600'}>
                            {value !== '-' ? (isNegative ? '-' : '+') : ''}{value}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>{formatDate(movement.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
