'use client'

import Link from 'next/link'
import { Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product-card'
import { useWishlist } from '@/lib/wishlist-context'
import { useAuth } from '@/lib/auth-context'
import type { Product } from '@/lib/types'

export default function WishlistPage() {
  const { user } = useAuth()
  const { items, isLoading } = useWishlist()

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Любими продукти</h1>
          <p className="mt-2 text-muted-foreground">
            Влез в профила си, за да видиш любимите
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/auth/login">
              <Button>Вход</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">Разгледай продукти</Button>
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
          <p className="mt-4 text-muted-foreground">Зареждане на любими...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">Нямаш запазени любими</h1>
          <p className="mt-2 text-muted-foreground">
            Запазвай продукти, за да ги намериш по-късно
          </p>
          <Link href="/products" className="mt-6 inline-block">
            <Button className="gap-2">
              Разгледай продукти
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Моите любими</h1>
        <p className="mt-2 text-muted-foreground">Запазени продукти: {items.length}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item.product as Product} />
        ))}
      </div>
    </div>
  )
}
