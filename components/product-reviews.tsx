'use client'

import React from "react"

import { useState } from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Review } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
}

export function ProductReviews({ productId, reviews }: ProductReviewsProps) {
  const { user } = useAuth()
  const supabase = createBrowserClient()
  const { toast } = useToast()
  
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({ title: 'Грешка', description: 'Влез в профила си, за да оставиш отзив', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title || null,
        comment: comment || null,
      })

    setIsSubmitting(false)

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешно изпращане на отзива', variant: 'destructive' })
      return
    }

    toast({ title: 'Успех', description: 'Отзивът е изпратен успешно!' })
    setShowForm(false)
    setRating(5)
    setTitle('')
    setComment('')
    window.location.reload()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bg-BG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Отзиви от клиенти
          </h2>
          {reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-5 w-5",
                      star <= Math.round(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} от 5 ({reviews.length} отзива)
              </span>
            </div>
          )}
        </div>

        {user && !showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Напиши отзив
          </Button>
        )}
      </div>

      {showForm && user && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Напиши своя отзив</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>Твоята оценка</Label>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="p-1"
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors",
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="title">Заглавие на отзива (по желание)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Обобщи отзива си"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="comment">Твоят отзив (по желание)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Сподели впечатленията си..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Изпращане...' : 'Изпрати отзив'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Отказ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                      {review.title && (
                        <span className="font-medium text-foreground">
                          {review.title}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      от {review.profiles?.full_name || 'Анонимен'} на {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-4 text-foreground">{review.comment}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground">Все още няма отзиви</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Бъди първият с отзив за този продукт!
            </p>
            {user && !showForm && (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Напиши отзив
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
