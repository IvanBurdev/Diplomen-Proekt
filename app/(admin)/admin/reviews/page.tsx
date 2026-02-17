"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MessageSquare, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Review, Product } from "@/lib/types";

type ReviewWithDetails = Review & {
  products: Product;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const supabase = createBrowserClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter]);

  async function fetchReviews() {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select("*, products(*)")
      .order("created_at", { ascending: false });

    if (ratingFilter !== "all") {
      query = query.eq("rating", parseInt(ratingFilter));
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Грешка",
        description: "Неуспешно зареждане на отзивите",
        variant: "destructive",
      });
    } else {
      setReviews((data as ReviewWithDetails[]) || []);
    }
    setLoading(false);
  }

  async function deleteReview(id: string) {
    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      toast({
        title: "Грешка",
        description: "Неуспешно изтриване на отзива",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успех",
        description: "Отзивът е изтрит",
      });
      fetchReviews();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Отзиви</h1>
          <p className="text-muted-foreground">
            Управлявай клиентските отзиви
          </p>
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Филтър по оценка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всички оценки</SelectItem>
            <SelectItem value="5">5 звезди</SelectItem>
            <SelectItem value="4">4 звезди</SelectItem>
            <SelectItem value="3">3 звезди</SelectItem>
            <SelectItem value="2">2 звезди</SelectItem>
            <SelectItem value="1">1 звезда</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Клиентски отзиви ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Няма намерени отзиви
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 rounded-lg border bg-card space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={review.products?.image_url || "/placeholder.svg"}
                          alt={review.products?.name || "Продукт"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {review.products?.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.title && (
                    <p className="font-medium">{review.title}</p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteReview(review.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Изтрий
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
