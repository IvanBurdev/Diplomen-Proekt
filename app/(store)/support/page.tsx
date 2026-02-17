'use client'

import { useState } from 'react'
import { Loader2, Mail, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const FAQ_ITEMS = [
  {
    q: 'За колко време пристига поръчката?',
    a: 'Обичайният срок е 1-3 работни дни за България.',
  },
  {
    q: 'Мога ли да върна продукт?',
    a: 'Да, можеш да заявиш връщане до 30 дни, ако продуктът е запазен.',
  },
  {
    q: 'Как да избера правилен размер?',
    a: 'В страницата на продукта има размери, а при нужда ни пиши и ще помогнем.',
  },
  {
    q: 'Какви методи на плащане поддържате?',
    a: 'В момента можеш да избираш между плащане с карта и плащане в брой при доставка.',
  },
]

export default function SupportPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = (await response.json()) as { ok?: boolean; message?: string; details?: string }

      if (!response.ok || !result.ok) {
        toast({
          title: 'Грешка',
          description: result.message || result.details || 'Неуспешно изпращане на съобщението.',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Успех',
        description: 'Съобщението е изпратено успешно.',
      })

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
    } catch {
      toast({
        title: 'Грешка',
        description: 'Възникна проблем при изпращането.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Свържи се с нас и ЧЗВ</h1>
        <p className="mt-2 text-muted-foreground">
          Тук можеш да намериш бързи отговори и да ни изпратиш съобщение.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Често задавани въпроси
            </CardTitle>
            <CardDescription>Най-честите въпроси от клиенти</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="rounded-md border p-3">
                <p className="font-medium text-foreground">{item.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Изпрати съобщение
            </CardTitle>
            <CardDescription>Ще ти отговорим възможно най-скоро</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Име</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Имейл</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="subject">Тема</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="message">Съобщение</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  required
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Изпращане...
                  </>
                ) : (
                  'Изпрати съобщение'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

