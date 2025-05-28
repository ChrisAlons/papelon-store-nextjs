"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { EditButton, DeleteButton } from '@/components/ui/action-button'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconPlus, IconEdit, IconTrash, IconTruck, IconPhone, IconMail } from "@tabler/icons-react"
import { toast } from "sonner"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      } else {
        toast.error('Error al cargar proveedores')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers'
      const method = editingSupplier ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(editingSupplier ? 'Proveedor actualizado' : 'Proveedor creado')
        resetForm()
        fetchSuppliers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar proveedor')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al guardar proveedor')
    }
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Proveedor eliminado')
        fetchSuppliers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al eliminar proveedor')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al eliminar proveedor')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: ''
    })
    setEditingSupplier(null)
    setIsCreateDialogOpen(false)
  }

  if (loading) {
    return <div className="p-6">Cargando proveedores...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona los proveedores de tu papelería</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSupplier(null)} size="sm">
              <IconPlus className="h-4 w-4 mr-2" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <div>
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </DialogTitle>
                <DialogDescription>
                  {editingSupplier ? 'Actualiza la información del proveedor' : 'Crea un nuevo proveedor'}
                </DialogDescription>            </DialogHeader>
              <div className="bg-white p-4 rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="mb-2 block">Nombre *</Label>
                    <Input
                      id="name"
                      className="bg-white"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nombre del proveedor"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName" className="mb-2 block">Contacto</Label>
                    <Input
                      id="contactName"
                      className="bg-white"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      placeholder="Nombre del contacto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2 block">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="bg-white"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@proveedor.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="mb-2 block">Teléfono</Label>
                    <Input
                      id="phone"
                      className="bg-white"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="Número de teléfono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="mb-2 block">Dirección</Label>
                    <Input
                      id="address"
                      className="bg-white"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Dirección completa"
                    />                </div>                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm} className="bg-red-500 text-white hover:bg-red-600">
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    {editingSupplier ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
            <IconTruck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
            <IconTruck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter(s => s._count?.purchases > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Todos los proveedores registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contactName || '-'}</TableCell>
                  <TableCell>
                    {supplier.email ? (
                      <div className="flex items-center">
                        <IconMail className="h-4 w-4 mr-1 text-muted-foreground" />
                        {supplier.email}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {supplier.phone ? (
                      <div className="flex items-center">
                        <IconPhone className="h-4 w-4 mr-1 text-muted-foreground" />
                        {supplier.phone}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{supplier._count?.purchases || 0}</TableCell>
                  <TableCell className="text-right">                    <div className="flex justify-end space-x-2">
                      <EditButton
                        onClick={() => handleEdit(supplier)}
                      >
                        <IconEdit className="h-4 w-4" />
                      </EditButton>
                      <DeleteButton
                        onClick={() => handleDelete(supplier.id)}
                        disabled={supplier._count?.purchases > 0}
                      >
                        <IconTrash className="h-4 w-4" />
                      </DeleteButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {suppliers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay proveedores registrados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
