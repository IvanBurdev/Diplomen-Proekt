import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, Shield, RefreshCcw, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import type { Product, Category } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  
  const [{ data: featuredProducts }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('featured', true)
      .limit(4),
    supabase
      .from('categories')
      .select('*')
      .order('name'),
  ])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-sidebar py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
                New Season 2025/26
              </Badge>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-sidebar-foreground sm:text-5xl lg:text-6xl text-balance">
                Gear Up for Glory
              </h1>
              <p className="mt-6 text-lg text-sidebar-foreground/80 leading-relaxed max-w-xl">
                Shop the latest football kits from the world's biggest clubs. 
                Authentic jerseys, training gear, and accessories delivered to your door.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="gap-2">
                    Shop Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/products?category=home-kits">
                  <Button size="lg" variant="outline" className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent bg-transparent">
                    View Home Kits
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative aspect-square lg:aspect-[4/3]">
              <div className="absolute inset-0 rounded-2xl bg-primary/10 transform rotate-3" />
              <div className="relative h-full w-full rounded-2xl overflow-hidden bg-sidebar-accent flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-8xl mb-4">⚽</div>
                  <p className="text-sidebar-foreground/60 font-medium">Premium Football Kits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 border-b border-border">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over $100' },
              { icon: Shield, title: 'Authentic Guarantee', desc: '100% genuine products' },
              { icon: RefreshCcw, title: 'Easy Returns', desc: '30-day return policy' },
              { icon: Star, title: 'Top Rated', desc: '4.9/5 customer rating' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Shop by Category
              </h2>
              <p className="mt-2 text-muted-foreground">Find the perfect kit for every occasion</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {(categories as Category[])?.map((category) => (
              <Link 
                key={category.id} 
                href={`/products?category=${category.slug}`}
                className="group"
              >
                <Card className="overflow-hidden border-border hover:border-primary/50 transition-colors">
                  <div className="aspect-[4/3] bg-secondary flex items-center justify-center">
                    <span className="text-4xl">
                      {category.slug === 'home-kits' && '🏠'}
                      {category.slug === 'away-kits' && '✈️'}
                      {category.slug === 'training-gear' && '🏃'}
                      {category.slug === 'accessories' && '🎒'}
                      {category.slug === 'retro-kits' && '🏆'}
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-secondary">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
                Featured Kits
              </h2>
              <p className="mt-2 text-muted-foreground">Top picks from our collection</p>
            </div>
            <Link href="/products?featured=true">
              <Button variant="ghost" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(featuredProducts as Product[])?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl text-balance">
            Join the KitZone Community
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Sign up today and get 10% off your first order. Plus exclusive access to new releases and member-only deals.
          </p>
          <div className="mt-8">
            <Link href="/auth/sign-up">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
