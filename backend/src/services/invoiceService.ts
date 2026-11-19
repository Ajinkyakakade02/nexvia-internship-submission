import PDFDocument from 'pdfkit';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { UserRole } from '../types/index.js';

export const generateInvoicePDF = async (
  orderId: string,
  userId: string,
  role: UserRole
): Promise<Buffer> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      vendorOrders: {
        include: {
          vendor: { select: { id: true, businessName: true } },
          items: true
        }
      }
    }
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Access check
  if (role === UserRole.CUSTOMER && order.customerId !== userId) {
    throw ApiError.forbidden('You do not have access to this invoice');
  }

  const items = order.vendorOrders.flatMap((vo) =>
    vo.items.map((it) => ({
      name: it.name,
      price: Number(it.price),
      quantity: it.quantity,
      subtotal: Number(it.subtotal)
    }))
  );

  const shippingAddress: any = order.shippingAddressSnapshot || {};

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (buffer: Buffer) => buffers.push(buffer));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err: Error) => reject(err));

    // Header
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text(env.PLATFORM_NAME || 'NexMart Marketplace', 50, 45);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text('Multi-Vendor E-Commerce Platform', 50, 72)
      .text('support@nexmart.com | www.nexmart.com', 50, 85);

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('TAX INVOICE', 400, 45, { align: 'right' });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#475569')
      .text(`Invoice No: INV-${order.orderNumber.replace('ORD-', '')}`, 400, 70, { align: 'right' })
      .text(`Order No: ${order.orderNumber}`, 400, 85, { align: 'right' })
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 100, { align: 'right' })
      .text(`Payment Status: ${order.paymentStatus}`, 400, 115, { align: 'right' });

    doc.moveTo(50, 135).lineTo(550, 135).strokeColor('#e2e8f0').stroke();

    // Customer & Shipping Info
    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('Billed To / Delivered To:', 50, 150);

    const addr = shippingAddress;
    const cust = order.customer;
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#334155')
      .text(addr.fullName || cust?.name || 'Valued Customer', 50, 168)
      .text(addr.street || '', 50, 182)
      .text(`${addr.city || ''}, ${addr.state || ''} - ${addr.postalCode || ''}`, 50, 196)
      .text(`${addr.country || 'India'} | Phone: ${addr.phone || cust?.phone || 'N/A'}`, 50, 210);

    // Table Header
    const tableTop = 240;
    doc
      .rect(50, tableTop, 500, 24)
      .fillColor('#f1f5f9')
      .fill();

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1e293b')
      .text('#', 60, tableTop + 7)
      .text('Item Description', 85, tableTop + 7)
      .text('Qty', 340, tableTop + 7, { align: 'center', width: 30 })
      .text('Unit Price (₹)', 380, tableTop + 7, { align: 'right', width: 70 })
      .text('Total (₹)', 460, tableTop + 7, { align: 'right', width: 80 });

    // Table Rows
    let y = tableTop + 30;
    items.forEach((item, index) => {
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#334155')
        .text((index + 1).toString(), 60, y)
        .text(item.name.substring(0, 42), 85, y)
        .text(item.quantity.toString(), 340, y, { align: 'center', width: 30 })
        .text(`₹${item.price.toFixed(2)}`, 380, y, { align: 'right', width: 70 })
        .text(`₹${item.subtotal.toFixed(2)}`, 460, y, { align: 'right', width: 80 });

      y += 22;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveTo(50, y + 5).lineTo(550, y + 5).strokeColor('#e2e8f0').stroke();
    y += 15;

    // Totals Section
    const totalsLeft = 360;
    const subtotal = Number(order.subtotal);
    const discount = Number(order.discount);
    const shippingCost = Number(order.shippingCost);
    const total = Number(order.total);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#475569')
      .text('Subtotal:', totalsLeft, y)
      .text(`₹${subtotal.toFixed(2)}`, 460, y, { align: 'right', width: 80 });

    y += 18;
    if (discount > 0) {
      doc
        .text('Discount:', totalsLeft, y)
        .text(`- ₹${discount.toFixed(2)}`, 460, y, { align: 'right', width: 80 });
      y += 18;
    }

    doc
      .text('Shipping:', totalsLeft, y)
      .text(shippingCost === 0 ? 'FREE' : `₹${shippingCost.toFixed(2)}`, 460, y, {
        align: 'right',
        width: 80
      });

    y += 22;
    doc
      .rect(totalsLeft - 10, y - 5, 200, 26)
      .fillColor('#eff6ff')
      .fill();

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor('#1e40af')
      .text('Total Amount:', totalsLeft, y)
      .text(`₹${total.toFixed(2)}`, 460, y, { align: 'right', width: 80 });

    // Multi-Vendor Fulfillment Info
    y += 45;
    if (y < 720) {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('Vendor Fulfillment Suborders:', 50, y);

      y += 16;
      order.vendorOrders.forEach((vo) => {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#475569')
          .text(
            `• Vendor: ${vo.vendor.businessName || 'Vendor'} | Items: ${vo.items.length} | Status: ${vo.status}`,
            55,
            y
          );
        y += 14;
      });
    }

    // Footer
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#94a3b8')
      .text('This is a computer-generated tax invoice and requires no physical signature.', 50, 780, {
        align: 'center',
        width: 500
      });

    doc.end();
  });
};
