'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Product, Category } from '@/lib/types'
import { getCategoryLabelBg, getColorLabelBg } from '@/lib/localization'
import { normalizeSizeStock } from '@/lib/size-stock'

interface ProductFormProps {
  product?: Product
  categories: Category[]
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLORS = ['Red', 'Blue', 'White', 'Black', 'Green', 'Yellow', 'Navy', 'Orange', 'Purple', 'Pink', 'Gray']

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const isEditing = !!product

  const initialSizeStock = (() => {
    const parsed = normalizeSizeStock(product?.size_stock)
    if (Object.keys(parsed).length > 0) {
      return parsed
    }

    if (product?.sizes?.length) {
      const fallbackPerSize = Math.max(0, Math.floor((product.stock || 0) / product.sizes.length))
      return product.sizes.reduce<Record<string, number>>((acc, size) => {
        acc[size] = fallbackPerSize
        return acc
      }, {})
    }

    return {}
  })()
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    original_price: product?.original_price?.toString() || '',
    category_id: product?.category_id || '',
    image_url: product?.image_url || '',
    team: product?.team || '',
    season: product?.season || '',
    stock: product?.stock?.toString() || '0',
    featured: product?.featured || false,
    sizes: product?.sizes || [],
    size_stock: initialSizeStock,
    colors: product?.colors || [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const hasSizedInventory = formData.sizes.length > 0
  const totalSizeStock = formData.sizes.reduce((sum, size) => sum + (formData.size_stock[size] ?? 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const normalizedSizeStock = formData.sizes.reduce<Record<string, number>>((acc, size) => {
        acc[size] = Math.max(0, Math.floor(Number(formData.size_stock[size] ?? 0)))
        return acc
      }, {})

      const productData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        team: formData.team || null,
        season: formData.season || null,
        stock: hasSizedInventory ? totalSizeStock : parseInt(formData.stock),
        featured: formData.featured,
        sizes: formData.sizes,
        size_stock: normalizedSizeStock,
        colors: formData.colors,
      }

      if (!productData.category_id) {
        toast({
          title: 'Грешка',
          description: 'Избери категория на продукта.',
          variant: 'destructive',
        })
        return
      }

      const request = isEditing && product
        ? supabase
            .from('products')
            .update(productData)
            .eq('id', product.id)
        : supabase
            .from('products')
            .insert(productData)

      const { error } = await request

      if (error) {
        toast({
          title: 'Грешка',
          description: `${isEditing ? 'Неуспешно обновяване' : 'Неуспешно създаване'} на продукта: ${error.message}`,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Успех',
        description: isEditing ? 'Продуктът е обновен успешно' : 'Продуктът е създаден успешно',
      })

      router.replace('/admin/products')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Грешка',
        description:
          error instanceof Error
            ? `Възникна грешка: ${error.message}`
            : 'Възникна неочаквана грешка при запис.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSize = (size: string) => {
    setFormData((prev) => {
      const isSelected = prev.sizes.includes(size)
      const nextSizes = isSelected
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
      const nextSizeStock = { ...prev.size_stock }

      if (isSelected) {
        delete nextSizeStock[size]
      } else if (nextSizeStock[size] === undefined) {
        nextSizeStock[size] = 0
      }

      return {
        ...prev,
        sizes: nextSizes,
        size_stock: nextSizeStock,
      }
    })
  }

  const updateSizeStock = (size: string, rawValue: string) => {
    const safeValue = rawValue === '' ? 0 : Math.max(0, Math.floor(Number(rawValue)))
    setFormData((prev) => ({
      ...prev,
      size_stock: {
        ...prev.size_stock,
        [size]: Number.isFinite(safeValue) ? safeValue : 0,
      },
    }))
  }

  const toggleColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter(c => c !== color)
        : [...prev.colors, color],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Основна информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Име на продукт</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="slug">Слъг (URL)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder={generateSlug(formData.name) || 'автоматично'}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="team">Отбор</Label>
              <Input
                id="team"
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                placeholder="напр. Manchester United"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="season">Сезон</Label>
              <Input
                id="season"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="напр. 2025-26"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Категория</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Избери категория" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {getCategoryLabelBg(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="image_url">URL на снимка</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Цена и наличност</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="price">Цена (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="original_price">Стара цена (€)</Label>
              <Input
                id="original_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                placeholder="Остави празно, ако няма намаление"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="stock">Наличност</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={hasSizedInventory ? totalSizeStock.toString() : formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                className="mt-1"
                readOnly={hasSizedInventory}
              />
              {hasSizedInventory && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Автоматично се смята от наличността по размери.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Размери</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Налични размери</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SIZES.map((size) => (
                <Button
                  key={size}
                  type="button"
                  variant={formData.sizes.includes(size) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {formData.sizes.length > 0 && (
            <div>
              <Label>Наличност по размер</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {formData.sizes.map((size) => (
                  <div key={size}>
                    <Label htmlFor={`size-stock-${size}`}>{size}</Label>
                    <Input
                      id={`size-stock-${size}`}
                      type="number"
                      min="0"
                      value={(formData.size_stock[size] ?? 0).toString()}
                      onChange={(e) => updateSizeStock(size, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Цветове</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Налични цветове</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  variant={formData.colors.includes(color) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleColor(color)}
                >
                  {getColorLabelBg(color)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Настройки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="featured">Избрано</Label>
              <p className="text-sm text-muted-foreground">Показвай в секция „Избрани“ на началната страница</p>
            </div>
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Обновяване...' : 'Създаване...'}
            </>
          ) : (
            isEditing ? 'Обнови продукт' : 'Създай продукт'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отказ
        </Button>
      </div>
    </form>
  )
}
