'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { DollarSign, ShoppingCart, TrendingUp, Loader2, AlertCircle, Package, ArrowUpRight, Users, CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Unified color palette for consistency
const COLORS = {
  primary: '#3B82F6', // Blue
  secondary: '#8B5CF6', // Purple
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  background: '#F9FAFB',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E7EB',
  chartGrid: '#E5E7EB'
}

// Chart colors array
const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger, '#6366f1', '#8b5cf6']

interface SalesData {
  month: string;
  sales: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface ProductData {
  name: string;
  sales: number;
}

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-4 text-sm shadow-md">
        <p className="font-semibold text-gray-900">{label}</p>
        <div className="mt-1 space-y-1">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="mr-2 h-3 w-3 rounded-full" 
                  style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-gray-600">{item.name}</span>
              </div>
              <span className="font-medium text-gray-900">
                {typeof item.value === 'number' 
                  ? item.name === 'sales' || item.name === 'Revenue'
                    ? `$${item.value.toLocaleString()}`
                    : item.value.toLocaleString()
                  : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [topProducts, setTopProducts] = useState<ProductData[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    growthRate: 0,
    topCategoryName: 'N/A',
    activeCustomers: 0,
    refunds: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    fetchAnalyticsData()

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function fetchAnalyticsData() {
    setLoading(true)
    setError(null)

    try {
      // Fetch all necessary data in parallel
      const [
        ordersResponse,
        categoriesResponse,
        previousMonthData,
        customersResponse,
        refundsResponse
      ] = await Promise.all([
        supabase.from('orders').select('*, order_items(price, quantity, products(name, categories(id, name)))'),
        supabase.from('categories').select('*'),
        supabase
          .from('orders')
          .select('total_amount')
          .lt('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString()),
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('status', 'active'),
        supabase
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('status', 'refunded')
      ])

      const errors = [
        ordersResponse.error,
        categoriesResponse.error,
        previousMonthData.error,
        customersResponse.error,
        refundsResponse.error
      ].filter(Boolean)

      if (errors.length > 0) {
        throw errors[0]
      }

      const orders = ordersResponse.data || []
      const categories = categoriesResponse.data || []
      const previousMonthOrders = previousMonthData.data || []
      const activeCustomers = customersResponse.count || 0
      const refunds = refundsResponse.count || 0

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const totalOrders = orders.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Calculate growth rate compared to previous month
      const prevMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const growthRate = prevMonthRevenue > 0
        ? ((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : (totalRevenue > 0 ? 100 : 0)

      // Generate monthly sales data
      const monthlySales = generateMonthlySales(orders)
      setSalesData(monthlySales)

      // Generate category distribution
      const categoryDistribution = generateCategoryDistribution(orders, categories)
      setCategoryData(categoryDistribution)

      // Generate top products
      const topSellingProducts = generateTopProducts(orders)
      setTopProducts(topSellingProducts)

      const topCategory = categoryDistribution.length > 0 ? categoryDistribution[0] : { name: 'N/A', value: 0 }

      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        growthRate: parseFloat(growthRate.toFixed(1)),
        topCategoryName: topCategory.name,
        activeCustomers,
        refunds
      })

      toast.success('Analytics data loaded successfully!')

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError('Failed to load analytics data. Please try again.')
      toast.error('Failed to load analytics data.')
    } finally {
      setLoading(false)
    }
  }

  function generateMonthlySales(orders: any[]): SalesData[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const salesByMonth: Record<string, number> = {}

    months.forEach(month => {
      salesByMonth[month] = 0
    })

    orders.forEach(order => {
      if (!order.created_at) return
      const month = new Date(order.created_at).toLocaleString('en-US', { month: 'short' })
      salesByMonth[month] = (salesByMonth[month] || 0) + (order.total_amount || 0)
    })

    const currentMonth = new Date().getMonth()
    return months.map((month, index) => ({
      month,
      sales: salesByMonth[month]
    })).filter((_, index) => index <= currentMonth)
  }

  function generateCategoryDistribution(orders: any[], categories: any[]): CategoryData[] {
    const categorySales = new Map<string, number>()

    categories.forEach(category => {
      categorySales.set(category.id, 0)
    })
  
    for (const order of orders) {
      if (!order.order_items || !Array.isArray(order.order_items)) continue
  
      for (const item of order.order_items) {
        if (item.products?.categories?.id) {
          const categoryId = item.products.categories.id
          const saleAmount = (item.price || 0) * (item.quantity || 0)
  
          if (categorySales.has(categoryId)) {
            categorySales.set(categoryId, categorySales.get(categoryId)! + saleAmount)
          }
        }
      }
    }
  
    return Array.from(categorySales.entries())
      .map(([id, value]) => ({
        name: categories.find(c => c.id === id)?.name || `Unknown Category`,
        value
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  function generateTopProducts(orders: any[]): ProductData[] {
    const productSales: Record<string, { name: string; sales: number }> = {}

    orders.forEach(order => {
      if (!order.order_items) return
      order.order_items.forEach((item: any) => {
        const productName = item.products?.name || `Product ${item.id}`
        const saleAmount = (item.price || 0) * (item.quantity || 0)

        if (productSales[productName]) {
          productSales[productName].sales += saleAmount
        } else {
          productSales[productName] = {
            name: productName,
            sales: saleAmount
          }
        }
      })
    })

    return Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
  }

  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    if (windowWidth < 768) return null
    return `${name} (${(percent * 100).toFixed(0)}%)`
  }

  const getProductName = (name: string): string => {
    if (windowWidth < 640) {
      return name.length > 10 ? `${name.substring(0, 8)}...` : name
    }
    return name
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <span className="mt-4 text-gray-700">Loading analytics data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-red-500 p-6 rounded-xl border border-red-200 bg-red-50 flex flex-col items-center shadow-lg">
          <AlertCircle className="h-10 w-10 mb-4 text-red-600" />
          <p className="text-lg font-medium text-center">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sales Analytics</h1>
            <p className="text-muted-foreground">A detailed look into your business performance</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-blue-50 border-blue-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Revenue</CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-blue-700 flex items-center mt-1">
                {stats.growthRate >= 0 ? (
                  <>
                    <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">+{stats.growthRate}%</span> from last month
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="mr-1 h-3 w-3 text-red-500 transform rotate-180" />
                    <span className="text-red-500 font-medium">{stats.growthRate}%</span> from last month
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Orders</CardTitle>
              <div className="p-2 rounded-full bg-purple-100">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.totalOrders}</div>
              <p className="text-xs text-purple-700 mt-1">
                Avg. order: ${stats.avgOrderValue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Active Customers</CardTitle>
              <div className="p-2 rounded-full bg-emerald-100">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                {stats.activeCustomers}
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  {Math.round((stats.activeCustomers / stats.totalOrders) * 100)}% repeat rate
                </Badge>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-rose-50 border-rose-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-800">Refunds</CardTitle>
              <div className="p-2 rounded-full bg-rose-100">
                <CreditCard className="h-4 w-4 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">{stats.refunds}</div>
              <p className="text-xs text-rose-700 mt-1">
                {stats.totalOrders > 0 ? 
                  `${((stats.refunds / stats.totalOrders) * 100).toFixed(1)}% of orders` : 
                  'No orders yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Monthly Revenue Trend</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Performance over the current year</p>
                </div>
                <div className="p-2 rounded-full bg-blue-50">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                      tickMargin={10}
                      stroke={COLORS.cardBorder}
                    />
                    <YAxis
                      tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                      stroke={COLORS.cardBorder}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary, r: 4 }}
                      activeDot={{ r: 6, fill: COLORS.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Sales Distribution */}
          <Card className="border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Sales by Category</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Revenue distribution across categories</p>
                </div>
                <div className="p-2 rounded-full bg-purple-50">
                  <Package className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={<CustomTooltip />}
                      formatter={(value: number, name: string, props) => [
                        `$${value.toLocaleString()}`,
                        props.payload.name
                      ]}
                    />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      wrapperStyle={{ paddingLeft: '20px' }}
                      formatter={(value, entry) => (
                        <span className="text-sm text-gray-600">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Products Bar Chart */}
        <Card className="border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Top Selling Products</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Top 10 products by revenue</p>
              </div>
              <div className="p-2 rounded-full bg-emerald-50">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 30,
                    left: 20,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                    axisLine={{ stroke: COLORS.cardBorder }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                    axisLine={{ stroke: COLORS.cardBorder }}
                    width={100}
                    tickFormatter={getProductName}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar
                    dataKey="sales"
                    fill={COLORS.primary}
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}