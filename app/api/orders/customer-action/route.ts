import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ActionType = 'cancel' | 'return'

interface ActionPayload {
  orderId?: string
  action?: ActionType
  message?: string
}

const CANCELLABLE_STATUSES = new Set(['pending', 'processing'])
const RETURNABLE_STATUSES = new Set(['delivered'])

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ActionPayload
    const orderId = body.orderId?.trim()
    const action = body.action
    const message = body.message?.trim() || ''

    if (!orderId || !action) {
      return NextResponse.json({ ok: false, message: 'Липсват задължителни данни.' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ok: false, message: 'Трябва да си влязъл в профила.' }, { status: 401 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, total, created_at')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ ok: false, message: 'Поръчката не е намерена.' }, { status: 404 })
    }

    if (action === 'cancel') {
      if (!CANCELLABLE_STATUSES.has(order.status)) {
        return NextResponse.json(
          { ok: false, message: 'Поръчката не може да бъде отказана на този етап.' },
          { status: 400 }
        )
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('user_id', user.id)

      if (updateError) {
        return NextResponse.json({ ok: false, message: 'Неуспешен отказ на поръчката.' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, status: 'cancelled' })
    }

    if (action === 'return') {
      if (!RETURNABLE_STATUSES.has(order.status)) {
        return NextResponse.json(
          { ok: false, message: 'Връщане може да се заяви само за доставени поръчки.' },
          { status: 400 }
        )
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'return_requested', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('user_id', user.id)

      if (updateError) {
        return NextResponse.json(
          { ok: false, message: 'Неуспешно записване на заявката за връщане.' },
          { status: 500 }
        )
      }

      const resendApiKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.ORDER_FROM_EMAIL || 'onboarding@resend.dev'
      const contactTo = process.env.CONTACT_TO_EMAIL

      if (resendApiKey && contactTo) {
        const safeMessage = message || 'Клиентът заявява връщане на поръчката.'

        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="margin: 0 0 12px;">Нова заявка за връщане</h2>
            <p><strong>Номер на поръчка:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Потребител ID:</strong> ${user.id}</p>
            <p><strong>Сума:</strong> €${Number(order.total).toFixed(2)}</p>
            <p><strong>Съобщение:</strong> ${safeMessage}</p>
          </div>
        `

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: contactTo,
            subject: `Заявка за връщане #${order.id.slice(0, 8).toUpperCase()}`,
            html,
          }),
        }).catch(() => undefined)
      }

      return NextResponse.json({ ok: true, status: 'return_requested' })
    }

    return NextResponse.json({ ok: false, message: 'Неподдържано действие.' }, { status: 400 })
  } catch {
    return NextResponse.json({ ok: false, message: 'Възникна грешка.' }, { status: 500 })
  }
}
