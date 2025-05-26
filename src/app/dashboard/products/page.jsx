"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { toast } from 'sonner'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', price: '', cost: '', stock: '', sku: '', categoryId: '' })

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
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
  }, [])
  
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
      toast.error('Error al guardar')
    }
  }

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting product')
      toast.success('Producto eliminado')
      fetchProducts()
    } catch (error) {
      console.error(error)
      toast.error('No se pudo eliminar')
    }
  }

  return (
    <>
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Productos</h1>
        <Button onClick={openNew}>
          Nuevo Producto
        </Button>
      </div>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableRow key={prod.id}>
                <TableCell>{prod.name}</TableCell>
                <TableCell>{prod.category?.name || '-'}</TableCell>
                <TableCell>{prod.price}</TableCell>
                <TableCell>{prod.cost}</TableCell>
                <TableCell>{prod.stock}</TableCell>
                <TableCell>{prod.sku}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(prod)}>
                    <IconEdit />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteProduct(prod.id)}>
                    <IconTrash />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
    <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" value={formData.description} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="price">Precio</Label>
            <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="cost">Costo</Label>
            <Input id="cost" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select name="categoryId" value={formData.categoryId} onValueChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}>
              <SelectTrigger aria-label="Categoría">
                <SelectValue placeholder="Seleccione categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DrawerFooter>
            <Button type="submit">{editingProduct ? 'Actualizar' : 'Crear'}</Button>
            <Button variant="ghost" onClick={() => setOpenDrawer(false)}>Cancelar</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
    </>
  )
}
