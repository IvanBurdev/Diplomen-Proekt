import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/product-form'
import type { Product, Category } from '@/lib/types'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').order('name'),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Назад към продуктите
        </Link>
        <h2 className="font-heading text-2xl font-bold text-foreground">Редакция на продукт</h2>
        <p className="text-muted-foreground">Обнови информацията за продукта</p>
      </div>

      <ProductForm 
        product={product as Product} 
        categories={(categories as Category[]) || []} 
      />
    </div>
  )
}
