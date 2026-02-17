'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/lib/auth-context'

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, isLoading, itemCount, totalPrice, updateQuantity, removeFromCart } = useCart()

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Твоята количка</h1>
          <p className="mt-2 text-muted-foreground">
            Влез в профила си, за да видиш количката
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/auth/login">
              <Button>Вход</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">Продължи с пазаруването</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Зареждане на количката...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Количката е празна</h1>
          <p className="mt-2 text-muted-foreground">
            Все още не си добавил продукти
          </p>
          <Link href="/products" className="mt-6 inline-block">
            <Button className="gap-2">
              Започни пазаруване
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-foreground mb-8">
        Количка ({itemCount} продукта)
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product?.image_url ? (
                      <Image
                        src={item.product.image_url || "/placeholder.svg"}
                        alt={item.product?.name || 'Продукт'}
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
                    <div className="flex items-start justify-between">
                      <div>
                        <Link 
                          href={`/products/${item.product?.slug}`}
                          className="font-medium text-foreground hover:text-primary transition-colors"
                        >
                          {item.product?.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Размер: {item.size} | Цвят: {item.color}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Премахни продукт</span>
                      </Button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product?.stock_quantity || 0)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-heading font-bold text-foreground">
                        €{((item.product?.price || 0) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Обобщение на поръчката</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Междинна сума</span>
                <span className="font-medium text-foreground">€{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span className="font-medium text-foreground">
                  {totalPrice >= 100 ? 'Безплатна' : '€9.99'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium text-foreground">Общо</span>
                <span className="font-heading text-xl font-bold text-foreground">
                  €{(totalPrice + (totalPrice >= 100 ? 0 : 9.99)).toFixed(2)}
                </span>
              </div>
              {totalPrice < 100 && (
                <p className="text-xs text-muted-foreground">
                  Добави още €{(100 - totalPrice).toFixed(2)} за безплатна доставка!
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                className="w-full gap-2" 
                size="lg"
                onClick={() => router.push('/checkout')}
              >
                Към завършване на поръчката
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Link href="/products" className="w-full">
                <Button variant="outline" className="w-full bg-transparent">
                  Продължи с пазаруването
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
