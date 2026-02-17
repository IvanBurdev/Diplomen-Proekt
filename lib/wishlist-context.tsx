'use client'

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import useSWR, { mutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import type { WishlistItem, Product } from '@/lib/types'
import { toast } from 'sonner'

interface WishlistContextType {
  items: WishlistItem[]
  isLoading: boolean
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (product: Product) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const fetcher = async (userId: string): Promise<WishlistItem[]> => {
  if (!userId) return []
  
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wishlist')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as WishlistItem[]
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const { data: items = [], isLoading } = useSWR(
    user ? `wishlist-${user.id}` : null,
    () => fetcher(user!.id)
  )

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.product_id === productId)
  }, [items])

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!user) {
      toast.error('Влез в профила си, за да управляваш любими')
      return
    }

    const existing = items.find(item => item.product_id === product.id)

    if (existing) {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', existing.id)

      if (error) {
        toast.error('Неуспешно премахване от любими')
        return
      }

      toast.success('Премахнато от любими')
    } else {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          product_id: product.id,
        })

      if (error) {
        toast.error('Неуспешно добавяне в любими')
        return
      }

      toast.success('Добавено в любими')
    }

    mutate(`wishlist-${user.id}`)
  }, [user, items, supabase])

  const removeFromWishlist = useCallback(async (productId: string) => {
    if (!user) return

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (error) {
      toast.error('Неуспешно премахване от любими')
      return
    }

    mutate(`wishlist-${user.id}`)
    toast.success('Премахнато от любими')
  }, [user, supabase])

  return (
    <WishlistContext.Provider value={{
      items,
      isLoading,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
