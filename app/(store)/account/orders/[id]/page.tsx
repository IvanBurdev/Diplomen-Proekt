import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, Package, ShoppingCart, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import type { Order, OrderItem } from '@/lib/types'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-primary/10 text-primary border-primary/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
}

const statusIcons: Record<string, typeof Package> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    notFound()
  }

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*, product:products(*)')
    .eq('order_id', id)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const StatusIcon = statusIcons[order.status]
  const subtotal = (orderItems as OrderItem[])?.reduce(
    (sum, item) => sum + item.price_at_time * item.quantity,
    0
  ) || 0
  const shipping = order.total_amount - subtotal + order.discount_amount

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/account/orders"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Order #{(order as Order).id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Placed on {formatDate((order as Order).created_at)}
          </p>
        </div>
        <Badge className={`${statusColors[(order as Order).status]} text-sm px-4 py-2`}>
          <StatusIcon className="mr-2 h-4 w-4" />
          {(order as Order).status.charAt(0).toUpperCase() + (order as Order).status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Order Items */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(orderItems as OrderItem[])?.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product?.image_url ? (
                      <Image
                        src={item.product.image_url || "/placeholder.svg"}
                        alt={item.product?.name || 'Product'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.product?.slug}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {item.product?.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Size: {item.size} | Color: {item.color}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        Qty: {item.quantity} x ${item.price_at_time.toFixed(2)}
                      </span>
                      <span className="font-medium text-foreground">
                        ${(item.price_at_time * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-line">
                {(order as Order).shipping_address}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
              </div>
              {(order as Order).discount_amount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Discount</span>
                  <span>-${(order as Order).discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-foreground">
                  {shipping <= 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-heading text-xl font-bold text-foreground">
                  ${(order as Order).total_amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4">
            <Link href="/products">
              <Button variant="outline" className="w-full bg-transparent">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
