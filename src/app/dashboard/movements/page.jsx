'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ClearButton, ExportButton } from '@/components/ui/action-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Package, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, Download, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

export default function MovementsPage() {
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    movementType: 'ENTRY',
    quantity: '',
    reason: '',
    notes: ''
  })
  
  // Filters
  const [filters, setFilters] = useState({
    productId: 'all',
    movementType: 'all',
    dateFrom: '',
    dateTo: ''
  })

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })

  useEffect(() => {
    fetchMovements()
    fetchProducts()
  }, [])

  const fetchMovements = async () => {
    try {
      const response = await fetch('/api/inventory-movements')
      if (response.ok) {
        const data = await response.json()
        setMovements(data)
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
      toast.error('Error al cargar los movimientos')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.productId || !formData.quantity || !formData.reason) {
      toast.error('Por favor complete todos los campos requeridos')
      return
    }

    try {
      const response = await fetch('/api/inventory-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity)
        })
      })

      if (response.ok) {
        toast.success('Movimiento registrado exitosamente')
        setIsDialogOpen(false)
        setFormData({
          productId: '',
          movementType: 'ENTRY',
          quantity: '',
          reason: '',
          notes: ''
        })
        fetchMovements()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al registrar el movimiento')
      }
    } catch (error) {
      console.error('Error creating movement:', error)
      toast.error('Error al registrar el movimiento')
    }
  }
  const getMovementIcon = (type) => {
    // Manejar tanto tipos nuevos como antiguos
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
  const filteredMovements = movements.filter(movement => {
    const movementType = movement.movementType || movement.type;
    
    if (filters.productId && filters.productId !== 'all' && movement.productId !== filters.productId) return false
    if (filters.movementType && filters.movementType !== 'all' && movementType !== filters.movementType) return false
    if (filters.dateFrom && new Date(movement.createdAt) < new Date(filters.dateFrom)) return false
    if (filters.dateTo && new Date(movement.createdAt) > new Date(filters.dateTo + 'T23:59:59')) return false
    return true
  })

  // Sorting functions
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedMovements = useMemo(() => {
    if (!sortConfig.key) return filteredMovements
    
    const sorted = [...filteredMovements].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]
      
      // Manejo especial para nombres de productos
      if (sortConfig.key === 'productName') {
        aValue = a.product?.name || ''
        bValue = b.product?.name || ''
      }
      
      // Manejo especial para tipos de movimiento
      if (sortConfig.key === 'movementType') {
        aValue = getMovementLabel(a.movementType || a.type)
        bValue = getMovementLabel(b.movementType || b.type)
      }
      
      // Manejo especial para cantidades
      if (sortConfig.key === 'quantity') {
        aValue = a.quantityChange || a.quantity || 0
        bValue = b.quantityChange || b.quantity || 0
      }
      
      // Para fechas usar Date
      if (sortConfig.key === 'createdAt') {
        aValue = new Date(aValue)
        bValue = new Date(bValue)
      }
      
      // Para strings ignorar mayúsculas/minúsculas
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredMovements, sortConfig])

  // Obtener tipos únicos de movimientos para el filtro
  const uniqueMovementTypes = [...new Set(movements.map(movement => movement.movementType || movement.type))]
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Cargando movimientos...</div>
      </div>
    )
  }
  // Función para exportar movimientos filtrados a CSV
  const exportToCSV = () => {
    if (sortedMovements.length === 0) {
      toast.error('No hay movimientos para exportar')
      return
    }

    const csvData = [
      ['Fecha', 'Producto', 'SKU', 'Tipo de Movimiento', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Razón', 'Notas'],
      ...sortedMovements.map(movement => [
        formatDate(movement.createdAt),
        movement.product?.name || 'N/A',
        movement.product?.sku || 'N/A',
        getMovementLabel(movement.movementType || movement.type),
        movement.quantityChange || movement.quantity || 0,
        movement.previousStock || 'N/A',
        movement.newStock || 'N/A',
        movement.reason || 'N/A',
        movement.notes || 'N/A'
      ])
    ]

    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    const dateRange = filters.dateFrom || filters.dateTo 
      ? `_${filters.dateFrom || 'inicio'}_a_${filters.dateTo || 'hoy'}`
      : `_${new Date().toISOString().split('T')[0]}`
    
    a.download = `movimientos_inventario${dateRange}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Movimientos exportados correctamente')
  }

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      productId: 'all',
      movementType: 'all',
      dateFrom: '',
      dateTo: ''
    })
  }

  // Helper function to format dates consistently
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos de Inventario</h1>
          <p className="text-muted-foreground">
            Gestiona los movimientos manuales de inventario
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Movimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <div>
              <DialogHeader>
                <DialogTitle>Registrar Movimiento</DialogTitle>
                <DialogDescription>
                  Registra un movimiento manual de inventario
                </DialogDescription>
            </DialogHeader>
              <div className="bg-white p-4 rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="productId" className="mb-2 block">Producto *</Label>
                    <Select
                      value={formData.productId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Selecciona un producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - Stock: {product.stock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="movementType" className="mb-2 block">Tipo de Movimiento *</Label>
                    <Select
                      value={formData.movementType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, movementType: value }))}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRY">Entrada</SelectItem>
                        <SelectItem value="EXIT">Salida</SelectItem>
                        <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                        <SelectItem value="DAMAGE">Daño</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity" className="mb-2 block">Cantidad *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      className="bg-white"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Ingresa la cantidad"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reason" className="mb-2 block">Razón *</Label>
                    <Input
                      id="reason"
                      className="bg-white"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Ej: Inventario físico, producto dañado, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="mb-2 block">Notas</Label>
                    <Input
                      id="notes"
                      className="bg-white"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notas adicionales (opcional)"
                    />
                  </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="bg-red-500 text-white hover:bg-red-600">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">Registrar</Button>
                </div>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Exportación</CardTitle>
          <CardDescription>
            Filtra los movimientos por fecha, producto y tipo. Exporta los resultados filtrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <Label className="mb-2 block">Producto</Label>
              <Select
                value={filters.productId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, productId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los productos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los productos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Tipo</Label>
              <Select
                value={filters.movementType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, movementType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {/* Tipos nuevos */}
                  <SelectItem value="ENTRY">Entrada</SelectItem>
                  <SelectItem value="EXIT">Salida</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                  <SelectItem value="DAMAGE">Daño</SelectItem>
                  {/* Tipos antiguos del sistema */}
                  <SelectItem value="COMPRA_PROVEEDOR">Compra</SelectItem>
                  <SelectItem value="VENTA">Venta</SelectItem>
                  {/* Tipos dinámicos adicionales si existen */}
                  {uniqueMovementTypes
                    .filter(type => !['ENTRY', 'EXIT', 'ADJUSTMENT', 'DAMAGE', 'COMPRA_PROVEEDOR', 'VENTA'].includes(type))
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {getMovementLabel(type)}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Fecha Desde</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="bg-white"              />
            </div>
            <div>
              <Label className="mb-2 block">Fecha Hasta</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="bg-white"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end sm:justify-end mt-4 sm:mt-0">
              <ExportButton onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </ExportButton>
              <ClearButton onClick={clearFilters}>
                Limpiar Filtros
              </ClearButton>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
          <CardDescription>
            {sortedMovements.length} movimientos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    onClick={() => handleSort('createdAt')} 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Fecha</span>
                      {sortConfig.key === 'createdAt' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('productName')} 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Producto</span>
                      {sortConfig.key === 'productName' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('movementType')} 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors hidden sm:table-cell"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tipo</span>
                      {sortConfig.key === 'movementType' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('quantity')} 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Cantidad</span>
                      {sortConfig.key === 'quantity' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('reason')} 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors hidden md:table-cell"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Razón</span>
                      {sortConfig.key === 'reason' && (
                        sortConfig.direction === 'asc' ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Notas</TableHead>
                  <TableHead className="hidden xl:table-cell">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron movimientos
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.createdAt).toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{movement.product?.name || 'Producto no encontrado'}</div>
                      <div className="text-sm text-muted-foreground">
                        SKU: {movement.product?.sku || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className={getMovementColor(movement.movementType || movement.type)}>
                        <div className="flex items-center gap-1">
                          {getMovementIcon(movement.movementType || movement.type)}
                          {getMovementLabel(movement.movementType || movement.type)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={
                        (movement.movementType === 'EXIT' || movement.movementType === 'DAMAGE' || 
                          movement.type === 'VENTA' || movement.quantityChange < 0) 
                          ? 'text-red-600 font-medium' : 'text-green-600 font-medium'
                      }>
                        {movement.quantityChange < 0 ? '' : '+'}
                        {movement.quantity || Math.abs(movement.quantityChange)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{movement.reason || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{movement.notes || '-'}</TableCell>
                    <TableCell className="text-sm hidden xl:table-cell">{movement.user?.username || 'Sistema'}</TableCell>
                  </TableRow>                ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
