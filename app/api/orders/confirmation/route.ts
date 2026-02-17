import { NextResponse } from 'next/server'

interface ConfirmationPayload {
  email?: string
  orderId?: string
  total?: number
  paymentMethod?: 'card' | 'cash'
  fullName?: string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Карта',
  cash: 'В брой',
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ConfirmationPayload
    const { email, orderId, total, paymentMethod, fullName } = body

    if (!email || !orderId) {
      return NextResponse.json(
        { ok: false, message: 'Липсват задължителни данни.' },
        { status: 400 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.ORDER_FROM_EMAIL || 'onboarding@resend.dev'

    if (!resendApiKey) {
      // Do not fail checkout flow when email provider is not configured.
      return NextResponse.json({ ok: true, skipped: true })
    }

    const paymentLabel = PAYMENT_METHOD_LABELS[paymentMethod || 'card'] || 'Карта'
    const customerName = fullName?.trim() || 'Клиент'
    const totalFormatted = typeof total === 'number' ? `€${total.toFixed(2)}` : '-'

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Поръчката е приета</h2>
        <p>Здравей, ${customerName}!</p>
        <p>Благодарим за поръчката в KitZone.</p>
        <ul>
          <li><strong>Номер на поръчка:</strong> ${orderId.slice(0, 8).toUpperCase()}</li>
          <li><strong>Сума:</strong> ${totalFormatted}</li>
          <li><strong>Метод на плащане:</strong> ${paymentLabel}</li>
        </ul>
        <p>Ще се свържем с теб при обработка и изпращане.</p>
      </div>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: 'Поръчката ти е приета - KitZone',
        html,
      }),
    })

    if (!resendResponse.ok) {
      const details = await resendResponse.text()
      return NextResponse.json(
        { ok: false, message: 'Неуспешно изпращане на имейл.', details },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Възникна грешка при изпращане на имейла.' },
      { status: 500 }
    )
  }
}
