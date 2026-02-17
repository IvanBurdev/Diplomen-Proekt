'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Banknote, ChevronLeft, CreditCard, Loader2, ShoppingCart, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const { items, totalPrice, clearCart } = useCart()
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const [isProcessing, setIsProcessing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number; id: string } | null>(null)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: profile?.full_name || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  })

  const shipping = totalPrice >= 100 ? 0 : 9.99
  const discountAmount = appliedDiscount ? (totalPrice * appliedDiscount.percent) / 100 : 0
  const finalTotal = totalPrice - discountAmount + shipping

  if (!user) {
    router.push('/auth/login')
    return null
  }

  if (orderPlaced) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold text-foreground">Поръчката е приета</h1>
        <p className="mt-3 text-muted-foreground">
          Благодарим ти! Поръчката е записана успешно.
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button size="lg">Върни се в сайта</Button>
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl font-bold text-foreground">Количката е празна</h1>
        <p className="mt-2 text-muted-foreground">Добави продукти преди завършване на поръчката</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button>Разгледай продукти</Button>
        </Link>
      </div>
    )
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return

    setIsApplyingDiscount(true)
    setDiscountError(null)

    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', discountCode.toUpperCase())
      .eq('active', true)
      .single()

    setIsApplyingDiscount(false)

    if (error || !data) {
      setDiscountError('Невалиден код за отстъпка')
      return
    }

    if (data.valid_until) {
      const now = new Date()
      const validUntil = new Date(data.valid_until)
      if (now > validUntil) {
        setDiscountError('Този код за отстъпка е изтекъл')
        return
      }
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      setDiscountError('Този код за отстъпка е достигнал лимита си')
      return
    }

    setAppliedDiscount({
      code: data.code,
      percent: data.discount_percent,
      id: data.id,
    })
    toast({ title: 'Успех', description: `Кодът е приложен: -${data.discount_percent}%` })
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCode('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) {
      toast({ title: 'Грешка', description: 'Моля, попълни всички данни за доставка', variant: 'destructive' })
      return
    }

    setIsProcessing(true)

    try {
      const addressData = {
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'pending',
          total: finalTotal,
          discount_amount: discountAmount,
          shipping_address: addressData,
          discount_code: appliedDiscount?.code || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price || 0,
        size: item.size,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      if (appliedDiscount) {
        const { data: discountData } = await supabase
          .from('discount_codes')
          .select('current_uses')
          .eq('id', appliedDiscount.id)
          .single()
        
        if (discountData) {
          await supabase
            .from('discount_codes')
            .update({ current_uses: discountData.current_uses + 1 })
            .eq('id', appliedDiscount.id)
        }
      }

      await clearCart()

      // Fire-and-forget confirmation email; checkout remains successful even if email fails.
      if (user.email) {
        await fetch('/api/orders/confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            orderId: order.id,
            total: finalTotal,
            paymentMethod,
            fullName: shippingAddress.fullName,
          }),
        }).catch(() => undefined)
      }

      toast({ title: 'Успех', description: 'Поръчката е приета успешно!' })
      setOrderPlaced(true)
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешна поръчка. Опитай отново.', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/cart"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Назад към количката
      </Link>

      <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Завършване на поръчка</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Адрес за доставка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Име и фамилия</Label>
                  <Input
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Адрес</Label>
                  <Textarea
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    required
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="city">Град</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Област</Label>
                    <Input
                      id="state"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="zipCode">Пощенски код</Label>
                    <Input
                      id="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Държава</Label>
                    <Input
                      id="country"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Плащане
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    className="justify-start gap-2"
                    onClick={() => setPaymentMethod('card')}
                  >
                    <CreditCard className="h-4 w-4" />
                    Плащане с карта
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    className="justify-start gap-2"
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Banknote className="h-4 w-4" />
                    Плащане в брой
                  </Button>
                </div>
                <Alert>
                  <AlertDescription>
                    Това е демо магазин. Реално плащане няма да бъде обработено.
                    Натисни &quot;Потвърди поръчката&quot;, за да симулираш покупка.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Обобщение на поръчката</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.product?.image_url ? (
                          <Image
                            src={item.product.image_url || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.size} x {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        €{((item.product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <Label htmlFor="discount">Код за отстъпка</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="discount"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Въведи код"
                      disabled={!!appliedDiscount}
                    />
                    {appliedDiscount ? (
                      <Button type="button" variant="outline" onClick={handleRemoveDiscount}>
                        Премахни
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyDiscount}
                        disabled={isApplyingDiscount}
                      >
                        {isApplyingDiscount ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Приложи'
                        )}
                      </Button>
                    )}
                  </div>
                  {discountError && (
                    <p className="mt-1 text-xs text-destructive">{discountError}</p>
                  )}
                  {appliedDiscount && (
                    <p className="mt-1 text-xs text-primary flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {appliedDiscount.code}: -{appliedDiscount.percent}%
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Междинна сума</span>
                    <span className="font-medium text-foreground">€{totalPrice.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Отстъпка ({appliedDiscount.percent}%)</span>
                      <span>-€{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доставка</span>
                    <span className="font-medium text-foreground">
                      {shipping === 0 ? 'Безплатна' : `€${shipping.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Общо</span>
                  <span className="font-serif text-xl font-bold text-foreground">
                    €{finalTotal.toFixed(2)}
                  </span>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Обработване...
                    </>
                  ) : (
                    'Потвърди поръчката'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
