'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient, hasSupabaseBrowserEnv } from '@/lib/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hasSupabaseBrowserEnv()) {
      setError('Липсва Supabase конфигурация. Добави NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    setIsLoading(true)

    const siteUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin
    const redirectTo = new URL('/auth/callback?next=/auth/update-password', siteUrl).toString()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setIsLoading(false)

    if (error) {
      setError('Не успяхме да изпратим имейл за възстановяване. Провери имейла и опитай отново.')
      return
    }

    setIsSent(true)
  }

  if (isSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle className="font-heading text-2xl">Провери имейла си</CardTitle>
          <CardDescription>
            Ако има профил с този имейл, ще получиш линк за задаване на нова парола.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Обратно към вход
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Забравена парола</CardTitle>
        <CardDescription>Въведи имейла си и ще ти изпратим линк за смяна на паролата</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Имейл</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Изпращане...
              </>
            ) : (
              'Изпрати линк'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/auth/login" className="text-sm text-primary hover:underline">
          Обратно към вход
        </Link>
      </CardFooter>
    </Card>
  )
}
