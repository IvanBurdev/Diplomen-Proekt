'use client'

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import useSWR, { mutate } from 'swr'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth-context'
import type { CartItem, Product } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface CartContextType {
  items: CartItem[]
  isLoading: boolean
  itemCount: number
  totalPrice: number
  addToCart: (product: Product, quantity: number, size: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const fetcher = async (userId: string): Promise<CartItem[]> => {
  if (!userId) return []
  
  const supabase = createBrowserClient()
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as CartItem[]
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const supabase = createBrowserClient()
  const { toast } = useToast()
  
  const { data: items = [], isLoading } = useSWR(
    user ? `cart-${user.id}` : null,
    () => fetcher(user!.id)
  )

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => {
    const price = item.product?.price ?? 0
    return sum + (price * item.quantity)
  }, 0)

  const addToCart = useCallback(async (product: Product, quantity: number, size: string) => {
    if (!user) {
      toast({ title: 'Грешка', description: 'Влез в профила си, за да добавяш продукти в количката', variant: 'destructive' })
      return
    }

    const existingItem = items.find(
      item => item.product_id === product.id && item.size === size
    )

    if (existingItem) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)

      if (error) {
        toast({ title: 'Грешка', description: 'Неуспешно обновяване на количката', variant: 'destructive' })
        return
      }
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          quantity,
          size,
        })

      if (error) {
        toast({ title: 'Грешка', description: 'Неуспешно добавяне в количката', variant: 'destructive' })
        return
      }
    }

    mutate(`cart-${user.id}`)
    toast({ title: 'Успех', description: 'Добавено в количката' })
  }, [user, items, supabase, toast])

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (!user) return

    if (quantity <= 0) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) {
        toast({ title: 'Грешка', description: 'Неуспешно премахване на продукта', variant: 'destructive' })
        return
      }

      mutate(`cart-${user.id}`)
      toast({ title: 'Успех', description: 'Продуктът е премахнат от количката' })
      return
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно обновяване на количеството', variant: 'destructive' })
      return
    }

    mutate(`cart-${user.id}`)
  }, [user, supabase, toast])

  const removeFromCart = useCallback(async (itemId: string) => {
    if (!user) return

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно премахване на продукта', variant: 'destructive' })
      return
    }

    mutate(`cart-${user.id}`)
    toast({ title: 'Успех', description: 'Продуктът е премахнат от количката' })
  }, [user, supabase, toast])

  const clearCart = useCallback(async () => {
    if (!user) return

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изчистване на количката', variant: 'destructive' })
      return
    }

    mutate(`cart-${user.id}`)
  }, [user, supabase, toast])

  return (
    <CartContext.Provider value={{
      items,
      isLoading,
      itemCount,
      totalPrice,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
