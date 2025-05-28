"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ExportButton, EditButton, ActionButton } from "@/components/ui/action-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconChartBar, IconAlertTriangle, IconPackage, IconRefresh, IconDownload, IconCurrencyDollar, IconEdit, IconEye, IconEyeOff, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

// Helper function to format dates consistently
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
}

export default function InventoryPage() {
  const [report, setReport] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchReport()
    fetchProducts()
  }, [showInactive])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/report')
      if (response.ok) {
        const data = await response.json()
        setReport(data)
      } else {
        toast.error('Error al cargar reporte de inventario')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar reporte de inventario')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const url = `/api/products${showInactive ? '?includeInactive=true' : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      } else {
        toast.error('Error al cargar productos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar productos')
    }
  }

  const getStockStatusBadge = (stock) => {
    if (stock === 0) {
      return <Badge variant="destructive">Sin Stock</Badge>
    } else if (stock <= 10) {
      return <Badge variant="secondary">Stock Bajo</Badge>
    } else {
      return <Badge variant="default">Stock Normal</Badge>
    }
  }

  const toggleProductStatus = async (product) => {
    try {
      if (product.isActive) {
        const res = await fetch(`/api/products/${product.id}`, {
          method: 'DELETE'
        })
        const result = await res.json()
        
        if (result.deactivated) {
          toast.success('Producto desactivado (tiene historial de transacciones)')
        } else {
          toast.success('Producto eliminado')
        }
      } else {
        const res = await fetch(`/api/products/${product.id}/reactivate`, {
          method: 'PUT'
        })
        if (!res.ok) throw new Error('Error reactivating product')
        toast.success('Producto reactivado')
      }
      
      fetchProducts()
      fetchReport()
    } catch (error) {
      console.error(error)
      toast.error('Error al cambiar estado del producto')
    }
  }

  const exportToCSV = () => {
    if (!report) return

    const csvData = [
      ['Producto', 'SKU', 'Categoría', 'Stock', 'Costo Unitario', 'Precio', 'Valor Total', 'Estado', 'Fecha Creación'],
      ...filteredProducts.map(product => [
        product.name || '',
        product.sku || '',
        product.category?.name || '',
        product.stock || 0,
        (product.cost || 0).toFixed(2),
        (product.price || 0).toFixed(2),
        ((product.stock || 0) * (product.cost || 0)).toFixed(2),
        product.isActive ? 'Activo' : 'Inactivo',
        formatDate(product.createdAt)
      ]),
      [],
      ['RESUMEN POR CATEGORÍA'],
      ['Categoría', 'Productos', 'Stock Total', 'Valor Total'],
      ...(report.categoryInventory || []).map(category => [
        category.name || '',
        category.productCount || 0,
        category.totalStock || 0,
        (category.totalValue || 0).toFixed(2)
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventario_completo_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Inventario exportado correctamente')
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="p-6">Cargando reporte de inventario...</div>
  }

  if (!report) {
    return <div className="p-6">Error al cargar reporte</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Reporte completo del inventario actual</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => { fetchReport(); fetchProducts(); }}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <ExportButton onClick={exportToCSV}>
            <IconDownload className="h-4 w-4 mr-2" />
            Exportar CSV
          </ExportButton>
        </div>
      </div>

      {/* Resumen General */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <IconPackage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalStock}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${report.summary.totalInventoryValue}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {report.summary.lowStockCount + report.summary.outOfStockCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y Filtros</CardTitle>
          <CardDescription>
            Busca productos y filtra por estado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Buscar productos</Label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, SKU o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showInactive" 
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="showInactive">Mostrar productos inactivos</Label>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Limpiar Búsqueda
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla Completa de Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Todos los Productos</CardTitle>
          <CardDescription>
            {filteredProducts.length} productos encontrados de {products.length} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron productos que coincidan con la búsqueda' : 'No hay productos registrados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className={!product.isActive ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {getStockStatusBadge(product.stock)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconPackage className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {product.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell>
                      <span className={product.stock === 0 ? 'text-red-600 font-medium' : product.stock <= 10 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <IconCurrencyDollar className="h-4 w-4 text-green-600 mr-1" />
                        <span className="font-mono">{product.cost?.toFixed(2) || '0.00'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <IconCurrencyDollar className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="font-mono">{product.price?.toFixed(2) || '0.00'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <IconCurrencyDollar className="h-4 w-4 text-green-700 mr-1" />
                        <span className="font-mono font-medium">
                          {((product.stock || 0) * (product.cost || 0)).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{product.sku || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <EditButton 
                          onClick={() => window.location.href = '/dashboard/products'}
                          disabled={!product.isActive}
                          title={!product.isActive ? 'Reactivar producto para editar' : 'Ir a productos para editar'}
                        >
                          <IconEdit className="h-4 w-4" />
                        </EditButton>
                        <ActionButton
                          variant={product.isActive ? "destructive" : "default"}
                          onClick={() => toggleProductStatus(product)}
                          title={product.isActive ? 'Desactivar producto' : 'Reactivar producto'}
                        >
                          {product.isActive ? (
                            <IconEyeOff className="h-4 w-4" />
                          ) : (
                            <IconEye className="h-4 w-4" />
                          )}
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inventario por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Inventario por Categoría</CardTitle>
          <CardDescription>
            Resumen del stock y valor por categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Stock Total</TableHead>
                <TableHead>Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.categoryInventory.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.productCount}</TableCell>
                  <TableCell>{category.totalStock}</TableCell>
                  <TableCell>${category.totalValue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Movimientos Recientes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Recientes</CardTitle>
          <CardDescription>
            Últimos movimientos de inventario (7 días)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.recentMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    {formatDate(movement.movementDate)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {movement.product?.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={movement.type === 'VENTA' ? 'destructive' : 'default'}>
                      {movement.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={movement.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}>
                    {movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}
                  </TableCell>
                  <TableCell>{movement.user?.username}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {report.recentMovements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay movimientos recientes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
