"use client"

import React from "react"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Percent, Trash2, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DiscountCode } from "@/lib/types"

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    discount_percent: "",
    max_uses: "",
    valid_until: "",
  })
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchDiscounts()
  }, [])

  async function fetchDiscounts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        toast({ title: "Грешка", description: error.message || "Неуспешно зареждане на кодовете", variant: "destructive" })
      } else {
        setDiscounts(data || [])
      }
    } catch {
      toast({ title: "Грешка", description: "Възникна неочаквана грешка при зареждане на кодовете", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await supabase.from("discount_codes").insert({
      code: formData.code.toUpperCase(),
      discount_percent: parseInt(formData.discount_percent),
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_until: formData.valid_until || null,
      active: true,
      current_uses: 0,
    })

    if (error) {
      toast({ title: "Грешка", description: "Неуспешно създаване на код за отстъпка", variant: "destructive" })
    } else {
      toast({ title: "Успех", description: "Кодът за отстъпка е създаден" })
      setDialogOpen(false)
      setFormData({
        code: "",
        discount_percent: "",
        max_uses: "",
        valid_until: "",
      })
      fetchDiscounts()
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    const { error } = await supabase
      .from("discount_codes")
      .update({ active: !currentState })
      .eq("id", id)

    if (error) {
      toast({ title: "Грешка", description: "Неуспешно обновяване на отстъпката", variant: "destructive" })
    } else {
      toast({ title: "Успех", description: `Отстъпката е ${!currentState ? "активирана" : "деактивирана"}` })
      fetchDiscounts()
    }
  }

  async function deleteDiscount(id: string) {
    const { error } = await supabase
      .from("discount_codes")
      .delete()
      .eq("id", id)

    if (error) {
      toast({ title: "Грешка", description: "Неуспешно изтриване на отстъпката", variant: "destructive" })
    } else {
      toast({ title: "Успех", description: "Отстъпката е изтрита" })
      fetchDiscounts()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Кодове за отстъпка</h1>
          <p className="text-muted-foreground">
            Управлявай промо кодове и отстъпки
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добави отстъпка
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Създай код за отстъпка</DialogTitle>
              <DialogDescription>
                Добави нов промо код за клиентите
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Код</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="SUMMER20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="percent">Процент отстъпка</Label>
                  <Input
                    id="percent"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_percent: e.target.value })
                    }
                    placeholder="20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Макс. използвания</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) =>
                      setFormData({ ...formData, max_uses: e.target.value })
                    }
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Валиден до</Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) =>
                    setFormData({ ...formData, valid_until: e.target.value })
                  }
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Отказ
                </Button>
                <Button type="submit">Създай</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Активни отстъпки ({discounts.filter((d) => d.active).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Все още няма кодове за отстъпка
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Код</TableHead>
                    <TableHead>Отстъпка</TableHead>
                    <TableHead>Използвания</TableHead>
                    <TableHead>Валиден до</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-mono font-semibold">
                        {discount.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Percent className="h-4 w-4" />
                          {discount.discount_percent}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {discount.current_uses}
                        {discount.max_uses ? ` / ${discount.max_uses}` : ""}
                      </TableCell>
                      <TableCell>
                        {discount.valid_until
                          ? new Date(discount.valid_until).toLocaleDateString()
                          : "Без срок"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            discount.active
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {discount.active ? "Активна" : "Неактивна"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleActive(discount.id, discount.active)
                            }
                          >
                            {discount.active ? "Деактивирай" : "Активирай"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteDiscount(discount.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
