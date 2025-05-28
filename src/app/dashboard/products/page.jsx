"use client"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { EditButton, ActionButton } from '@/components/ui/action-button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  IconEdit, 
  IconEye, 
  IconEyeOff, 
  IconPackage, 
  IconChevronUp, 
  IconChevronDown,
  IconRefresh,
  IconDownload,
  IconPlus,
  IconAlertTriangle,
  IconCircleCheck
} from '@tabler/icons-react'

// Helper para obtener el color del stock
function getStockColor(stock) {
  if (stock === 0) return 'text-red-600 font-bold';
  if (stock <= 10) return 'text-orange-600 font-semibold';
  return 'text-emerald-600 font-medium';
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    cost: '', 
    stock: '', 
    sku: '', 
    categoryId: '' 
  })
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Funciones de ordenamiento
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedProducts = useMemo(() => {
    if (!sortConfig.key) return products
    
    const sorted = [...products].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]
      
      // Manejo especial para categorías
      if (sortConfig.key === 'categoryId') {
        aValue = a.category?.name || ''
        bValue = b.category?.name || ''
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
  }, [products, sortConfig])

  // Estadísticas de productos
  const productStats = useMemo(() => {
    const activeProducts = products.filter(p => p.isActive)
    const lowStock = activeProducts.filter(p => p.stock <= 10 && p.stock > 0)
    const outOfStock = activeProducts.filter(p => p.stock === 0)
    const totalValue = activeProducts.reduce((sum, p) => sum + (p.price * p.stock), 0)
    
    return {
      total: activeProducts.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      totalValue
    }
  }, [products])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const url = `/api/products${showInactive ? '?includeInactive=true' : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error fetching products')
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error(error)
      toast.error('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Error fetching categories')
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error(err)
      toast.error('No se pudieron cargar las categorías')
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [showInactive])

  const openNew = () => {
    setEditingProduct(null)
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      cost: '', 
      stock: '', 
      sku: '', 
      categoryId: '' 
    })
    setOpenDrawer(true)
  }

  const openEdit = (prod) => {
    setEditingProduct(prod)
    setFormData({ 
      name: prod.name, 
      description: prod.description || '', 
      price: prod.price.toString(), 
      cost: prod.cost.toString(), 
      stock: prod.stock.toString(), 
      sku: prod.sku || '', 
      categoryId: prod.categoryId || '' 
    })
    setOpenDrawer(true)
  }

  const toggleProductStatus = async (product) => {
    try {
      if (product.isActive) {
        // Deactivate product
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
        // Reactivate product
        const res = await fetch(`/api/products/${product.id}/reactivate`, {
          method: 'PUT'
        })
        if (!res.ok) throw new Error('Error reactivating product')
        toast.success('Producto reactivado')
      }
      
      fetchProducts()
    } catch (error) {
      console.error(error)
      toast.error('Error al cambiar estado del producto')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingProduct ? 'PUT' : 'POST'
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost),
          stock: parseInt(formData.stock, 10),
          sku: formData.sku || undefined,
          categoryId: formData.categoryId || null
        })
      })
      if (!res.ok) throw new Error('Error saving product')
      toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado')
      setOpenDrawer(false)
      fetchProducts()
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar producto')
    }
  }

  const exportProducts = () => {
    const csvContent = [
      ['Nombre', 'Categoría', 'Precio', 'Costo', 'Stock', 'SKU', 'Estado'].join(','),
      ...products.map(p => [
        p.name,
        p.category?.name || '',
        p.price,
        p.cost,
        p.stock,
        p.sku || '',
        p.isActive ? 'Activo' : 'Inactivo'
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Productos exportados exitosamente')
  }
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header con título y acciones */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Gestiona el inventario y catálogo de productos
          </p>
        </div>
        
        {/* Botones de acción responsivos */}
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <IconRefresh className="h-4 w-4" />
            Actualizar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportProducts}
            className="flex items-center gap-2"
          >
            <IconDownload className="h-4 w-4" />
            Exportar
          </Button>
          <Button 
            onClick={openNew} 
            size="sm"
            className="flex items-center gap-2"
          >
            <IconPlus className="h-4 w-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IconPackage className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{productStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IconAlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">{productStats.lowStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <IconCircleCheck className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sin Stock</p>
                <p className="text-2xl font-bold text-red-600">{productStats.outOfStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                ${productStats.totalValue.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>      {/* Tabla de productos */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl">Lista de Productos</CardTitle>
              <CardDescription>
                {products.length} productos registrados
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showInactive" 
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="showInactive" className="text-sm">
                Mostrar inactivos
              </Label>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2">
                <IconRefresh className="h-4 w-4 animate-spin" />
                <span>Cargando productos...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      onClick={() => handleSort('isActive')} 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Estado</span>
                        {sortConfig.key === 'isActive' && (
                          sortConfig.direction === 'asc' ? 
                          <IconChevronUp className="h-4 w-4" /> : 
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleSort('name')} 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Nombre</span>
                        {sortConfig.key === 'name' && (
                          sortConfig.direction === 'asc' ? 
                          <IconChevronUp className="h-4 w-4" /> : 
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleSort('categoryId')} 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Categoría</span>
                        {sortConfig.key === 'categoryId' && (
                          sortConfig.direction === 'asc' ? 
                          <IconChevronUp className="h-4 w-4" /> : 
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleSort('price')} 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Precio</span>
                        {sortConfig.key === 'price' && (
                          sortConfig.direction === 'asc' ? 
                          <IconChevronUp className="h-4 w-4" /> : 
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleSort('cost')} 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Costo</span>
                        {sortConfig.key === 'cost' && (
                          sortConfig.direction === 'asc' ? 
                          <IconChevronUp className="h-4 w-4" /> : 
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleSort('stock')} 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Stock</span>
                        {sortConfig.key === 'stock' && (
                          sortConfig.direction === 'asc' ? 
                          <IconChevronUp className="h-4 w-4" /> : 
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      onClick={() => handleSort('sku')} 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-1">
                        <span>SKU</span>
                        {sortConfig.key === 'sku' && (
                          sortConfig.direction === 'asc' ? 
                          <IconChevronUp className="h-4 w-4" /> : 
                          <IconChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay productos para mostrar
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedProducts.map((prod) => (
                      <TableRow key={prod.id} className={!prod.isActive ? 'opacity-60' : ''}>
                        <TableCell>
                          <Badge variant={prod.isActive ? 'default' : 'secondary'}>
                            {prod.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{prod.name}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {prod.category?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${prod.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          ${prod.cost.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={getStockColor(prod.stock)}>
                            {prod.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {prod.sku || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-1">
                            <EditButton 
                              onClick={() => openEdit(prod)}
                              disabled={!prod.isActive}
                              title={!prod.isActive ? 'Reactivar producto para editar' : 'Editar producto'}
                            >
                              <IconEdit className="h-4 w-4" />
                            </EditButton>
                            <ActionButton
                              variant={prod.isActive ? "destructive" : "default"}
                              onClick={() => toggleProductStatus(prod)}
                              title={prod.isActive ? 'Desactivar producto' : 'Reactivar producto'}
                            >
                              {prod.isActive ? (
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
            </div>
          )}
        </CardContent>
      </Card>      {/* Modal para crear/editar producto */}
      <Dialog open={openDrawer} onOpenChange={setOpenDrawer}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 
                'Modifica los datos del producto en el formulario.' : 
                'Completa la información del nuevo producto.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Información Básica</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nombre del Producto *
                    </Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                      className="mt-1"
                      placeholder="Ej: Cuaderno A4"
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descripción
                    </Label>
                    <Input 
                      id="description" 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      className="mt-1"
                      placeholder="Descripción opcional del producto"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sku" className="text-sm font-medium">
                      SKU / Código
                    </Label>
                    <Input 
                      id="sku" 
                      name="sku" 
                      value={formData.sku} 
                      onChange={handleChange} 
                      className="mt-1"
                      placeholder="Código único"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium">
                      Categoría
                    </Label>
                    <Select 
                      name="categoryId" 
                      value={formData.categoryId} 
                      onValueChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccione categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Precios y stock */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Precios y Stock</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cost" className="text-sm font-medium">
                      Costo *
                    </Label>
                    <Input 
                      id="cost" 
                      name="cost" 
                      type="number" 
                      step="0.01" 
                      value={formData.cost} 
                      onChange={handleChange} 
                      required 
                      className="mt-1"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price" className="text-sm font-medium">
                      Precio de Venta *
                    </Label>
                    <Input 
                      id="price" 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      value={formData.price} 
                      onChange={handleChange} 
                      required 
                      className="mt-1"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="stock" className="text-sm font-medium">
                      Stock Inicial *
                    </Label>
                    <Input 
                      id="stock" 
                      name="stock" 
                      type="number" 
                      value={formData.stock} 
                      onChange={handleChange} 
                      required 
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {/* Indicador de margen de ganancia */}
                {formData.price && formData.cost && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Margen de ganancia: 
                      <span className="font-medium text-foreground ml-1">
                        {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="gap-2 pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setOpenDrawer(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
