'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWishlist } from '@/lib/wishlist-context'
import { useAuth } from '@/lib/auth-context'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { getCategoryLabelBg } from '@/lib/localization'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const inWishlist = isInWishlist(product.id)
  
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  return (
    <Card className="group overflow-hidden border-border hover:border-primary/50 transition-colors">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <Image
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {discount > 0 && (
          <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">
            -{discount}%
          </Badge>
        )}
        
        {product.featured && (
          <Badge className="absolute right-2 top-2 bg-primary text-primary-foreground">
            Избрано
          </Badge>
        )}
        
        {user && (
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity",
              inWishlist && "opacity-100 bg-accent text-accent-foreground"
            )}
            onClick={(e) => {
              e.preventDefault()
              toggleWishlist(product)
            }}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
            <span className="sr-only">
              {inWishlist ? 'Премахни от любими' : 'Добави в любими'}
            </span>
          </Button>
        )}
      </div>
      
      <CardContent className="p-4">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="font-medium text-foreground line-clamp-1 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {product.category && (
          <p className="mt-1 text-xs text-muted-foreground">{getCategoryLabelBg(product.category)}</p>
        )}
        
        <div className="mt-2 flex items-center gap-2">
          <span className="font-heading text-lg font-bold text-foreground">
            €{product.price.toFixed(2)}
          </span>
          {product.original_price && (
            <span className="text-sm text-muted-foreground line-through">
              €{product.original_price.toFixed(2)}
            </span>
          )}
        </div>
        
        {product.stock <= 5 && product.stock > 0 && (
          <p className="mt-2 text-xs text-accent">Остават само {product.stock} бр.!</p>
        )}
        
        {product.stock === 0 && (
          <p className="mt-2 text-xs text-destructive">Изчерпан</p>
        )}
      </CardContent>
    </Card>
  )
}

