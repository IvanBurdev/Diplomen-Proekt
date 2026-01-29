'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, CreditCard, Loader2, ShoppingCart, Tag } from 'lucide-react'
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

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl font-bold text-foreground">Your Cart is Empty</h1>
        <p className="mt-2 text-muted-foreground">Add some items before checking out</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button>Browse Products</Button>
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
      setDiscountError('Invalid discount code')
      return
    }

    if (data.valid_until) {
      const now = new Date()
      const validUntil = new Date(data.valid_until)
      if (now > validUntil) {
        setDiscountError('This discount code has expired')
        return
      }
    }

    if (data.max_uses && data.current_uses >= data.max_uses) {
      setDiscountError('This discount code has reached its usage limit')
      return
    }

    setAppliedDiscount({
      code: data.code,
      percent: data.discount_percent,
      id: data.id,
    })
    toast({ title: 'Success', description: `Discount applied: ${data.discount_percent}% off!` })
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    setDiscountCode('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.zipCode) {
      toast({ title: 'Error', description: 'Please fill in all shipping details', variant: 'destructive' })
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

      toast({ title: 'Success', description: 'Order placed successfully!' })
      router.push(`/account/orders/${order.id}`)
    } catch {
      toast({ title: 'Error', description: 'Failed to place order. Please try again.', variant: 'destructive' })
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
        Back to Cart
      </Link>

      <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
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
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
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
                    <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
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
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertDescription>
                    This is a demo store. No actual payment will be processed.
                    Click &quot;Place Order&quot; to simulate a purchase.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
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
                        ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <Label htmlFor="discount">Discount Code</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="discount"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      placeholder="Enter code"
                      disabled={!!appliedDiscount}
                    />
                    {appliedDiscount ? (
                      <Button type="button" variant="outline" onClick={handleRemoveDiscount}>
                        Remove
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
                          'Apply'
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
                      {appliedDiscount.code}: {appliedDiscount.percent}% off
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">${totalPrice.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Discount ({appliedDiscount.percent}%)</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-foreground">
                      {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="font-serif text-xl font-bold text-foreground">
                    ${finalTotal.toFixed(2)}
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
                      Processing...
                    </>
                  ) : (
                    'Place Order'
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
