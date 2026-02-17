'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Eye, Search, Package, Loader2, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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

interface OrderWithProfile {
  id: string
  user_id: string
  status: string
  total: number
  discount_amount: number
  shipping_address: Record<string, unknown> | null
  discount_code: string | null
  created_at: string
  updated_at: string
  user_email?: string
  user_name?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  return_requested: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  returned: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
}

const statusLabels: Record<string, string> = {
  pending: 'Чакаща',
  processing: 'Обработва се',
  shipped: 'Изпратена',
  delivered: 'Доставена',
  cancelled: 'Отказана',
  return_requested: 'Заявено връщане',
  returned: 'Върната',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createBrowserClient()
  const { toast } = useToast()

  useEffect(() => {
    let isCancelled = false
    void fetchOrders(() => isCancelled)

    return () => {
      isCancelled = true
    }
  }, [statusFilter])

  function getErrorMessage(error: unknown, fallback: string) {
    if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message
    }
    return fallback
  }

  async function fetchOrders(isCancelled?: () => boolean) {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const ordersResult = await Promise.race([
        query,
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: 'Зареждането изтече (timeout).' } }), 12000)
        ),
      ])
      const { data: ordersData, error } = ordersResult

      if (error) {
        if (isCancelled?.()) {
          return
        }
        toast({
          title: 'Грешка',
          description: getErrorMessage(error, 'Неуспешно зареждане на поръчките'),
          variant: 'destructive',
        })
        setOrders([])
        return
      }

      const userIds = [...new Set((ordersData || []).map((o) => o.user_id))]
      let profileMap = new Map<string, { id: string; full_name: string | null; email: string }>()

      if (userIds.length > 0) {
        const profilesResult = await Promise.race([
          supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds),
          new Promise<{ data: null; error: { message: string } }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: { message: 'Зареждането на профили изтече (timeout).' } }), 12000)
          ),
        ])
        const { data: profiles, error: profilesError } = profilesResult

        if (profilesError) {
          if (isCancelled?.()) {
            return
          }
          toast({
            title: 'Предупреждение',
            description: 'Поръчките са заредени, но не можахме да заредим профилите на клиентите.',
            variant: 'destructive',
          })
        } else {
          profileMap = new Map((profiles || []).map((p) => [p.id, p]))
        }
      }

      const ordersWithProfiles = (ordersData || []).map((order) => ({
        ...order,
        user_email: profileMap.get(order.user_id)?.email || 'Неизвестен',
        user_name: profileMap.get(order.user_id)?.full_name || 'Гост',
      }))

      if (isCancelled?.()) {
        return
      }
      setOrders(ordersWithProfiles)
    } catch (error) {
      if (isCancelled?.()) {
        return
      }

      toast({
        title: 'Грешка',
        description: getErrorMessage(error, 'Възникна неочаквана грешка при зареждане на поръчките.'),
        variant: 'destructive',
      })
      setOrders([])
    } finally {
      if (!isCancelled?.()) {
        setLoading(false)
      }
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const currentOrder = orders.find((o) => o.id === orderId)
    if (currentOrder?.status === 'delivered' || currentOrder?.status === 'returned') {
      toast({ title: 'Инфо', description: 'Този статус не може да се променя повече.' })
      return
    }

    if (currentOrder?.status === 'return_requested' && !['return_requested', 'returned'].includes(newStatus)) {
      toast({ title: 'Инфо', description: 'При заявено връщане можеш само да одобриш като „Върната“.' })
      return
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      toast({ title: 'Грешка', description: 'Неуспешна промяна на статуса', variant: 'destructive' })
    } else {
      toast({ title: 'Успех', description: 'Статусът е обновен' })
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  async function deleteOrder(orderId: string) {
    setDeletingId(orderId)

    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (itemsError) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на продуктите от поръчката', variant: 'destructive' })
      setDeletingId(null)
      return
    }

    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)

    if (orderError) {
      toast({ title: 'Грешка', description: 'Неуспешно изтриване на поръчката', variant: 'destructive' })
      setDeletingId(null)
      return
    }

    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    toast({ title: 'Успех', description: 'Поръчката е изтрита' })
    setDeletingId(null)
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Поръчки</h1>
          <p className="text-muted-foreground">Управлявай и проследявай клиентските поръчки</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Всички поръчки ({filteredOrders.length})
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Търси поръчки..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Филтър по статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всички статуси</SelectItem>
                  <SelectItem value="pending">Чакаща</SelectItem>
                  <SelectItem value="processing">Обработва се</SelectItem>
                  <SelectItem value="shipped">Изпратена</SelectItem>
                  <SelectItem value="delivered">Доставена</SelectItem>
                  <SelectItem value="cancelled">Отказана</SelectItem>
                  <SelectItem value="return_requested">Заявено връщане</SelectItem>
                  <SelectItem value="returned">Върната</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-foreground">Няма намерени поръчки</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Поръчките ще се появят тук, когато клиентите пазаруват
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID поръчка</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Общо</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.user_name}</p>
                          <p className="text-sm text-muted-foreground">{order.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        €{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {order.status === 'delivered' || order.status === 'returned' ? (
                          <Badge variant="outline" className={statusColors[order.status]}>
                            {statusLabels[order.status]}
                          </Badge>
                        ) : (
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <Badge variant="outline" className={statusColors[order.status]}>
                                {statusLabels[order.status] || order.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {order.status === 'return_requested' ? (
                                <>
                                  <SelectItem value="return_requested">Заявено връщане</SelectItem>
                                  <SelectItem value="returned">Върната</SelectItem>
                                </>
                              ) : (
                                <>
                                  <SelectItem value="pending">Чакаща</SelectItem>
                                  <SelectItem value="processing">Обработва се</SelectItem>
                                  <SelectItem value="shipped">Изпратена</SelectItem>
                                  <SelectItem value="delivered">Доставена</SelectItem>
                                  <SelectItem value="cancelled">Отказана</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Преглед
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                disabled={deletingId === order.id}
                              >
                                {deletingId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Изтриване на поръчка</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Сигурен ли си, че искаш да изтриеш поръчка #{order.id.slice(0, 8).toUpperCase()}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отказ</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteOrder(order.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Изтрий
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
