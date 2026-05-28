'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient, hasSupabaseBrowserEnv } from '@/lib/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [isUpdated, setIsUpdated] = useState(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
        setHasRecoverySession(true)
        setError(null)
        setIsCheckingSession(false)
      }
    })

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setError('Линкът за смяна на парола е невалиден или е изтекъл. Заяви нов линк.')
      } else {
        setHasRecoverySession(true)
      }

      setIsCheckingSession(false)
    }

    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hasSupabaseBrowserEnv()) {
      setError('Липсва Supabase конфигурация. Добави NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      return
    }

    if (password !== confirmPassword) {
      setError('Паролите не съвпадат')
      return
    }

    if (password.length < 6) {
      setError('Паролата трябва да е поне 6 символа')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setIsLoading(false)

    if (error) {
      setError('Неуспешна смяна на паролата. Заяви нов линк и опитай отново.')
      return
    }

    setPassword('')
    setConfirmPassword('')
    setIsUpdated(true)
    await supabase.auth.signOut()
  }

  if (isUpdated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">Паролата е сменена</CardTitle>
          <CardDescription>Вече можеш да влезеш с новата си парола.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => router.push('/auth/login')}>Към вход</Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Нова парола</CardTitle>
        <CardDescription>Задай нова парола за профила си</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Нова парола</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Въведи нова парола"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isCheckingSession || !hasRecoverySession}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isCheckingSession || !hasRecoverySession}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">
                  {showPassword ? 'Скрий паролата' : 'Покажи паролата'}
                </span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Потвърди новата парола</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Потвърди новата парола"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isCheckingSession || !hasRecoverySession}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isCheckingSession || !hasRecoverySession}>
            {isLoading || isCheckingSession ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isCheckingSession ? 'Проверка...' : 'Запазване...'}
              </>
            ) : (
              'Запази новата парола'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Заяви нов линк
        </Link>
      </CardFooter>
    </Card>
  )
}
