import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { ProductFilters } from '@/components/product-filters'
import type { Product, Category } from '@/lib/types'
import { getCategoryLabelBg } from '@/lib/localization'
import { getStockForSize } from '@/lib/size-stock'

const CATEGORY_SLUG_ALIASES: Record<string, string[]> = {
  'training-gear': ['training-wear'],
  'retro-kits': ['retro-classics'],
  'training-wear': ['training-gear'],
  'retro-classics': ['retro-kits'],
}

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    search?: string
    sort?: string
    sizes?: string
    colors?: string
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
  let resolvedCategorySlug = params.category
  if (params.category) {
    const categoryCandidates = [params.category, ...(CATEGORY_SLUG_ALIASES[params.category] || [])]
    let { data: category } = await supabase
      .from('categories')
      .select('id, slug')
      .eq('slug', params.category)
      .maybeSingle()

    if (!category && categoryCandidates.length > 1) {
      const { data: aliasCategory } = await supabase
        .from('categories')
        .select('id, slug')
        .in('slug', categoryCandidates)
        .limit(1)
        .maybeSingle()
      category = aliasCategory
    }

    if (category) {
      query = query.eq('category_id', category.id)
      resolvedCategorySlug = category.slug
    } else {
      query = query.eq('category_id', '00000000-0000-0000-0000-000000000000')
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
  let filteredProducts = (products as Product[]) || []

  // Color filtering with case-insensitive matching to handle inconsistent stored values.
  if (params.colors) {
    const selectedColors = params.colors
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)

    filteredProducts = filteredProducts.filter((product) => {
      const productColors = (product.colors || []).map((c) => c.toLowerCase())
      return selectedColors.some((selected) => productColors.includes(selected))
    })
  }

  if (params.sizes) {
    const selectedSizes = params.sizes
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean)

    filteredProducts = filteredProducts.filter((product) =>
      selectedSizes.some((size) => getStockForSize(product, size) > 0)
    )
  }

  // Get current category name for title
  const currentCategory = (categories as Category[])?.find(c => c.slug === resolvedCategorySlug)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {currentCategory ? getCategoryLabelBg(currentCategory) : 'Всички продукти'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {filteredProducts.length || 0} намерени продукта
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

          {filteredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Няма намерени продукти
              </h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                Опитай да промениш филтрите или търсенето.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
