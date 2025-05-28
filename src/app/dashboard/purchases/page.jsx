"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { ViewButton, DeleteButton, ExportButton } from "@/components/ui/action-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPlus, IconEdit, IconTrash, IconShoppingCart, IconEye, IconMinus, IconDownload, IconChevronUp, IconChevronDown } from "@tabler/icons-react"
import { toast } from "sonner"

// Helper function to format dates consistently
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${day}/${month}/${year}`
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPurchase, setEditingPurchase] = useState(null)
  const [viewingPurchase, setViewingPurchase] = useState(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    supplierId: '',
    invoiceNumber: '',
    notes: '',
    items: [{ productId: '', quantity: 1, costAtPurchase: 0 }]
  })

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })

  // Sorting functions
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedPurchases = useMemo(() => {
    if (!sortConfig.key) return purchases
    
    const sorted = [...purchases].sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]
      
      // Manejo especial para nombres de proveedores
      if (sortConfig.key === 'supplierName') {
        aValue = a.supplier?.name || ''
        bValue = b.supplier?.name || ''
      }
      
      // Manejo especial para fechas
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
  }, [purchases, sortConfig])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/suppliers'),
        fetch('/api/products')
      ])

      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json()
        setPurchases(purchasesData)
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json()
        setSuppliers(suppliersData)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.supplierId) {
      toast.error('Selecciona un proveedor')
      return
    }

    if (formData.items.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }

    for (let item of formData.items) {
      if (!item.productId || item.quantity <= 0 || item.costAtPurchase <= 0) {
        toast.error('Todos los productos deben tener cantidad y costo válidos')
        return
      }
    }

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Compra creada exitosamente')
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al crear compra')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al crear compra')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta compra? Esto revertirá el inventario.')) return

    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Compra eliminada')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar compra')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar compra')
    }
  }

  const handleView = async (purchase) => {
    try {
      const response = await fetch(`/api/purchases/${purchase.id}`)
      if (response.ok) {
        const detailedPurchase = await response.json()
        setViewingPurchase(detailedPurchase)
        setIsViewDialogOpen(true)
      } else {
        toast.error('Error al cargar detalles de la compra')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar detalles de la compra')
    }
  }

  const exportToCSV = async () => {
    try {
      const response = await fetch('/api/purchases')
      if (!response.ok) {
        throw new Error('Error al obtener datos de compras')
      }
      
      const data = await response.json()
      
      const csvData = []
      
      // Headers
      csvData.push([
        'Fecha',
        'Proveedor',
        'Número de Factura',
        'Producto',
        'SKU',
        'Categoría',
        'Cantidad',
        'Costo Unitario',
        'Subtotal',
        'Total Compra',
        'Notas'
      ])
      
      // Datos
      data.forEach(purchase => {
        if (purchase.items && purchase.items.length > 0) {
          purchase.items.forEach(item => {
            csvData.push([
              formatDate(purchase.purchaseDate),
              purchase.supplier?.name || '',
              purchase.invoiceNumber || '',
              item.product?.name || '',
              item.product?.sku || '',
              item.product?.category?.name || '',
              item.quantity,
              item.costAtPurchase.toFixed(2),
              (item.quantity * item.costAtPurchase).toFixed(2),
              purchase.totalAmount.toFixed(2),
              purchase.notes || ''
            ])
          })
        } else {
          csvData.push([
            formatDate(purchase.purchaseDate),
            purchase.supplier?.name || '',
            purchase.invoiceNumber || '',
            '',
            '',
            '',
            '',
            '',
            '',
            purchase.totalAmount.toFixed(2),
            purchase.notes || ''
          ])
        }
      })
      
      // Convertir a CSV
      const csvContent = csvData.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n')
      
      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Archivo CSV descargado exitosamente')
    } catch (error) {
      console.error('Error exportando CSV:', error)
      toast.error('Error al exportar archivo CSV')
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: 1, costAtPurchase: 0 }]
    })
  }

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      items: newItems.length > 0 ? newItems : [{ productId: '', quantity: 1, costAtPurchase: 0 }]
    })
  }
  const updateItem = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Si se selecciona un producto, actualizar el costo con el precio del producto
    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.id === value)
      if (selectedProduct && selectedProduct.price) {
        newItems[index].costAtPurchase = selectedProduct.price
      }
    }
    
    setFormData({ ...formData, items: newItems })
  }

  const resetForm = () => {
    setFormData({
      supplierId: '',
      invoiceNumber: '',
      notes: '',
      items: [{ productId: '', quantity: 1, costAtPurchase: 0 }]
    })
    setIsCreateDialogOpen(false)
    setEditingPurchase(null)
  }

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => 
      sum + (item.quantity * item.costAtPurchase), 0
    ).toFixed(2)
  }

  if (loading) {
    return <div className="p-6">Cargando compras...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compras</h1>
          <p className="text-muted-foreground">Gestiona las compras a proveedores</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end sm:justify-end mt-4 sm:mt-0">
          <ExportButton onClick={exportToCSV}>
            <IconDownload className="h-4 w-4 mr-2" />
            Exportar CSV
          </ExportButton>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPurchase(null)} size="sm">
                <IconPlus className="h-4 w-4 mr-2" />
                Nueva Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Compra</DialogTitle>
                <DialogDescription>
                  Registra una nueva compra a proveedor
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white p-4 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplier" className="mb-2 block">Proveedor *</Label>
                      <Select value={formData.supplierId} onValueChange={(value) => setFormData({...formData, supplierId: value})}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecciona un proveedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="invoiceNumber" className="mb-2 block">Número de Factura</Label>
                      <Input
                        id="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                        placeholder="Número de factura"
                        className="bg-white"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes" className="mb-2 block">Notas</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Notas adicionales"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Productos *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <IconPlus className="h-4 w-4 mr-1" />
                      Agregar Producto
                    </Button>
                  </div>
                    <div className="space-y-4">
                    {formData.items.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div>
                          <Label className="mb-2 block">Producto</Label>
                          <Select 
                            value={item.productId} 
                            onValueChange={(value) => updateItem(index, 'productId', value)}
                          >
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Seleccionar producto" />
                            </SelectTrigger>
                            <SelectContent className="max-h-48">
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex flex-col w-full">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2">
                          <div>
                            <Label className="mb-2 block">Cantidad</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              min="1"
                              placeholder="0"
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Costo</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.costAtPurchase}
                              onChange={(e) => updateItem(index, 'costAtPurchase', parseFloat(e.target.value) || 0)}
                              min="0"
                              placeholder="0.00"
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Subtotal</Label>
                            <Input
                              type="text"
                              value={`$${(item.quantity * item.costAtPurchase).toFixed(2)}`}
                              disabled
                              className="bg-white"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                            >
                              <IconMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-4">
                    <div className="text-lg font-semibold">
                      Total: ${getTotalAmount()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm} className="bg-red-500 text-white hover:bg-red-600">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Crear Compra
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* View Purchase Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Compra</DialogTitle>
            <DialogDescription>
              Información completa de la compra
            </DialogDescription>
          </DialogHeader>
          <div>
            {viewingPurchase && (
              <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Fecha de Compra</Label>
                    <p className="text-sm">{formatDate(viewingPurchase.purchaseDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Proveedor</Label>
                    <p className="text-sm">{viewingPurchase.supplier?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Número de Factura</Label>
                    <p className="text-sm">{viewingPurchase.invoiceNumber || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Total</Label>
                    <p className="text-lg font-semibold">${viewingPurchase.totalAmount?.toFixed(2)}</p>
                  </div>                {viewingPurchase.notes && (
                    <div className="col-span-full">
                      <Label className="text-sm font-medium text-muted-foreground">Notas</Label>
                      <p className="text-sm">{viewingPurchase.notes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-3">Productos Comprados</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Costo Unitario</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingPurchase.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.product?.name || `Producto ID: ${item.productId}`}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.costAtPurchase?.toFixed(2)}</TableCell>
                          <TableCell>${(item.quantity * item.costAtPurchase).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Total de la Compra:</span>
                    <span className="text-xl font-bold">${viewingPurchase.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
            <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${purchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Compras</CardTitle>
          <CardDescription>
            Todas las compras realizadas a proveedores
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
                        <IconChevronUp className="h-4 w-4" /> : 
                        <IconChevronDown className="h-4 w-4" />
                      )}                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => handleSort('supplierName')} 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Proveedor</span>
                      {sortConfig.key === 'supplierName' && (
                        sortConfig.direction === 'asc' ? 
                        <IconChevronUp className="h-4 w-4" /> : 
                        <IconChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => handleSort('invoiceNumber')} 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors hidden sm:table-cell"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Factura</span>
                      {sortConfig.key === 'invoiceNumber' && (
                        sortConfig.direction === 'asc' ? 
                        <IconChevronUp className="h-4 w-4" /> : 
                        <IconChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Productos</TableHead>
                  <TableHead 
                    onClick={() => handleSort('totalAmount')} 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total</span>
                      {sortConfig.key === 'totalAmount' && (
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
                {sortedPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay compras registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        {formatDate(purchase.purchaseDate)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {purchase.supplier?.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {purchase.invoiceNumber || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm">
                          {purchase._count?.items || 0} items
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${purchase.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <ViewButton
                            onClick={() => handleView(purchase)}
                          >
                            <IconEye className="h-4 w-4" />
                          </ViewButton>
                        </div>
                      </TableCell>
                    </TableRow>                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
