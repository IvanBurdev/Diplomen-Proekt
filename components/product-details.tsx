'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
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

interface ProductDetailsProps {
  product: Product
  relatedProducts: Product[]
}

export function ProductDetails({ product, relatedProducts }: ProductDetailsProps) {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  
  const sizes = product.sizes || []
  const [selectedSize, setSelectedSize] = useState(sizes[0] || '')
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const inWishlist = isInWishlist(product.id)
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const handleAddToCart = async () => {
    if (!selectedSize) return
    
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
          Back to Products
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
              {product.category.name}
            </Link>
          )}
          
          <h1 className="mt-2 font-heading text-3xl font-bold text-foreground sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-4">
            <span className="font-heading text-3xl font-bold text-foreground">
              ${product.price.toFixed(2)}
            </span>
            {product.original_price && (
              <span className="text-xl text-muted-foreground line-through">
                ${product.original_price.toFixed(2)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Size Selection */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Size</span>
              <Link href="/size-guide" className="text-sm text-primary hover:underline">
                Size Guide
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.length > 0 ? sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSize(size)}
                  className="min-w-12"
                >
                  {size}
                </Button>
              )) : (
                <span className="text-sm text-muted-foreground">One size fits all</span>
              )}
            </div>
          </div>

{/* Quantity */}
          <div className="mt-6">
            <span className="text-sm font-medium text-foreground">Quantity</span>
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
                onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                disabled={quantity >= (product.stock || 10)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stock Status */}
          {product.stock <= 5 && product.stock > 0 && (
            <p className="mt-4 text-sm text-accent">
              Only {product.stock} left in stock!
            </p>
          )}
          {product.stock === 0 && (
            <p className="mt-4 text-sm text-destructive font-medium">Out of stock</p>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <Button
              size="lg"
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={(sizes.length > 0 && !selectedSize) || product.stock === 0 || isAddingToCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
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
                  {inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                </span>
              </Button>
            )}
          </div>

          {/* Features */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders $100+' },
              { icon: Shield, title: 'Authentic', desc: '100% genuine' },
              { icon: RefreshCcw, title: 'Easy Returns', desc: '30 days' },
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
            You Might Also Like
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
