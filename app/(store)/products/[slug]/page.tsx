import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductDetails } from '@/components/product-details'
import { ProductReviews } from '@/components/product-reviews'
import type { Product, Review } from '@/lib/types'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .single()

  if (!product) {
    notFound()
  }

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })

  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .limit(4)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <ProductDetails 
        product={product as Product} 
        relatedProducts={(relatedProducts as Product[]) || []}
      />
      <ProductReviews 
        productId={product.id} 
        reviews={(reviews as Review[]) || []}
      />
    </div>
  )
}
