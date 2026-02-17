'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Heart, Minus, Plus, ShoppingCart, ChevronLeft, Truck, Shield, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { ProductCard } from '@/components/product-card'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getCategoryLabelBg, getColorLabelBg } from '@/lib/localization'
import { getStockForSize, getTotalStock } from '@/lib/size-stock'

interface ProductDetailsProps {
  product: Product
  relatedProducts: Product[]
}

export function ProductDetails({ product, relatedProducts }: ProductDetailsProps) {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  
  const sizes = product.sizes || []
  const colors = product.colors || []
  const availableSizes = useMemo(
    () => sizes.filter((size) => getStockForSize(product, size) > 0),
    [product, sizes]
  )
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || sizes[0] || '')
  const [selectedColor, setSelectedColor] = useState(colors[0] || '')
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const selectedSizeStock = selectedSize ? getStockForSize(product, selectedSize) : 0
  const availableStock = sizes.length > 0 ? selectedSizeStock : getTotalStock(product)

  useEffect(() => {
    if (sizes.length === 0) return
    if (!selectedSize || getStockForSize(product, selectedSize) <= 0) {
      setSelectedSize(availableSizes[0] || '')
    }
  }, [availableSizes, product, selectedSize, sizes.length])

  useEffect(() => {
    setQuantity((current) => Math.max(1, Math.min(current, Math.max(availableStock, 1))))
  }, [availableStock])

  const inWishlist = isInWishlist(product.id)
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const handleAddToCart = async () => {
    if ((sizes.length > 0 && !selectedSize) || availableStock <= 0) return
    
    setIsAddingToCart(true)
    await addToCart(product, quantity, selectedSize)
    setIsAddingToCart(false)
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link 
          href="/products" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Назад към продуктите
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingCart className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
          
          {discount > 0 && (
            <Badge className="absolute left-4 top-4 bg-accent text-accent-foreground text-lg px-3 py-1">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.category && (
            <Link 
              href={`/products?category=${product.category.slug}`}
              className="text-sm text-primary hover:underline"
            >
              {getCategoryLabelBg(product.category)}
            </Link>
          )}
          
          <h1 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-4">
            <span className="font-heading text-3xl font-bold text-foreground">
              €{product.price.toFixed(2)}
            </span>
            {product.original_price && (
              <span className="text-xl text-muted-foreground line-through">
                €{product.original_price.toFixed(2)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Color Selection */}
          {colors.length > 0 && (
            <div className="mt-8">
              <span className="text-sm font-medium text-foreground">Цвят: {getColorLabelBg(selectedColor)}</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedColor === color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                  >
                    {getColorLabelBg(color)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div className={colors.length > 0 ? "mt-6" : "mt-8"}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Размер</span>
              <Link href="/size-guide" className="text-sm text-primary hover:underline">
                Таблица с размери
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.length > 0 ? sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'min-w-12',
                    getStockForSize(product, size) <= 0 && 'opacity-50'
                  )}
                  disabled={getStockForSize(product, size) <= 0}
                >
                  {size}
                </Button>
              )) : (
                <span className="text-sm text-muted-foreground">Универсален размер</span>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <span className="text-sm font-medium text-foreground">Количество</span>
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium text-foreground">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(availableStock || 1, quantity + 1))}
                disabled={quantity >= (availableStock || 1) || availableStock <= 0}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stock Status */}
          {availableStock <= 5 && availableStock > 0 && (
            <p className="mt-4 text-sm text-accent">
              Остават само {availableStock} бр. в наличност!
            </p>
          )}
          {availableStock === 0 && (
            <p className="mt-4 text-sm text-destructive font-medium">Изчерпан</p>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={(sizes.length > 0 && !selectedSize) || availableStock === 0 || isAddingToCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {isAddingToCart ? 'Добавяне...' : 'Добави в количката'}
            </Button>
            
            {user && (
              <Button
                size="lg"
                variant="outline"
                className={cn(inWishlist && 'bg-accent/10 border-accent text-accent')}
                onClick={() => toggleWishlist(product)}
              >
                <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
                <span className="sr-only">
                  {inWishlist ? 'Премахни от любими' : 'Добави в любими'}
                </span>
              </Button>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Truck, title: 'Безплатна доставка', desc: 'За поръчки над €100' },
              { icon: Shield, title: 'Автентичност', desc: '100% оригинални' },
              { icon: RefreshCcw, title: 'Лесно връщане', desc: 'До 30 дни' },
            ].map((feature) => (
              <Card key={feature.title} className="border-border">
                <CardContent className="flex items-center gap-3 p-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
            Може да ти хареса и
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
