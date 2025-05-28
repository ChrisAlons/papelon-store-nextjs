"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  IconFileAnalytics,
  IconDownload,
  IconRefresh,
  IconCalendar,
  IconCash,
  IconShoppingCart,
  IconUsers,
  IconTrendingUp,
  IconFileText
} from '@tabler/icons-react'

export default function SalesReportsPage() {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    type: 'summary',
    fromDate: '',
    toDate: '',
    userId: '',
    customerId: ''
  })

  const reportTypes = [
    { value: 'summary', label: 'Resumen General' },
    { value: 'products', label: 'Productos Más Vendidos' },
    { value: 'customers', label: 'Clientes Top' },
    { value: 'payment', label: 'Métodos de Pago' },
    { value: 'daily', label: 'Ventas Diarias' }
  ]

  const generateReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      const response = await fetch(`/api/sales/reports?${params}`)
      if (!response.ok) throw new Error('Error al generar reporte')
      
      const data = await response.json()
      setReportData(data)
      toast.success('Reporte generado exitosamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al generar reporte')
    } finally {
      setLoading(false)
    }
  }

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
      day: '2-digit'
    }).format(new Date(date))
  }

  const exportToCSV = () => {
    if (!reportData) {
      toast.error('No hay datos para exportar')
      return
    }

    let csvContent = ""
    const BOM = "\uFEFF" // Byte Order Mark para UTF-8

    switch (filters.type) {
      case 'summary':
        csvContent = "Reporte de Resumen de Ventas\n\n"
        csvContent += "Métrica,Valor\n"
        csvContent += `Total de Ventas,${reportData.summary.totalSales}\n`
        csvContent += `Ingresos Totales,${reportData.summary.totalRevenue}\n`
        csvContent += `Ticket Promedio,${reportData.summary.averageTicket.toFixed(2)}\n`
        csvContent += `Productos Vendidos,${reportData.summary.totalProductsSold}\n`
        break
      
      case 'products':
        csvContent = "Reporte de Productos Más Vendidos\n\n"
        csvContent += "Producto,Cantidad Vendida,Ingresos Totales,Número de Ventas\n"
        reportData.products.forEach(product => {
          csvContent += `"${product.productName}",${product.quantitySold},${product.totalRevenue},${product.sales}\n`
        })
        break
      
      case 'customers':
        csvContent = "Reporte de Clientes Top\n\n"
        csvContent += "Cliente,Número de Compras,Total Gastado,Ticket Promedio\n"
        reportData.customers.forEach(customer => {
          csvContent += `"${customer.customerName}",${customer.salesCount},${customer.totalSpent},${customer.averageTicket.toFixed(2)}\n`
        })
        break
      
      case 'payment':
        csvContent = "Reporte de Métodos de Pago\n\n"
        csvContent += "Método de Pago,Número de Transacciones,Total,Porcentaje\n"
        reportData.payments.forEach(payment => {
          csvContent += `${payment.paymentType},${payment.count},${payment.totalAmount},${payment.percentage.toFixed(2)}%\n`
        })
        break
      
      case 'daily':
        csvContent = "Reporte de Ventas Diarias\n\n"
        csvContent += "Fecha,Número de Ventas,Ingresos\n"
        reportData.daily.forEach(day => {
          csvContent += `${day.date},${day.salesCount},${day.totalRevenue}\n`
        })
        break
    }

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_ventas_${filters.type}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Reporte exportado a CSV')
  }

  useEffect(() => {
    // Configurar fechas por defecto (último mes)
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    
    setFilters(prev => ({
      ...prev,
      fromDate: lastMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0]
    }))
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reportes de Ventas</h1>
          <p className="text-gray-600">Análisis detallado de las ventas del negocio</p>
        </div>
        <div className="flex space-x-2">
          {reportData && (
            <Button onClick={exportToCSV} variant="outline">
              <IconDownload className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
          <CardDescription>
            Selecciona los parámetros para generar tu reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="reportType">Tipo de Reporte</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="fromDate">Desde</Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="toDate">Hasta</Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
              />
            </div>
            
            <div className="md:col-span-2 flex items-end">
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <IconFileAnalytics className="h-4 w-4 mr-2" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados del reporte */}
      {reportData && (
        <div className="space-y-6">
          {/* Resumen General */}
          {filters.type === 'summary' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                    <IconShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.summary.totalSales}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <IconCash className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                    <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData.summary.averageTicket)}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
                    <IconFileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.summary.totalProductsSold}</div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Productos más vendidos */}
          {filters.type === 'products' && reportData.products && (
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
                <CardDescription>Ranking de productos por ingresos generados</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posición</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad Vendida</TableHead>
                      <TableHead>Ingresos Totales</TableHead>
                      <TableHead>Número de Ventas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.products.map((product, index) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{product.productName}</TableCell>
                        <TableCell>{product.quantitySold}</TableCell>
                        <TableCell>{formatCurrency(product.totalRevenue)}</TableCell>
                        <TableCell>{product.sales}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Clientes top */}
          {filters.type === 'customers' && reportData.customers && (
            <Card>
              <CardHeader>
                <CardTitle>Clientes Top</CardTitle>
                <CardDescription>Clientes con mayor volumen de compras</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posición</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Número de Compras</TableHead>
                      <TableHead>Total Gastado</TableHead>
                      <TableHead>Ticket Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.customers.map((customer, index) => (
                      <TableRow key={customer.customerId}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{customer.customerName}</TableCell>
                        <TableCell>{customer.salesCount}</TableCell>
                        <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                        <TableCell>{formatCurrency(customer.averageTicket)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Métodos de pago */}
          {filters.type === 'payment' && reportData.payments && (
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Métodos de Pago</CardTitle>
                <CardDescription>Distribución de ventas por método de pago</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Transacciones</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Porcentaje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.payments.map((payment) => (
                      <TableRow key={payment.paymentType}>
                        <TableCell className="font-medium">{payment.paymentType}</TableCell>
                        <TableCell>{payment.count}</TableCell>
                        <TableCell>{formatCurrency(payment.totalAmount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${payment.percentage}%` }}
                              />
                            </div>
                            {payment.percentage.toFixed(1)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Ventas diarias */}
          {filters.type === 'daily' && reportData.daily && (
            <Card>
              <CardHeader>
                <CardTitle>Ventas Diarias</CardTitle>
                <CardDescription>Evolución de las ventas día a día</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Número de Ventas</TableHead>
                      <TableHead>Ingresos</TableHead>
                      <TableHead>Promedio por Venta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.daily.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                        <TableCell>{day.salesCount}</TableCell>
                        <TableCell>{formatCurrency(day.totalRevenue)}</TableCell>
                        <TableCell>
                          {formatCurrency(day.salesCount > 0 ? day.totalRevenue / day.salesCount : 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {!reportData && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <IconFileAnalytics className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay datos para mostrar
              </h3>
              <p className="text-gray-600 mb-4">
                Configura los filtros y genera un reporte para ver los datos
              </p>
              <Button onClick={generateReport}>
                <IconFileAnalytics className="h-4 w-4 mr-2" />
                Generar Primer Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
