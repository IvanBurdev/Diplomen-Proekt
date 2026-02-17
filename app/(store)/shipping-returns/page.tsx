'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Package, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type OrderItem = {
  id: string
  status: string
  total: number
  created_at: string
}

const statusLabels: Record<string, string> = {
  pending: 'Чакаща',
  processing: 'Обработва се',
  shipped: 'Изпратена',
  delivered: 'Доставена',
  cancelled: 'Отказана',
  return_requested: 'Заявено връщане',
  returned: 'Върната',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  return_requested: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  returned: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

const steps = ['pending', 'processing', 'shipped', 'delivered']

function stepIndex(status: string) {
  const idx = steps.indexOf(status)
  return idx < 0 ? 0 : idx
}

export default function ShippingReturnsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = createBrowserClient()
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchOrders()
    }
  }, [authLoading, user])

  async function fetchOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно зареждане на поръчките.',
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    setOrders((data || []) as OrderItem[])
    setLoading(false)
  }

  async function handleCancel(orderId: string) {
    setWorkingId(orderId)
    try {
      const response = await fetch('/api/orders/customer-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'cancel' }),
      })
      const result = (await response.json()) as { ok?: boolean; message?: string; status?: string }

      if (!response.ok || !result.ok) {
        toast({
          title: 'Грешка',
          description: result.message || 'Неуспешен отказ на поръчката.',
          variant: 'destructive',
        })
        return
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: result.status || 'cancelled' } : o))
      )
      toast({ title: 'Успех', description: 'Поръчката е отказана.' })
    } finally {
      setWorkingId(null)
    }
  }

  async function handleReturn(orderId: string) {
    setWorkingId(orderId)
    try {
      const response = await fetch('/api/orders/customer-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'return' }),
      })
      const result = (await response.json()) as { ok?: boolean; message?: string; status?: string }

      if (!response.ok || !result.ok) {
        toast({
          title: 'Грешка',
          description: result.message || 'Неуспешно изпращане на заявката за връщане.',
          variant: 'destructive',
        })
        return
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: result.status || 'return_requested' } : o))
      )
      toast({ title: 'Успех', description: 'Заявката за връщане е изпратена и чака одобрение от администратор.' })
    } finally {
      setWorkingId(null)
    }
  }

  const hasOrders = useMemo(() => orders.length > 0, [orders])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Моите поръчки, доставка и връщане</h1>
        <p className="mt-2 text-muted-foreground">
          Проследявай поръчките си, отказвай активни поръчки и заявявай връщане за доставени.
        </p>
      </div>

      {!hasOrders ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Все още нямаш поръчки.</p>
            <Link href="/products" className="mt-4 inline-block">
              <Button>Към продуктите</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const currentIdx = stepIndex(order.status)
            const isCancelled = order.status === 'cancelled'
            const isReturned = order.status === 'returned'
            const isReturnRequested = order.status === 'return_requested'
            const canCancel = order.status === 'pending' || order.status === 'processing'
            const canReturn = order.status === 'delivered'

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-base">
                      Поръчка #{order.id.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <Badge variant="outline" className={statusColors[order.status] || ''}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString('bg-BG')} • Общо: €{Number(order.total).toFixed(2)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isCancelled && !isReturned ? (
                    <div className="grid grid-cols-4 gap-2">
                      {steps.map((step, idx) => {
                        const active = idx <= currentIdx
                        const Icon =
                          step === 'pending'
                            ? Clock
                            : step === 'processing'
                              ? Package
                              : step === 'shipped'
                                ? Truck
                                : CheckCircle2
                        return (
                          <div key={step} className="rounded-md border p-2 text-center">
                            <Icon className={`mx-auto h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`mt-1 text-xs ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {statusLabels[step]}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <>
                      {isCancelled && (
                        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <XCircle className="h-4 w-4" />
                          Поръчката е отказана.
                        </div>
                      )}
                      {isReturned && (
                        <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Поръчката е върната и сумата е възстановена.
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {canCancel && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={workingId === order.id}
                          >
                            {workingId === order.id ? 'Изчакване...' : 'Откажи поръчката'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Потвърди отказа</AlertDialogTitle>
                            <AlertDialogDescription>
                              Сигурен ли си, че искаш да откажеш поръчка #{order.id.slice(0, 8).toUpperCase()}? Това действие е необратимо.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Назад</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleCancel(order.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Да, откажи
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {canReturn && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReturn(order.id)}
                        disabled={workingId === order.id}
                      >
                        {workingId === order.id ? 'Изпращане...' : 'Заяви връщане'}
                      </Button>
                    )}
                    {isReturnRequested && (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                        Заявката за връщане чака одобрение от администратор
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
