'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Package, Edit, Eye, Trash2, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import type { Product } from '@/lib/types'
import { getCategoryLabelBg } from '@/lib/localization'
import { normalizeSizeStock } from '@/lib/size-stock'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<(Product & { category: { name: string } | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(name)')
        .order('created_at', { ascending: false })

      if (error) {
        toast({ title: 'Грешка', description: error.message || 'Неуспешно зареждане на продуктите', variant: 'destructive' })
      } else {
        setProducts(data || [])
      }
    } catch {
      toast({ title: 'Грешка', description: 'Възникна неочаквана грешка при зареждане на продуктите', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(productId: string) {
    setDeletingId(productId)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на продукта', variant: 'destructive' })
    } else {
      toast({ title: 'Успех', description: 'Продуктът е изтрит успешно' })
      setProducts(products.filter(p => p.id !== productId))
    }
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Продукти</h2>
          <p className="text-muted-foreground">Управлявай продуктовия каталог</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Добави продукт
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url || '/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                    {product.featured && (
                      <Badge variant="secondary">Избрано</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryLabelBg(product.category || {})} | €{product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Наличност: {product.stock} | SKU: {product.slug}
                  </p>
                  {product.sizes?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      По размери:{' '}
                      {product.sizes
                        .map((size) => `${size}: ${normalizeSizeStock(product.size_stock)[size] ?? 0}`)
                        .join(' | ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/products/${product.slug}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Преглед</span>
                    </Button>
                  </Link>
                  <Link href={`/admin/products/${product.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Редакция</span>
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Изтрий</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Изтриване на продукт</AlertDialogTitle>
                        <AlertDialogDescription>
                          Сигурен ли си, че искаш да изтриеш &quot;{product.name}&quot;? Това действие не може да бъде отменено.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отказ</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProduct(product.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Изтрий'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {products.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground">Все още няма продукти</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Започни, като добавиш първия си продукт
              </p>
              <Link href="/admin/products/new" className="mt-4">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Добави продукт
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
