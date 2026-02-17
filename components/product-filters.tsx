'use client'

import React from "react"

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import type { Category } from '@/lib/types'
import { getCategoryLabelBg } from '@/lib/localization'

interface ProductFiltersProps {
  categories: Category[]
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const COLORS = [
  { value: 'White', label: 'Бял' },
  { value: 'Black', label: 'Черен' },
  { value: 'Red', label: 'Червен' },
  { value: 'Blue', label: 'Син' },
  { value: 'Green', label: 'Зелен' },
  { value: 'Yellow', label: 'Жълт' },
  { value: 'Navy', label: 'Тъмносин' },
  { value: 'Orange', label: 'Оранжев' },
  { value: 'Purple', label: 'Лилав' },
  { value: 'Pink', label: 'Розов' },
  { value: 'Gray', label: 'Сив' },
]

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const currentCategory = searchParams.get('category') || ''
  const currentSearch = searchParams.get('search') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const currentSizes = searchParams.get('sizes')?.split(',').filter(Boolean) || []
  const currentColors = searchParams.get('colors')?.split(',').filter(Boolean) || []
  const currentMinPrice = Number(searchParams.get('minPrice')) || 0
  const currentMaxPrice = Number(searchParams.get('maxPrice')) || 500

  const [searchValue, setSearchValue] = useState(currentSearch)
  const [priceRange, setPriceRange] = useState([currentMinPrice, currentMaxPrice])

  const updateFilters = useCallback((updates: Record<string, string | null>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      router.push(`/products?${params.toString()}`)
    })
  }, [router, searchParams])

  const applySearch = () => {
    updateFilters({ search: searchValue || null })
  }

  const toggleSize = (size: string) => {
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size]
    updateFilters({ sizes: newSizes.length > 0 ? newSizes.join(',') : null })
  }

  const toggleColor = (colorValue: string) => {
    const newColors = currentColors.includes(colorValue)
      ? currentColors.filter(c => c !== colorValue)
      : [...currentColors, colorValue]
    updateFilters({ colors: newColors.length > 0 ? newColors.join(',') : null })
  }

  const applyPriceRange = () => {
    updateFilters({
      minPrice: priceRange[0] > 0 ? priceRange[0].toString() : null,
      maxPrice: priceRange[1] < 500 ? priceRange[1].toString() : null,
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setPriceRange([0, 500])
    router.push('/products')
  }

  const hasActiveFilters = currentCategory || currentSearch || currentSizes.length > 0 || 
    currentColors.length > 0 || currentMinPrice > 0 || currentMaxPrice < 500

  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <Label className="text-sm font-medium text-foreground">Търсене</Label>
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Търси продукти..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applySearch()
              }
            }}
            className="flex-1"
          />
          <Button type="button" size="icon" variant="secondary" onClick={applySearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category */}
      <div>
        <Label className="text-sm font-medium text-foreground">Категория</Label>
        <Select
          value={currentCategory || 'all'}
          onValueChange={(value) => updateFilters({ category: value === 'all' ? null : value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Всички категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всички категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {getCategoryLabelBg(cat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium text-foreground">Ценови диапазон</Label>
        <div className="mt-4 px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={500}
            step={10}
            className="w-full"
          />
          <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>€{priceRange[0]}</span>
            <span>€{priceRange[1]}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full bg-transparent"
            onClick={applyPriceRange}
          >
            Приложи цена
          </Button>
        </div>
      </div>

      {/* Sizes */}
      <div>
        <Label className="text-sm font-medium text-foreground">Размер</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <Button
              key={size}
              variant={currentSizes.includes(size) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSize(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <Label className="text-sm font-medium text-foreground">Цвят</Label>
        <div className="mt-2 space-y-2">
          {COLORS.map((color) => (
            <div key={color.value} className="flex items-center gap-2">
              <Checkbox
                id={`color-${color.value}`}
                checked={currentColors.includes(color.value)}
                onCheckedChange={() => toggleColor(color.value)}
              />
              <label
                htmlFor={`color-${color.value}`}
                className="text-sm text-foreground cursor-pointer"
              >
                {color.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Изчисти филтрите
        </Button>
      )}
    </div>
  )

  return (
    <div>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-medium text-foreground">Филтри</h2>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Изчисти всичко
            </Button>
          )}
        </div>
        {renderFilterContent()}
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden flex items-center justify-between gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Търси продукти..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applySearch()
              }
            }}
            className="flex-1"
          />
          <Button type="button" size="icon" variant="secondary" onClick={applySearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
              Филтри
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Филтри</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {renderFilterContent()}
            </div>
          </SheetContent>
        </Sheet>

        <Select
          value={currentSort}
          onValueChange={(value) => updateFilters({ sort: value })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Сортирай по" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Най-нови</SelectItem>
            <SelectItem value="price_asc">Цена: ниска към висока</SelectItem>
            <SelectItem value="price_desc">Цена: висока към ниска</SelectItem>
            <SelectItem value="name">Име</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Sort */}
      <div className="hidden lg:flex items-center justify-end mb-6">
        <Select
          value={currentSort}
          onValueChange={(value) => updateFilters({ sort: value })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Сортирай по" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Най-нови</SelectItem>
            <SelectItem value="price_asc">Цена: ниска към висока</SelectItem>
            <SelectItem value="price_desc">Цена: висока към ниска</SelectItem>
            <SelectItem value="name">Име</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
