"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MessageSquare, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Review, Product } from "@/lib/types";

type ReviewWithDetails = Review & {
  products: Product;
  profiles: { full_name: string; email: string } | null;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  async function fetchReviews() {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select("*, products(*), profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (statusFilter === "approved") {
      query = query.eq("is_approved", true);
    } else if (statusFilter === "pending") {
      query = query.eq("is_approved", false);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load reviews");
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  }

  async function updateApproval(id: string, approved: boolean) {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: approved })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update review");
    } else {
      toast.success(approved ? "Review approved" : "Review rejected");
      fetchReviews();
    }
  }

  async function deleteReview(id: string) {
    const { error } = await supabase.from("reviews").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete review");
    } else {
      toast.success("Review deleted");
      fetchReviews();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">
            Moderate and manage customer reviews
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Customer Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reviews found
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
                          alt={review.products?.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {review.products?.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          by {review.profiles?.full_name || "Anonymous"} -{" "}
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          review.is_approved
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                        }
                      >
                        {review.is_approved ? "Approved" : "Pending"}
                      </Badge>
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
                  {review.comment && (
                    <p className="text-sm text-muted-foreground pl-15">
                      {review.comment}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    {!review.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 bg-transparent"
                        onClick={() => updateApproval(review.id, true)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {review.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateApproval(review.id, false)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => deleteReview(review.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
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
