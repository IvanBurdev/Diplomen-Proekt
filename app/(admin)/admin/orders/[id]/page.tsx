'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Package, MapPin, User, CreditCard, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Order, OrderItem, Product, Profile } from '@/lib/types'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  return_requested: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  returned: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
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

type OrderWithDetails = Order & {
  order_items: (OrderItem & { products: Product })[]
  customer?: { full_name: string | null; email: string }
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function fetchOrder() {
    setLoading(true)
    
    // Fetch order with items
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*, products(*))')
      .eq('id', id)
      .single()

    if (orderError) {
      toast({ title: 'Грешка', description: 'Неуспешно зареждане на поръчката', variant: 'destructive' })
      console.error('[v0] Order fetch error:', orderError)
      setLoading(false)
      return
    }

    // Fetch profile separately
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', orderData.user_id)
      .single()

    setOrder({
      ...orderData,
      customer: profile || { full_name: null, email: 'Неизвестен' },
    })
    setLoading(false)
  }

  async function updateOrderStatus(newStatus: string) {
    if (order?.status === 'delivered' || order?.status === 'returned') {
      toast({ title: 'Инфо', description: 'Този статус не може да се променя повече.' })
      return
    }

    if (order?.status === 'return_requested' && !['return_requested', 'returned'].includes(newStatus)) {
      toast({ title: 'Инфо', description: 'При заявено връщане можеш само да одобриш като „Върната“.' })
      return
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешна промяна на статуса', variant: 'destructive' })
    } else {
      toast({ title: 'Успех', description: 'Статусът е обновен' })
      if (order) {
        setOrder({ ...order, status: newStatus as Order['status'] })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Поръчката не е намерена</p>
        <Button asChild className="mt-4">
          <Link href="/admin/orders">Назад към поръчките</Link>
        </Button>
      </div>
    )
  }

  const subtotal = order.order_items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const shippingAddress = order.shipping_address as { fullName?: string; address?: string; city?: string; state?: string; zipCode?: string; country?: string } | null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Поръчка #{order.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            Създадена на {new Date(order.created_at).toLocaleDateString('bg-BG')}
          </p>
        </div>
        {order.status === 'delivered' || order.status === 'returned' ? (
          <Badge variant="outline" className={statusColors[order.status]}>
            {statusLabels[order.status]}
          </Badge>
        ) : (
          <Select value={order.status} onValueChange={updateOrderStatus}>
            <SelectTrigger className="w-40">
              <Badge variant="outline" className={statusColors[order.status]}>
                {statusLabels[order.status] || order.status}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              {order.status === 'return_requested' ? (
                <>
                  <SelectItem value="return_requested">Заявено връщане</SelectItem>
                  <SelectItem value="returned">Върната</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="pending">Чакаща</SelectItem>
                  <SelectItem value="processing">Обработва се</SelectItem>
                  <SelectItem value="shipped">Изпратена</SelectItem>
                  <SelectItem value="delivered">Доставена</SelectItem>
                  <SelectItem value="cancelled">Отказана</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Продукти в поръчката ({order.order_items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.products?.image_url || '/placeholder.svg'}
                        alt={item.products?.name || 'Продукт'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {item.products?.name || 'Неизвестен продукт'}
                      </h4>
                      {item.size && (
                        <p className="text-sm text-muted-foreground">
                          Размер: {item.size}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Количество: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        €{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        €{item.price.toFixed(2)} за брой
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Клиент
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">
                {order.customer?.full_name || 'Гост'}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.customer?.email || 'Няма данни'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Адрес за доставка
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shippingAddress ? (
                <div className="text-sm space-y-1">
                  {shippingAddress.fullName && <p className="font-medium">{shippingAddress.fullName}</p>}
                  {shippingAddress.address && <p>{shippingAddress.address}</p>}
                  <p>
                    {[shippingAddress.city, shippingAddress.state, shippingAddress.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {shippingAddress.country && <p>{shippingAddress.country}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Няма въведен адрес</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Обобщение на плащането
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Междинна сума</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <>
                  <div className="flex justify-between text-sm text-primary">
                    <span>Отстъпка {order.discount_code && `(${order.discount_code})`}</span>
                    <span>-€{order.discount_amount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span>{subtotal >= 100 ? 'Безплатна' : '€9.99'}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Общо</span>
                <span>€{order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
