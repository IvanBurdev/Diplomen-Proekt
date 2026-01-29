import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Star } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get stats
  const [
    { count: productCount },
    { count: orderCount },
    { count: userCount },
    { data: orders },
    { count: pendingReviewCount },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').eq('status', 'delivered'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
  ])

  const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

  // Get recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*, profile:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(5)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const stats = [
    { title: 'Total Products', value: productCount || 0, icon: Package, color: 'text-blue-500' },
    { title: 'Total Orders', value: orderCount || 0, icon: ShoppingCart, color: 'text-green-500' },
    { title: 'Total Users', value: userCount || 0, icon: Users, color: 'text-purple-500' },
    { title: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back! Here's what's happening in your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`rounded-full bg-muted p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      {pendingReviewCount && pendingReviewCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 p-4">
            <Star className="h-8 w-8 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {pendingReviewCount} reviews pending approval
              </p>
              <p className="text-sm text-muted-foreground">
                Review and approve customer feedback
              </p>
            </div>
            <a
              href="/admin/reviews"
              className="text-sm font-medium text-primary hover:underline"
            >
              Review Now
            </a>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders?.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-foreground">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.profile?.full_name || order.profile?.email || 'Unknown'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    ${Number(order.total_amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No orders yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
