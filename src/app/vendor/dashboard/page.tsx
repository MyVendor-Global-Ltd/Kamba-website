'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatKobo } from '@/lib/formatting'
import { isMockMode } from '@/lib/mock-api'
import { LiveVendorDashboard } from '@/components/vendor/live-dashboard'
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  DollarSign, 
  Users, 
  Star,
  Clock,
  Package,
  AlertTriangle,
  BarChart3,
  LineChart,
  PieChart,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Settings,
  Store,
  Activity,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Filter,
  Search,
  MoreVertical,
} from 'lucide-react'

interface VendorStats {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    change: number
  }
  orders: {
    total: number
    thisMonth: number
    pending: number
    confirmed: number
    processing: number
    shipped: number
    out_for_delivery: number
    completed: number
    cancelled: number
  }
  products: {
    total: number
    active: number
    lowStock: number
    outOfStock: number
  }
  customers: {
    total: number
    newThisMonth: number
    returning: number
  }
  rating: {
    average: number
    totalReviews: number
  }
}

interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

interface TopProduct {
  id: string
  name: string
  image_url?: string
  sales: number
  revenue: number
  stock: number
}

interface RecentOrder {
  id: string
  order_number: string
  customer_name: string
  total_kobo: number
  status: string
  created_at: string
  items_count: number
}

const DEMO_STATS: VendorStats = {
  revenue: {
    total: 1250000000, // ₦12.5M
    thisMonth: 320000000, // ₦3.2M
    lastMonth: 280000000, // ₦2.8M
    change: 14.3,
  },
  orders: {
    total: 1247,
    thisMonth: 89,
    pending: 12,
    confirmed: 15,
    processing: 23,
    shipped: 18,
    out_for_delivery: 8,
    completed: 1156,
    cancelled: 79,
  },
  products: {
    total: 156,
    active: 142,
    lowStock: 8,
    outOfStock: 6,
  },
  customers: {
    total: 892,
    newThisMonth: 34,
    returning: 456,
  },
  rating: {
    average: 4.7,
    totalReviews: 1234,
  },
}

const DEMO_REVENUE_DATA: RevenueDataPoint[] = [
  { date: '2024-01-01', revenue: 8500000, orders: 12 },
  { date: '2024-01-02', revenue: 12000000, orders: 18 },
  { date: '2024-01-03', revenue: 9200000, orders: 14 },
  { date: '2024-01-04', revenue: 15500000, orders: 22 },
  { date: '2024-01-05', revenue: 11800000, orders: 16 },
  { date: '2024-01-06', revenue: 18200000, orders: 25 },
  { date: '2024-01-07', revenue: 14500000, orders: 20 },
  { date: '2024-01-08', revenue: 16800000, orders: 23 },
  { date: '2024-01-09', revenue: 13200000, orders: 19 },
  { date: '2024-01-10', revenue: 19500000, orders: 27 },
  { date: '2024-01-11', revenue: 17200000, orders: 24 },
  { date: '2024-01-12', revenue: 21000000, orders: 29 },
  { date: '2024-01-13', revenue: 15800000, orders: 21 },
  { date: '2024-01-14', revenue: 22500000, orders: 31 },
  { date: '2024-01-15', revenue: 18900000, orders: 26 },
]

const DEMO_TOP_PRODUCTS: TopProduct[] = [
  { id: 'prod_1', name: 'Wireless Noise-Cancelling Headphones', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', sales: 234, revenue: 585000000, stock: 45 },
  { id: 'prod_2', name: 'Premium Leather Wallet', image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop', sales: 189, revenue: 160650000, stock: 12 },
  { id: 'prod_3', name: 'Organic Green Tea - 50 Pack', image_url: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&h=400&fit=crop', sales: 156, revenue: 179400000, stock: 8 },
  { id: 'prod_4', name: 'Stainless Steel Water Bottle', image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop', sales: 134, revenue: 107200000, stock: 67 },
  { id: 'prod_5', name: 'Bluetooth Mechanical Keyboard', image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop', sales: 98, revenue: 294000000, stock: 23 },
]

const DEMO_RECENT_ORDERS: RecentOrder[] = [
  { id: 'ord_1', order_number: 'KMB-2024-001234', customer_name: 'Adebayo Johnson', total_kobo: 4875000, status: 'out_for_delivery', created_at: '2024-01-16T14:22:00Z', items_count: 3 },
  { id: 'ord_2', order_number: 'KMB-2024-001233', customer_name: 'Fatima Hassan', total_kobo: 2150000, status: 'processing', created_at: '2024-01-16T11:45:00Z', items_count: 2 },
  { id: 'ord_3', order_number: 'KMB-2024-001232', customer_name: 'Chinedu Okafor', total_kobo: 890000, status: 'confirmed', created_at: '2024-01-16T09:30:00Z', items_count: 1 },
  { id: 'ord_4', order_number: 'KMB-2024-001231', customer_name: 'Amina Bello', total_kobo: 12500000, status: 'shipped', created_at: '2024-01-15T16:20:00Z', items_count: 5 },
  { id: 'ord_5', order_number: 'KMB-2024-001230', customer_name: 'Tunde Adebayo', total_kobo: 3400000, status: 'delivered', created_at: '2024-01-15T14:10:00Z', items_count: 2 },
]

const EMPTY_STATS: VendorStats = {
  revenue: { total: 0, thisMonth: 0, lastMonth: 0, change: 0 },
  orders: { total: 0, thisMonth: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, out_for_delivery: 0, completed: 0, cancelled: 0 },
  products: { total: 0, active: 0, lowStock: 0, outOfStock: 0 },
  customers: { total: 0, newThisMonth: 0, returning: 0 },
  rating: { average: 0, totalReviews: 0 },
}
const DASHBOARD_STATS = isMockMode ? DEMO_STATS : EMPTY_STATS
const DASHBOARD_REVENUE_DATA = isMockMode ? DEMO_REVENUE_DATA : []
const DASHBOARD_TOP_PRODUCTS = isMockMode ? DEMO_TOP_PRODUCTS : []
const DASHBOARD_RECENT_ORDERS = isMockMode ? DEMO_RECENT_ORDERS : []

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gold-soft text-warning border-gold/20',
  confirmed: 'bg-primary-soft text-primary-strong border-primary/20',
  processing: 'bg-secondary text-primary border-primary/20',
  shipped: 'bg-secondary text-primary border-primary/20',
  out_for_delivery: 'bg-warning-soft text-warning border-warning/20',
  delivered: 'bg-success-soft text-success border-success/20',
  ready_for_pickup: 'bg-gold-soft text-warning border-gold/20',
  collected: 'bg-success-soft text-success border-success/20',
  cancelled: 'bg-destructive-soft text-destructive border-destructive/20',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  processing: 'Preparing order',
  shipped: 'Out for delivery',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  ready_for_pickup: 'Ready for pickup',
  collected: 'Collected',
  awaiting_dispute_window: 'Awaiting dispute-window completion',
  payout_processing: 'Payout processing',
  payout_completed: 'Payout completed',
  cancelled: 'Cancelled',
}

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MockVendorDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'products' | 'orders'>('overview')
  const handleTabChange = (tab: 'overview' | 'analytics' | 'products' | 'orders') => {
    setActiveTab(tab)
  }
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-primary" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-destructive" />
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <div className="min-h-screen bg-background">
      {!isMockMode && <div className="mx-auto max-w-7xl px-4 pt-5"><div className="rounded-lg border border-gold/30 bg-gold-soft px-4 py-3 text-sm text-text-primary">Live vendor analytics are not connected to this website yet. Demo figures are hidden outside development prototype mode.</div></div>}
      {isMockMode && <div className="mx-auto max-w-7xl px-4 pt-5"><span className="inline-flex rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-text-primary">Development demo data</span></div>}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/vendor/dashboard" className="flex items-center gap-2">
                <Store className="w-8 h-8 text-coral" />
                <span className="font-display font-bold text-xl text-primary">Kamba Vendor</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1 bg-surface/5 rounded-lg p-1">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'products', label: 'Products', icon: Package },
                  { id: 'orders', label: 'Orders', icon: ShoppingBag },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                                  onClick={() => handleTabChange(id as 'overview' | 'analytics' | 'products' | 'orders')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === id
                        ? 'bg-coral text-ink shadow-lg'
                        : 'text-muted-foreground hover:text-primary hover:bg-surface/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-surface/5 rounded-lg px-3 py-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="bg-transparent border-none text-sm text-primary focus:outline-none cursor-pointer"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading || !isMockMode} className="gap-1">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="default" size="sm" className="gap-1" asChild>
                <Link href="/vendor/products/new">
                  <PlusCircle className="w-4 h-4" />
                  Add Product
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatKobo(DASHBOARD_STATS.revenue.thisMonth)}
            subtitle={`+${DASHBOARD_STATS.revenue.change}% vs last month`}
            icon={<DollarSign className="w-5 h-5" />}
            iconBg="bg-coral/10"
            iconColor="text-coral"
            trend={{ value: DASHBOARD_STATS.revenue.change, positive: true }}
          />
          <StatCard
            title="Orders This Month"
            value={DASHBOARD_STATS.orders.thisMonth.toLocaleString()}
            subtitle={`${DASHBOARD_STATS.orders.pending} pending • ${DASHBOARD_STATS.orders.completed} completed`}
            icon={<ShoppingBag className="w-5 h-5" />}
            iconBg="bg-primary-soft"
            iconColor="text-primary"
            trend={{ value: 12.5, positive: true }}
          />
          <StatCard
            title="Active Products"
            value={DASHBOARD_STATS.products.active.toLocaleString()}
            subtitle={`${DASHBOARD_STATS.products.lowStock} low stock • ${DASHBOARD_STATS.products.outOfStock} out of stock`}
            icon={<Package className="w-5 h-5" />}
            iconBg="bg-secondary"
            iconColor="text-primary"
            trend={{ value: -2.1, positive: false }}
          />
          <StatCard
            title="Customer Rating"
            value={DASHBOARD_STATS.rating.average.toFixed(1)}
            subtitle={`${DASHBOARD_STATS.rating.totalReviews.toLocaleString()} reviews • ${DASHBOARD_STATS.customers.newThisMonth} new customers`}
            icon={<Star className="w-5 h-5" />}
            iconBg="bg-gold/10"
            iconColor="text-gold"
            trend={{ value: 0.2, positive: true }}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Revenue Chart */}
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-coral" />
                  Revenue Overview
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RevenueChart data={DASHBOARD_REVENUE_DATA} />
              </CardContent>
            </Card>

            {/* Top Products & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card variant="elevated">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-coral" />
                    Top Selling Products
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/vendor/products">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <TopProductsTable products={DASHBOARD_TOP_PRODUCTS} />
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-coral" />
                    Recent Orders
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/vendor/orders">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <RecentOrdersTable orders={DASHBOARD_RECENT_ORDERS} />
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-coral" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <QuickActionCard
                    title="Add New Product"
                    description="List a new product for sale"
                    icon={<PlusCircle className="w-5 h-5" />}
                    iconBg="bg-coral/10"
                    iconColor="text-coral"
                    href="/vendor/products/new"
                  />
                  <QuickActionCard
                    title="Manage Orders"
                    description="Process and fulfill orders"
                    icon={<ShoppingBag className="w-5 h-5" />}
                    iconBg="bg-primary-soft"
                    iconColor="text-primary"
                    href="/vendor/orders"
                  />
                  <QuickActionCard
                    title="View Analytics"
                    description="Detailed sales reports"
                    icon={<LineChart className="w-5 h-5" />}
                    iconBg="bg-secondary"
                    iconColor="text-primary"
                    href="/vendor/analytics"
                  />
                  <QuickActionCard
                    title="Business Settings"
                    description="Manage your business, pickup and payout details"
                    icon={<Settings className="w-5 h-5" />}
                    iconBg="bg-gray-500/10"
                    iconColor="text-text-tertiary"
                    href="/vendor/profile"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-coral" />
                  Revenue Trend
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-1">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RevenueChart data={DASHBOARD_REVENUE_DATA} height={350} showOrders />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-coral" />
                    Order Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderStatusChart 
                    data={[
                      { status: 'Delivered', count: DASHBOARD_STATS.orders.completed, color: '#10B981' },
                      { status: 'Processing', count: DASHBOARD_STATS.orders.pending + DASHBOARD_STATS.orders.confirmed, color: '#8B5CF6' },
                      { status: 'Shipped', count: DASHBOARD_STATS.orders.shipped || 0, color: '#6366F1' },
                      { status: 'Cancelled', count: DASHBOARD_STATS.orders.cancelled, color: '#EF4444' },
                    ]} 
                  />
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-coral" />
                    Customer Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerGrowthChart />
                </CardContent>
              </Card>
            </div>

            <Card variant="elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-coral" />
                  Payment Methods Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodsChart />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'products' && (
          <VendorProductsTab />
        )}

        {activeTab === 'orders' && (
          <VendorOrdersTab />
        )}
      </main>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBg, 
  iconColor, 
  trend 
}: { 
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  trend?: { value: number; positive: boolean }
}) {
  return (
    <Card variant="elevated" className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-coral/10 to-transparent rounded-full blur-2xl" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-primary mt-1">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1">
            {trend.positive ? (
              <TrendingUp className="w-4 h-4 text-primary" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className={`text-sm font-medium ${trend.positive ? 'text-primary' : 'text-destructive'}`}>
              {trend.positive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-sm text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RevenueChart({ data, height = 250, showOrders = false }: { data: RevenueDataPoint[]; height?: number; showOrders?: boolean }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue))
  const maxOrders = Math.max(...data.map(d => d.orders))
  const width = 100 // percentage width

  return (
    <div className="relative h-[250px] w-full" style={{ height: `${height}px` }}>
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF6B47" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6B47" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ordersGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#24543B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#24543B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.1" />
        ))}
        {/* Revenue area */}
        <path
          d={`M 0 100 L ${data.map((d, i) => `${(i / (data.length - 1)) * 100} ${100 - (d.revenue / maxRevenue) * 90}`).join(' L ')} L 100 100 Z`}
          fill="url(#revenueGradient)"
        />
        {/* Revenue line */}
        <path
          d={`M ${data.map((d, i) => `${(i / (data.length - 1)) * 100} ${100 - (d.revenue / maxRevenue) * 90}`).join(' L ')}`}
          stroke="#FF6B47"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showOrders && (
          <>
            {/* Orders line */}
            <path
              d={`M ${data.map((d, i) => `${(i / (data.length - 1)) * 100} ${100 - (d.orders / maxOrders) * 90}`).join(' L ')}`}
              stroke="#24543B"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="5,5"
            />
          </>
        )}
        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={(i / (data.length - 1)) * 100}
            cy={100 - (d.revenue / maxRevenue) * 90}
            r="3"
            fill="#FF6B47"
            stroke="#0A0E1A"
            strokeWidth="2"
            className="hover:r-4 transition-all"
          />
        ))}
      </svg>

      {/* Tooltip labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2 pb-2">
        {data.filter((_, i) => i % 3 === 0).map((d, i) => (
          <span key={i} className="text-center w-[33%]">
            {new Date(d.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-coral" />
          <span className="text-sm text-primary">Revenue</span>
        </div>
        {showOrders && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-primary" style={{ borderTop: '2px dashed #24543B' }} />
            <span className="text-sm text-primary">Orders</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TopProductsTable({ products }: { products: TopProduct[] }) {
  return (
    <div className="space-y-3">
      {products.map((product, index) => (
        <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-surface/5 rounded-lg transition-colors">
          <span className="text-sm font-medium text-muted-foreground w-6 text-center">{index + 1}</span>
          <div className="w-12 h-12 rounded-lg bg-surface/5 overflow-hidden flex-shrink-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-muted-foreground/50 mx-auto my-auto" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary truncate">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.sales} sold • {product.stock} in stock</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-primary">{formatKobo(product.revenue)}</p>
            <p className="text-xs text-muted-foreground">Revenue</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center gap-3 p-3 hover:bg-surface/5 rounded-lg transition-colors">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-primary">{order.order_number}</p>
            <p className="text-sm text-muted-foreground">{order.customer_name} • {order.items_count} items</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-primary">{formatKobo(order.total_kobo)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
          </div>
                    <Badge variant="default" className={STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground'}>
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>
      ))}
    </div>
  )
}

function QuickActionCard({ title, description, icon, iconBg, iconColor, href }: { 
  title: string
  description: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  href: string
}) {
  return (
    <Link href={href} className="p-4 bg-surface/5 rounded-xl hover:bg-surface/10 transition-colors group">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBg} ${iconColor} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="mt-3">
        <p className="font-medium text-primary">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}

function OrderStatusChart({ data }: { data: { status: string; count: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  
  return (
    <div className="h-64 flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-64 h-64">
        {data.map((d, i) => {
          const startAngle = data.slice(0, i).reduce((sum, item) => sum + (item.count / total) * 360, 0)
          const endAngle = startAngle + (d.count / total) * 360
          const startRad = (startAngle - 90) * Math.PI / 180
          const endRad = (endAngle - 90) * Math.PI / 180
          const largeArc = (d.count / total) > 0.5 ? 1 : 0
          
          const x1 = 100 + 70 * Math.cos(startRad)
          const y1 = 100 + 70 * Math.sin(startRad)
          const x2 = 100 + 70 * Math.cos(endRad)
          const y2 = 100 + 70 * Math.sin(endRad)
          
          return (
            <path
              key={i}
              d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={d.color}
              stroke="#0A0E1A"
              strokeWidth="2"
            />
          )
        })}
        <circle cx="100" cy="100" r="50" fill="#0A0E1A" />
      </svg>
      <div className="absolute grid grid-cols-2 gap-2 text-center">
        {data.map((d) => (
          <div key={d.status} className="bg-background/80 backdrop-blur p-3 rounded-lg">
            <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: d.color }} />
            <p className="text-sm font-medium text-primary">{d.status}</p>
            <p className="text-2xl font-bold text-primary">{d.count}</p>
            <p className="text-xs text-muted-foreground">{((d.count / total) * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomerGrowthChart() {
  const data = [
    { month: 'Aug', new: 45, returning: 120 },
    { month: 'Sep', new: 52, returning: 135 },
    { month: 'Oct', new: 48, returning: 142 },
    { month: 'Nov', new: 61, returning: 158 },
    { month: 'Dec', new: 55, returning: 165 },
    { month: 'Jan', new: 67, returning: 178 },
  ]

  const maxVal = Math.max(...data.flatMap(d => [d.new, d.returning]))

  return (
    <div className="h-64 relative">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="newGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF6B47" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF6B47" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="returningGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#24543B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#24543B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.1" />
        ))}
        {/* New customers area */}
        <path
          d={`M 0 100 L ${data.map((d, i) => `${(i / (data.length - 1)) * 100} ${100 - (d.new / maxVal) * 90}`).join(' L ')} L 100 100 Z`}
          fill="url(#newGradient)"
        />
        {/* Returning customers area */}
        <path
          d={`M 0 100 L ${data.map((d, i) => `${(i / (data.length - 1)) * 100} ${100 - (d.returning / maxVal) * 90}`).join(' L ')} L 100 100 Z`}
          fill="url(#returningGradient)"
        />
        {/* New line */}
        <path
          d={`M ${data.map((d, i) => `${(i / (data.length - 1)) * 100} ${100 - (d.new / maxVal) * 90}`).join(' L ')}`}
          stroke="#FF6B47"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {/* Returning line */}
        <path
          d={`M ${data.map((d, i) => `${(i / (data.length - 1)) * 100} ${100 - (d.returning / maxVal) * 90}`).join(' L ')}`}
          stroke="#24543B"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="5,5"
        />
      </svg>

      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2 pb-2">
        {data.map((d, i) => (
          <span key={i} className="text-center flex-1">{d.month}</span>
        ))}
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-coral" />
          <span className="text-sm text-primary">New</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-1 bg-primary" style={{ borderTop: '2px dashed #24543B' }} />
          <span className="text-sm text-primary">Returning</span>
        </div>
      </div>
    </div>
  )
}

function PaymentMethodsChart() {
  const data = [
    { method: 'Card', count: 542, percentage: 48.5, color: '#FF6B47' },
    { method: 'Bank Transfer', count: 312, percentage: 27.9, color: '#24543B' },
    { method: 'USSD', count: 189, percentage: 16.9, color: '#10B981' },
    { method: 'Wallet', count: 75, percentage: 6.7, color: '#FFD23F' },
  ]

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.method} className="flex items-center gap-4">
          <div className="w-32 text-sm text-muted-foreground">{item.method}</div>
          <div className="flex-1 h-3 bg-surface/5 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            />
          </div>
          <div className="w-20 text-right text-sm font-medium text-primary">{item.percentage}%</div>
          <div className="w-16 text-right text-sm text-muted-foreground">{item.count} orders</div>
        </div>
      ))}
    </div>
  )
}

function VendorProductsTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'low_stock' | 'out_of_stock'>('all')
  const [page, setPage] = useState(1)

  const filteredProducts = DASHBOARD_TOP_PRODUCTS.filter(p => {
    if (statusFilter === 'active') return p.stock > 10
    if (statusFilter === 'low_stock') return p.stock > 0 && p.stock <= 10
    if (statusFilter === 'out_of_stock') return p.stock === 0
    return true
  }).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-surface/5 border-border text-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
        <Button variant="default" className="gap-1" asChild>
          <Link href="/vendor/products/new">
            <PlusCircle className="w-4 h-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Products Table */}
      <Card variant="elevated">
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Stock</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Sales</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border hover:bg-surface/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-surface/5 overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground/50 mx-auto my-auto" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-primary">{product.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: KMB-{product.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge 
                        variant={product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'destructive'}
                        size="sm"
                      >
                        {product.stock > 10 ? 'Active' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className={`font-mono ${product.stock <= 10 ? 'text-destructive' : product.stock <= 20 ? 'text-warning' : 'text-primary'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-primary">{product.sales}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-primary">{formatKobo(product.revenue)}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive-soft">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {DASHBOARD_TOP_PRODUCTS.length} products
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= 5}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function VendorOrdersTab() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOrders = DASHBOARD_RECENT_ORDERS.filter(o => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (searchQuery && !o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-surface/5 border-border text-primary px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Button variant="outline" className="gap-1">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Orders Table */}
      <Card variant="elevated">
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Order</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Items</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-surface/5">
                    <td className="p-4">
                      <p className="font-mono font-medium text-primary">{order.order_number}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-primary">{order.customer_name}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-muted-foreground">{order.items_count} items</span>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-primary">{formatKobo(order.total_kobo)}</p>
                    </td>
                    <td className="p-4">
                                          <Badge variant="default" className={STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground'}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {DASHBOARD_RECENT_ORDERS.length} orders
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VendorDashboardPage() {
  if (!isMockMode) return <LiveVendorDashboard />
  return <MockVendorDashboardPage />
}
