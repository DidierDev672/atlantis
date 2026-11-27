import type { CheckoutInvoiceItem } from '../domain/factura-checkout'

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Abre una vista imprimible limpia con los datos de la factura / constancia de salida.
 */
export function printFacturaReceipt(invoice: CheckoutInvoiceItem): void {
  if (typeof window === 'undefined') return

  const popup = window.open('', '_blank', 'width=760,height=860')
  if (!popup) {
    if (typeof window.print === 'function') {
      window.print()
    }
    return
  }

  const guestsText = escapeHtml(invoice.guestNames.join(', '))
  const roomText = escapeHtml(
    invoice.roomFloor
      ? `${invoice.roomLabel} (${invoice.roomFloor})`
      : invoice.roomLabel
  )
  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Factura ${escapeHtml(invoice.receiptCode)}</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; color: #2c2118; margin: 32px; }
      .card { border: 1px solid #e6dccd; border-radius: 14px; padding: 24px; max-width: 640px; margin: 0 auto; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e6dccd; padding-bottom: 16px; margin-bottom: 16px; }
      h1 { font-size: 20px; margin: 0 0 4px; color: #5a311f; }
      .muted { color: #7d6f5d; font-size: 12px; margin: 0; }
      .total { font-size: 22px; font-weight: 800; color: #5a311f; margin: 0; }
      .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e6dccd; font-size: 13px; gap: 16px; }
      .row:last-child { border-bottom: 0; }
      .label { color: #7d6f5d; }
      .value { font-weight: 600; text-align: right; }
      .notes { margin-top: 16px; padding: 12px; border-radius: 10px; background: #f6f1e8; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="top">
        <div>
          <h1>Constancia de Salida ${escapeHtml(invoice.receiptCode)}</h1>
          <p class="muted">Emitida: ${escapeHtml(invoice.createdAtFormatted)}</p>
        </div>
        <div>
          <p class="muted" style="text-align:right">Total pagado</p>
          <p class="total">${escapeHtml(invoice.amountFormatted)}</p>
        </div>
      </div>
      <div class="row"><span class="label">Habitación</span><span class="value">${roomText}</span></div>
      <div class="row"><span class="label">Huéspedes</span><span class="value">${guestsText}</span></div>
      <div class="row"><span class="label">Entrada</span><span class="value">${escapeHtml(invoice.checkInFormatted)}</span></div>
      <div class="row"><span class="label">Salida</span><span class="value">${escapeHtml(invoice.checkOutFormatted)}</span></div>
      <div class="row"><span class="label">Estadía</span><span class="value">${escapeHtml(invoice.nightsLabel)}</span></div>
      <div class="row"><span class="label">Entrega de habitación</span><span class="value">${escapeHtml(invoice.conditionLabel)}</span></div>
      <div class="row"><span class="label">Método de pago</span><span class="value">${escapeHtml(invoice.paymentLabel)}</span></div>
      <div class="row"><span class="label">Atendido por</span><span class="value">${escapeHtml(invoice.createdBy)}</span></div>
      <div class="notes"><strong>Observaciones:</strong> ${escapeHtml(invoice.comments)}</div>
    </div>
    <script>window.onload = function () { window.print(); };</script>
  </body>
</html>`

  popup.document.open()
  popup.document.write(html)
  popup.document.close()
}
