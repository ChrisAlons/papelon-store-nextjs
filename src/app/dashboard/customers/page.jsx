"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ActionButton } from '@/components/ui/action-button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  IconPlus, 
  IconEye, 
  IconEdit,
  IconTrash,
  IconRefresh,
  IconUsers,
  IconSearch,
  IconMail,
  IconPhone,
  IconMapPin,
  IconId,
  IconChevronUp, 
  IconChevronDown
} from '@tabler/icons-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    rfc: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/customers?${params}`)
      if (!response.ok) throw new Error('Error al cargar clientes')
      
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = isEditing ? `/api/customers/${selectedCustomer.id}` : '/api/customers'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar cliente')
      }
      
      const customer = await response.json()
      
      if (isEditing) {
        setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c))
        toast.success('Cliente actualizado exitosamente')
      } else {
        setCustomers(prev => [...prev, customer])
        toast.success('Cliente creado exitosamente')
      }
      
      resetForm()
      setShowModal(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message)
    }
  }

  const handleEdit = (customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      rfc: customer.rfc || ''
    })
    setIsEditing(true)
    setShowModal(true)
  }

  const handleDelete = async (customerId) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return
    
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar cliente')
      }
      
      setCustomers(prev => prev.filter(c => c.id !== customerId))
      toast.success('Cliente eliminado exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.message)
    }
  }

  const viewCustomerDetail = async (customerId) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (!response.ok) throw new Error('Error al cargar detalle del cliente')
      
      const customer = await response.json()
      setSelectedCustomer(customer)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar el detalle del cliente')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      rfc: ''
    })
    setSelectedCustomer(null)
    setIsEditing(false)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })  }

  // Función auxiliar para obtener valores anidados
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return customers
    
    return [...customers].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key)
      const bValue = getNestedValue(b, sortConfig.key)
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [customers, sortConfig])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
          <p className="text-gray-600">Administra la información de tus clientes</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true) }}>
          <IconPlus className="h-4 w-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes con Email</CardTitle>
            <IconMail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.email).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes con Compras</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c._count && c._count.sales > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, email, teléfono o RFC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => fetchCustomers()} variant="outline" size="sm">
              <IconRefresh className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Total: {customers.length} clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Nombre
                      {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' ? 
                        <IconChevronUp className="ml-1 h-4 w-4" /> : 
                        <IconChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('_count.sales')}
                  >
                    <div className="flex items-center">
                      Compras
                      {sortConfig.key === '_count.sales' && (
                        sortConfig.direction === 'asc' ? 
                        <IconChevronUp className="ml-1 h-4 w-4" /> : 
                        <IconChevronDown className="ml-1 h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Cargando clientes...
                    </TableCell>
                  </TableRow>
                ) : sortedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        {customer.email ? (
                          <div className="flex items-center">
                            <IconMail className="h-4 w-4 mr-1 text-gray-400" />
                            {customer.email}
                          </div>
                        ) : (
                          <span className="text-gray-400">No especificado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <div className="flex items-center">
                            <IconPhone className="h-4 w-4 mr-1 text-gray-400" />
                            {customer.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">No especificado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.rfc ? (
                          <div className="flex items-center">
                            <IconId className="h-4 w-4 mr-1 text-gray-400" />
                            {customer.rfc}
                          </div>
                        ) : (
                          <span className="text-gray-400">No especificado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer._count?.sales > 0 ? "default" : "secondary"}>
                          {customer._count?.sales || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <ActionButton
                            onClick={() => viewCustomerDetail(customer.id)}
                            tooltip="Ver detalle"
                            size="sm"
                            variant="outline"
                          >
                            <IconEye className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleEdit(customer)}
                            tooltip="Editar"
                            size="sm"
                            variant="outline"
                          >
                            <IconEdit className="h-4 w-4" />
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleDelete(customer.id)}
                            tooltip="Eliminar"
                            size="sm"
                            variant="outline"
                            disabled={customer._count?.sales > 0}
                          >
                            <IconTrash className="h-4 w-4" />
                          </ActionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>      {/* Modal para crear/editar cliente */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Actualiza la información del cliente' : 'Registra un nuevo cliente en el sistema'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white p-4 rounded-lg space-y-4">
              <div>
                <Label htmlFor="name" className="mb-2 block">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-white"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="mb-2 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="mb-2 block">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="rfc" className="mb-2 block">RFC</Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => setFormData(prev => ({ ...prev, rfc: e.target.value.toUpperCase() }))}
                  className="bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="address" className="mb-2 block">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="bg-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowModal(false)} className="bg-red-500 text-white hover:bg-red-600">
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                {isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>      {/* Modal de detalle del cliente */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Cliente</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="bg-white p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Nombre</Label>
                    <p className="text-sm">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedCustomer.email || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Teléfono</Label>
                    <p className="text-sm">{selectedCustomer.phone || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">RFC</Label>
                    <p className="text-sm">{selectedCustomer.rfc || 'No especificado'}</p>
                  </div>
                  {selectedCustomer.address && (
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-medium">Dirección</Label>
                      <p className="text-sm">{selectedCustomer.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Historial de compras */}
              <div className="bg-white p-4 rounded-lg">
                <Label className="text-lg font-medium">Historial de Compras</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Total: {selectedCustomer.sales?.length || 0} compras
                </p>
                
                {selectedCustomer.sales && selectedCustomer.sales.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedCustomer.sales.map((sale) => (
                      <div key={sale.id} className="border rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Venta #{sale.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(sale.saleDate)}
                            </p>
                            <p className="text-sm">
                              {sale.items?.length || 0} productos
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(sale.total)}</p>
                            <Badge variant="outline">
                              {sale.paymentType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Este cliente aún no ha realizado compras
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)} className="bg-red-500 text-white hover:bg-red-600">
                  Cerrar
                </Button>
                <Button size="sm" onClick={() => handleEdit(selectedCustomer)}>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Editar Cliente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
