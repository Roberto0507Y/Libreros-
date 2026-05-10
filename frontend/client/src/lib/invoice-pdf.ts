import { jsPDF } from 'jspdf';

import { currency, dateTime } from './format';

export type InvoicePdfItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type InvoicePdfData = {
  customerName: string;
  deliveryAddress: string;
  deliveryEta: string;
  items: InvoicePdfItem[];
  orderDate: string;
  orderId: number;
  orderTotal: number;
  phone: string;
  reference: string;
  shippingCost: number;
  subtotal: number;
};

export const formatInvoiceOrderCode = (orderId: number, orderDate: string) => {
  const date = new Date(orderDate);
  return `ORD-${date.getFullYear()}-${String(orderId).padStart(4, '0')}`;
};

export const buildInvoiceTrackingCode = (orderId: number, orderDate: string) => {
  const date = new Date(orderDate);
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  return `TRK-${stamp}-${String(orderId).padStart(4, '0')}`;
};

const loadImageAsDataUrl = (src: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('No fue posible preparar el logo de la factura.'));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('No fue posible cargar el logo de la factura.'));
    image.src = src;
  });

export async function generateInvoicePdf(invoiceData: InvoicePdfData, logoSrc = '/libreria.png') {
  const pdf = new jsPDF({
    format: 'a4',
    unit: 'mm',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const orderCode = formatInvoiceOrderCode(invoiceData.orderId, invoiceData.orderDate);
  const trackingCode = buildInvoiceTrackingCode(invoiceData.orderId, invoiceData.orderDate);
  let cursorY = 18;

  const logoDataUrl = await loadImageAsDataUrl(logoSrc);
  const drawLabelValue = (
    label: string,
    value: string,
    x: number,
    y: number,
    align: 'left' | 'right' = 'left',
  ) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(label.toUpperCase(), x, y, { align });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(value, x, y + 6, { align });
  };

  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.8);
  pdf.line(margin, cursorY - 4, margin + 18, cursorY - 4);

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42);
  pdf.text('factura', margin, cursorY + 4);

  pdf.setLineDashPattern([1, 1], 0);
  pdf.line(margin, cursorY + 8, margin + 44, cursorY + 8);
  pdf.setLineDashPattern([], 0);

  pdf.circle(pageWidth - margin - 12, cursorY + 2, 7, 'S');
  if (logoDataUrl) {
    pdf.addImage(logoDataUrl, 'PNG', pageWidth - margin - 17, cursorY - 3, 10, 10);
  }

  cursorY += 18;

  drawLabelValue('De', 'Librería Digital', margin, cursorY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(['Zona 1, Ciudad de Guatemala', '+502 2222 0000', 'soporte@libreriadigital.com'], margin, cursorY + 14);

  drawLabelValue('No. de factura', orderCode, pageWidth - margin, cursorY, 'right');
  drawLabelValue('Fecha', dateTime.format(new Date(invoiceData.orderDate)), pageWidth - margin, cursorY + 18, 'right');
  drawLabelValue('Estado', 'Pagado', pageWidth - margin, cursorY + 36, 'right');

  cursorY += 46;
  const midX = margin + contentWidth / 2 + 8;

  drawLabelValue('Facturar a', invoiceData.customerName, margin, cursorY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text([invoiceData.phone || 'Sin teléfono registrado', invoiceData.deliveryAddress], margin, cursorY + 14);

  drawLabelValue('Entrega', invoiceData.deliveryEta, midX, cursorY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text([invoiceData.deliveryAddress, invoiceData.reference || 'Sin referencia adicional'], midX, cursorY + 14);

  cursorY += 32;
  pdf.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, cursorY, contentWidth, 10, 'F');
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(margin, cursorY, contentWidth, 10);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('CANT.', margin + 5, cursorY + 6.5);
  pdf.text('DESCRIPCIÓN', margin + 22, cursorY + 6.5);
  pdf.text('PRECIO UNITARIO', margin + 122, cursorY + 6.5);
  pdf.text('IMPORTE', pageWidth - margin - 5, cursorY + 6.5, { align: 'right' });

  cursorY += 10;
  invoiceData.items.forEach((item, index) => {
    const rowLines = pdf.splitTextToSize(item.name, 92);
    const rowHeight = Math.max(9, rowLines.length * 5 + 2);

    if (cursorY + rowHeight > pageHeight - 55) {
      pdf.addPage();
      cursorY = 20;
    }

    if (index % 2 === 1) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, cursorY, contentWidth, rowHeight, 'F');
    }

    pdf.setDrawColor(226, 232, 240);
    pdf.rect(margin, cursorY, contentWidth, rowHeight);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(String(item.quantity), margin + 7, cursorY + 5.6, { align: 'center' });
    pdf.text(rowLines, margin + 22, cursorY + 5.6);
    pdf.text(currency.format(item.unitPrice), margin + 147, cursorY + 5.6, { align: 'right' });
    pdf.text(currency.format(item.subtotal), pageWidth - margin - 5, cursorY + 5.6, { align: 'right' });
    cursorY += rowHeight;
  });

  cursorY += 8;
  pdf.setDrawColor(15, 23, 42);
  pdf.rect(pageWidth - margin - 70, cursorY, 70, 16);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  pdf.text('TOTAL', pageWidth - margin - 64, cursorY + 10.5);
  pdf.setFontSize(16);
  pdf.text(currency.format(invoiceData.orderTotal), pageWidth - margin - 4, cursorY + 10.5, {
    align: 'right',
  });

  const footerY = pageHeight - 40;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('CONDICIONES Y FORMA DE PAGO', margin, footerY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    [
      'Pago procesado en línea con conexión segura SSL.',
      'Entrega programada según cobertura y confirmación de ruta.',
      `Seguimiento: ${trackingCode}`,
    ],
    margin,
    footerY + 6,
  );

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42);
  pdf.text('Librería Digital', pageWidth - margin - 8, pageHeight - 22, { align: 'right' });

  pdf.save(`factura-pedido-${invoiceData.orderId}.pdf`);
}
