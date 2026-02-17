import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/product-form'
import type { Category } from '@/lib/types'

export default async function NewProductPage() {
  const supabase = await createClient()
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

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
        <h2 className="font-heading text-2xl font-bold text-foreground">Добави нов продукт</h2>
        <p className="text-muted-foreground">Създай нов продукт за магазина</p>
      </div>

      <ProductForm categories={(categories as Category[]) || []} />
    </div>
  )
}
