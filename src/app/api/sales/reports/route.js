import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Generar reportes de ventas
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'summary'
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const userId = searchParams.get('userId')
    const customerId = searchParams.get('customerId')

    // Construir filtros
    const where = {}
    
    if (fromDate) {
      where.saleDate = { ...where.saleDate, gte: new Date(fromDate) }
    }

    if (toDate) {
      const endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999)
      where.saleDate = { ...where.saleDate, lte: endDate }
    }

    if (userId) {
      where.userId = userId
    }

    if (customerId) {
      where.customerId = customerId
    }

    let reportData = {}

    switch (reportType) {
      case 'summary':
        reportData = await generateSummaryReport(where)
        break
      case 'products':
        reportData = await generateProductsReport(where)
        break
      case 'customers':
        reportData = await generateCustomersReport(where)
        break
      case 'payment':
        reportData = await generatePaymentReport(where)
        break
      case 'daily':
        reportData = await generateDailyReport(where)
        break
      default:
        return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

async function generateSummaryReport(where) {
  const [sales, salesCount, totalRevenue, averageTicket] = await Promise.all([
    // Ventas del período
    prisma.sale.findMany({
      where,
      include: {
        items: true,
        customer: true,
        user: true
      }
    }),
    // Conteo de ventas
    prisma.sale.count({ where }),
    // Revenue total
    prisma.sale.aggregate({
      where,
      _sum: { total: true }
    }),
    // Promedio por venta
    prisma.sale.aggregate({
      where,
      _avg: { total: true }
    })
  ])

  // Calcular productos vendidos
  const totalProducts = sales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  )

  return {
    summary: {
      totalSales: salesCount,
      totalRevenue: totalRevenue._sum.total || 0,
      averageTicket: averageTicket._avg.total || 0,
      totalProductsSold: totalProducts
    },
    sales
  }
}

async function generateProductsReport(where) {
  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  })

  // Agrupar por producto
  const productStats = {}
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const productId = item.productId
      const productName = item.product?.name || 'Producto eliminado'
      
      if (!productStats[productId]) {
        productStats[productId] = {
          productId,
          productName,
          quantitySold: 0,
          totalRevenue: 0,
          sales: 0
        }
      }
      
      productStats[productId].quantitySold += item.quantity
      productStats[productId].totalRevenue += item.total
      productStats[productId].sales += 1
    })
  })

  return {
    products: Object.values(productStats).sort((a, b) => b.totalRevenue - a.totalRevenue)
  }
}

async function generateCustomersReport(where) {
  const sales = await prisma.sale.findMany({
    where,
    include: {
      customer: true,
      items: true
    }
  })

  // Agrupar por cliente
  const customerStats = {}
  
  sales.forEach(sale => {
    const customerId = sale.customerId || 'sin-cliente'
    const customerName = sale.customer?.name || 'Cliente no especificado'
    
    if (!customerStats[customerId]) {
      customerStats[customerId] = {
        customerId,
        customerName,
        salesCount: 0,
        totalSpent: 0,
        averageTicket: 0
      }
    }
    
    customerStats[customerId].salesCount += 1
    customerStats[customerId].totalSpent += sale.total
  })

  // Calcular promedio
  Object.values(customerStats).forEach(customer => {
    customer.averageTicket = customer.totalSpent / customer.salesCount
  })

  return {
    customers: Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent)
  }
}

async function generatePaymentReport(where) {
  const sales = await prisma.sale.findMany({
    where,
    select: {
      paymentType: true,
      total: true
    }
  })

  // Agrupar por método de pago
  const paymentStats = {}
  
  sales.forEach(sale => {
    const paymentType = sale.paymentType
    
    if (!paymentStats[paymentType]) {
      paymentStats[paymentType] = {
        paymentType,
        count: 0,
        totalAmount: 0,
        percentage: 0
      }
    }
    
    paymentStats[paymentType].count += 1
    paymentStats[paymentType].totalAmount += sale.total
  })

  const totalAmount = Object.values(paymentStats).reduce((sum, stat) => sum + stat.totalAmount, 0)
  
  // Calcular porcentajes
  Object.values(paymentStats).forEach(stat => {
    stat.percentage = totalAmount > 0 ? (stat.totalAmount / totalAmount) * 100 : 0
  })

  return {
    payments: Object.values(paymentStats).sort((a, b) => b.totalAmount - a.totalAmount)
  }
}

async function generateDailyReport(where) {
  const sales = await prisma.sale.findMany({
    where,
    select: {
      saleDate: true,
      total: true
    },
    orderBy: {
      saleDate: 'asc'
    }
  })

  // Agrupar por día
  const dailyStats = {}
  
  sales.forEach(sale => {
    const date = new Date(sale.saleDate).toISOString().split('T')[0]
    
    if (!dailyStats[date]) {
      dailyStats[date] = {
        date,
        salesCount: 0,
        totalRevenue: 0
      }
    }
    
    dailyStats[date].salesCount += 1
    dailyStats[date].totalRevenue += sale.total
  })

  return {
    daily: Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date))
  }
}
