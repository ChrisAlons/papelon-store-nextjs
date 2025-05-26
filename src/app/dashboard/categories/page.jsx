"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { IconEdit, IconTrash } from '@tabler/icons-react'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Error fetching categories')
      const data = await res.json()
      setCategories(data)
    } catch (err) {
      console.error(err)
      toast.error('No se pudieron cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', description: '' })
    setOpen(true)
  }
  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description || '' })
    setOpen(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/api/categories/${editing.id}` : '/api/categories'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Error saving categoría')
      toast.success(editing ? 'Categoría actualizada' : 'Categoría creada')
      setOpen(false)
      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar')
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting categoría')
      toast.success('Categoría eliminada')
      fetchCategories()
    } catch (err) {
      console.error(err)
      toast.error('No se pudo eliminar')
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Categorías</h1>
        <Button onClick={openNew}>Nueva Categoría</Button>
      </div>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(cat => (
              <TableRow key={cat.id}>
                <TableCell>{cat.name}</TableCell>
                <TableCell>{cat.description || '-'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                    <IconEdit />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                    <IconTrash />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Modifica los datos de la categoría.'
                : 'Completa la información de la nueva categoría.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input id="description" name="description" value={form.description} onChange={handleChange} />
            </div>
            <DialogFooter>
              <Button type="submit">{editing ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
