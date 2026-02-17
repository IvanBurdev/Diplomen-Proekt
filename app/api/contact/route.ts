import { NextResponse } from 'next/server'

interface ContactPayload {
  name?: string
  email?: string
  subject?: string
  message?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactPayload
    const name = body.name?.trim() || ''
    const email = body.email?.trim() || ''
    const subject = body.subject?.trim() || ''
    const message = body.message?.trim() || ''

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { ok: false, message: 'Моля, попълни всички полета.' },
        { status: 400 }
      )
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.ORDER_FROM_EMAIL || 'onboarding@resend.dev'
    const contactTo = process.env.CONTACT_TO_EMAIL

    if (!resendApiKey || !contactTo) {
      return NextResponse.json(
        { ok: false, message: 'Имейл услугата не е конфигурирана.' },
        { status: 500 }
      )
    }

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeSubject = escapeHtml(subject)
    const safeMessage = escapeHtml(message).replaceAll('\n', '<br/>')

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Ново съобщение от контакт формата</h2>
        <p><strong>Име:</strong> ${safeName}</p>
        <p><strong>Имейл:</strong> ${safeEmail}</p>
        <p><strong>Тема:</strong> ${safeSubject}</p>
        <p><strong>Съобщение:</strong><br/>${safeMessage}</p>
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
        to: contactTo,
        reply_to: email,
        subject: `Контакт форма: ${subject}`,
        html,
      }),
    })

    if (!resendResponse.ok) {
      const detailsText = await resendResponse.text()
      let resendMessage = ''

      try {
        const parsed = JSON.parse(detailsText) as { message?: string }
        resendMessage = parsed.message || ''
      } catch {
        resendMessage = detailsText
      }

      if (resendMessage.toLowerCase().includes('testing emails')) {
        return NextResponse.json(
          {
            ok: false,
            message:
              'Resend е в тестов режим. Смени CONTACT_TO_EMAIL с имейла на твоя Resend акаунт или верифицирай домейн.',
            details: resendMessage,
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { ok: false, message: 'Неуспешно изпращане на съобщението.', details: resendMessage },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Възникна грешка при изпращането.' },
      { status: 500 }
    )
  }
}
