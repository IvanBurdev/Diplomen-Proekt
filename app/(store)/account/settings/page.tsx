'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, refreshProfile } = useAuth()
  const supabase = createClient()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [isUpdating, setIsUpdating] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    setIsUpdating(false)

    if (error) {
      toast.error('Неуспешно обновяване на профила')
      return
    }

    await refreshProfile()
    toast.success('Профилът е обновен успешно')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError('Паролите не съвпадат')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Паролата трябва да е поне 6 символа')
      return
    }

    setIsChangingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setIsChangingPassword(false)

    if (error) {
      setPasswordError('Неуспешна смяна на паролата. Опитай отново.')
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Паролата е сменена успешно')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-8">Настройки на профила</h1>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Информация за профила
            </CardTitle>
            <CardDescription>Обнови личните си данни</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="email">Имейл</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="mt-1 bg-muted"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Имейлът не може да се променя
                </p>
              </div>

              <div>
                <Label htmlFor="fullName">Име и фамилия</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Запазване...
                  </>
                ) : (
                  'Запази промените'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Смяна на парола
            </CardTitle>
            <CardDescription>Обнови паролата на профила</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="newPassword">Нова парола</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Потвърди новата парола</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Смяна...
                  </>
                ) : (
                  'Смени паролата'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Role */}
        <Card>
          <CardHeader>
            <CardTitle>Тип профил</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">
              Роля на профила: <span className="font-medium capitalize">{profile?.role === 'admin' ? 'админ' : 'потребител'}</span>
            </p>
            {profile?.role === 'admin' && (
              <p className="mt-2 text-sm text-muted-foreground">
                Като админ имаш достъп до админ панела за управление на продукти и поръчки.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
