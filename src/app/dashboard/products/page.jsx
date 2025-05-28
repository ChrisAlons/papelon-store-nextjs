"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { EditButton, ActionButton } from '@/components/ui/action-button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { IconEdit, IconEye, IconEyeOff } from '@tabler/icons-react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showInactive, setShowInactive] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '', price: '', cost: '', stock: '', sku: '', categoryId: '' })

  const fetchProducts = async () => {
    try {
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
    setFormData({ name: '', description: '', price: '', cost: '', stock: '', sku: '', categoryId: '' })
    setOpenDrawer(true)
  }
  
  const openEdit = (prod) => {
    setEditingProduct(prod)
    setFormData({ name: prod.name, description: prod.description || '', price: prod.price.toString(), cost: prod.cost.toString(), stock: prod.stock.toString(), sku: prod.sku || '', categoryId: prod.categoryId || '' })
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
      toast.error('Error al guardar')    }
  }

  return (
    <>    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Productos</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="showInactive" 
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="showInactive">Mostrar productos inactivos</Label>
          </div>          <Button onClick={openNew} size="sm">
            Nuevo Producto
          </Button>
        </div>
      </div>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((prod) => (
              <TableRow key={prod.id} className={!prod.isActive ? 'opacity-60' : ''}>
                <TableCell>
                  <Badge variant={prod.isActive ? 'default' : 'secondary'}>
                    {prod.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell>{prod.name}</TableCell>
                <TableCell>{prod.category?.name || '-'}</TableCell>
                <TableCell>{prod.price}</TableCell>
                <TableCell>{prod.cost}</TableCell>
                <TableCell>{prod.stock}</TableCell>
                <TableCell>{prod.sku}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
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
            ))}
          </TableBody>
        </Table>
      )}
    </div>
    <Dialog open={openDrawer} onOpenChange={setOpenDrawer}>
      <DialogContent>
        <div>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Modifica los datos del producto en el formulario.' : 'Completa la información del nuevo producto.'}
            </DialogDescription>
          </DialogHeader>          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white p-4 rounded-lg space-y-4">
              <div>
                <Label htmlFor="name" className="mb-2 block">Nombre *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required className="bg-white" />
              </div>
              <div>
                <Label htmlFor="description" className="mb-2 block">Descripción</Label>
                <Input id="description" name="description" value={formData.description} onChange={handleChange} className="bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="mb-2 block">Precio *</Label>
                  <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required className="bg-white" />
                </div>
                <div>
                  <Label htmlFor="cost" className="mb-2 block">Costo *</Label>
                  <Input id="cost" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} required className="bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock" className="mb-2 block">Stock *</Label>
                  <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required className="bg-white" />
                </div>
                <div>
                  <Label htmlFor="sku" className="mb-2 block">SKU</Label>
                  <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} className="bg-white" />
                </div>
              </div>
              <div>
                <Label htmlFor="category" className="mb-2 block">Categoría</Label>
                <Select name="categoryId" value={formData.categoryId} onValueChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}>
                  <SelectTrigger aria-label="Categoría" className="bg-white">
                    <SelectValue placeholder="Seleccione categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" size="sm" onClick={() => setOpenDrawer(false)} className="bg-red-500 text-white hover:bg-red-600">Cancelar</Button>
              <Button type="submit" size="sm">{editingProduct ? 'Actualizar Producto' : 'Crear Producto'}</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
