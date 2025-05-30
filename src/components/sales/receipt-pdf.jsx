"use client"

import React from 'react'
import jsPDF from 'jspdf'

export const generateReceiptPDF = (sale) => {
  const pdf = new jsPDF()
  
  // Configuración del documento
  const pageWidth = pdf.internal.pageSize.width
  const margin = 20
  let yPosition = 30

  // Encabezado de la empresa
  pdf.setFontSize(20)
  pdf.setFont("helvetica", "bold")
  pdf.text("PAPELÓN STORE", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setFont("helvetica", "normal")
  pdf.text("Sistema de Punto de Venta", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 20

  // Información de la venta
  pdf.setFontSize(14)
  pdf.setFont("helvetica", "bold")
  pdf.text("RECIBO DE VENTA", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 15

  pdf.setFontSize(10)
  pdf.setFont("helvetica", "normal")
  
  // Datos de la venta
  pdf.text(`ID de Venta: ${sale.id}`, margin, yPosition)
  yPosition += 8
  
  pdf.text(`Fecha: ${new Date(sale.saleDate).toLocaleString('es-ES')}`, margin, yPosition)
  yPosition += 8
  
  if (sale.customer) {
    pdf.text(`Cliente: ${sale.customer.name}`, margin, yPosition)
    if (sale.customer.email) {
      yPosition += 6
      pdf.text(`Email: ${sale.customer.email}`, margin, yPosition)
    }
    if (sale.customer.phone) {
      yPosition += 6
      pdf.text(`Teléfono: ${sale.customer.phone}`, margin, yPosition)
    }
  } else {
    pdf.text("Cliente: No especificado", margin, yPosition)
  }
  yPosition += 8

  pdf.text(`Vendedor: ${sale.user?.username || 'No especificado'}`, margin, yPosition)
  yPosition += 8

  pdf.text(`Método de Pago: ${sale.paymentType}`, margin, yPosition)
  yPosition += 15

  // Línea separadora
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // Encabezados de la tabla
  pdf.setFont("helvetica", "bold")
  pdf.text("Producto", margin, yPosition)
  pdf.text("Cant.", margin + 100, yPosition, { align: "right" })
  pdf.text("Precio", margin + 130, yPosition, { align: "right" })
  pdf.text("Desc.", margin + 160, yPosition, { align: "right" })
  pdf.text("Total", pageWidth - margin, yPosition, { align: "right" })
  yPosition += 8

  // Línea separadora
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8
  // Items de la venta
  pdf.setFont("helvetica", "normal")
  sale.items?.forEach((item) => {
    if (yPosition > 250) { // Nueva página si es necesario
      pdf.addPage()
      yPosition = 30
    }

    const productName = item.product?.name || 'Producto eliminado'
    
    // Truncar nombre del producto si es muy largo
    const maxProductNameLength = 40
    const displayName = productName.length > maxProductNameLength 
      ? productName.substring(0, maxProductNameLength) + "..."
      : productName

    // Usar valores seguros con fallbacks
    const quantity = item.quantity || 0
    const unitPrice = item.priceAtSale || 0
    const discount = item.discount || 0
    const total = quantity * unitPrice

    pdf.text(displayName, margin, yPosition)
    pdf.text(quantity.toString(), margin + 100, yPosition, { align: "right" })
    pdf.text(`$${unitPrice.toFixed(2)}`, margin + 130, yPosition, { align: "right" })
    pdf.text(`${discount}%`, margin + 160, yPosition, { align: "right" })
    pdf.text(`$${total.toFixed(2)}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 8
  })

  yPosition += 5

  // Línea separadora
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10
  // Totales
  pdf.setFont("helvetica", "bold")
  
  // Calcular subtotal si no existe
  const subtotal = sale.subtotal || sale.totalAmount || 0
  const discountAmount = sale.discountAmount || 0
  const total = sale.totalAmount || sale.total || 0
  
  if (subtotal !== total && discountAmount > 0) {
    pdf.text("Subtotal:", margin + 120, yPosition)
    pdf.text(`$${subtotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 8
  }

  if (discountAmount > 0) {
    pdf.text("Descuento Total:", margin + 120, yPosition)
    pdf.text(`-$${discountAmount.toFixed(2)}`, pageWidth - margin, yPosition, { align: "right" })
    yPosition += 8
  }

  pdf.setFontSize(12)
  pdf.text("TOTAL:", margin + 120, yPosition)
  pdf.text(`$${total.toFixed(2)}`, pageWidth - margin, yPosition, { align: "right" })
  yPosition += 15

  // Pie de página
  pdf.setFontSize(8)
  pdf.setFont("helvetica", "normal")
  pdf.text("¡Gracias por su compra!", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 6
  pdf.text("Para soporte técnico contacte: soporte@papelon.store", pageWidth / 2, yPosition, { align: "center" })

  // Generar el PDF
  const fileName = `recibo_venta_${sale.id}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}

export const ReceiptPDFComponent = ({ sale, onGenerate }) => {
  const handleGeneratePDF = () => {
    generateReceiptPDF(sale)
    if (onGenerate) {
      onGenerate()
    }
  }

  return null // Este componente no renderiza nada visual
}
