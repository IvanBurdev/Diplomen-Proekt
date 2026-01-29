import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { ProductFilters } from '@/components/product-filters'
import type { Product, Category } from '@/lib/types'

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    sort?: string
    sizes?: string

    minPrice?: string
    maxPrice?: string
    featured?: string
  }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  // Build products query
  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .gt('stock', 0)

  // Apply filters
  if (params.category && params.category !== 'all-kits') {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', params.category)
      .single()
    
    if (category) {
      query = query.eq('category_id', category.id)
    }
  } else if (params.category === 'all-kits') {
    // For "all-kits", show products from home-kits, away-kits, and third-kits categories
    const { data: kitCategories } = await supabase
      .from('categories')
      .select('id')
      .in('slug', ['home-kits', 'away-kits', 'third-kits'])
    
    if (kitCategories && kitCategories.length > 0) {
      const categoryIds = kitCategories.map(cat => cat.id)
      query = query.in('category_id', categoryIds)
    }
  }

  if (params.search) {
    query = query.ilike('name', `%${params.search}%`)
  }

  if (params.featured === 'true') {
    query = query.eq('featured', true)
  }

  if (params.minPrice) {
    query = query.gte('price', Number(params.minPrice))
  }

  if (params.maxPrice) {
    query = query.lte('price', Number(params.maxPrice))
  }

  if (params.sizes) {
    const sizes = params.sizes.split(',')
    query = query.overlaps('sizes', sizes)
  }

  // Apply sorting
  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const { data: products } = await query

  // Get current category name for title
  const currentCategory = (categories as Category[])?.find(c => c.slug === params.category)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {currentCategory ? currentCategory.name : 'All Products'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {products?.length || 0} products found
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block">
          <ProductFilters categories={(categories as Category[]) || []} />
        </aside>

        {/* Products Grid */}
        <div>
          {/* Mobile Filters */}
          <div className="lg:hidden">
            <ProductFilters categories={(categories as Category[]) || []} />
          </div>

          {products && products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {(products as Product[]).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                No products found
              </h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
