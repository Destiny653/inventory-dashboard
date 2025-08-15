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
import { DollarSign, ShoppingCart, TrendingUp, Loader2, AlertCircle, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// Type definitions
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

// Color scheme for a sleek, modern look
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6'];

// A central place for all colors to ensure consistency
const THEME_COLORS = {
  cardBg:'#6366f1',
  primary: '#6366f1',
  primaryMuted: '#eef2ff',
  primaryHover: '#4f46e5',
  secondary: '#a855f7',
  secondaryMuted: '#f3e8ff',
  success: '#10b981',
  successMuted: '#d1fae5',
  warning: '#f59e0b',
  warningMuted: '#fffbeb',
  danger: '#ef4444',
  dangerMuted: '#fee2e2',
  text: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
};

// A beautiful, custom tooltip component for the charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return (
      <div className="rounded-lg border bg-white p-2 text-sm shadow-md">
        <p className="font-semibold">{label}</p>
        <p className="text-gray-500">{`Sales: ${value}`}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [topProducts, setTopProducts] = useState<ProductData[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    growthRate: 0,
    topCategoryName: 'N/A'
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
        previousMonthData
      ] = await Promise.all([
        supabase.from('orders').select('*, order_items(price, quantity, products(name, categories(id, name)))'),
        supabase.from('categories').select('*'),
        supabase
          .from('orders')
          .select('total_amount')
          .lt('created_at', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
          .gte('created_at', new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString())
      ])

      const ordersError = ordersResponse.error
      const categoriesError = categoriesResponse.error
      const previousMonthError = previousMonthData.error

      if (ordersError || categoriesError || previousMonthError) {
        throw ordersError || categoriesError || previousMonthError
      }

      const orders = ordersResponse.data || []
      const categories = categoriesResponse.data || []
      const previousMonthOrders = previousMonthData.data || []

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

      const topCategory = categoryDistribution.length > 0 ? categoryDistribution[0] : { name: 'N/A', value: 0 };

      setStats({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        growthRate: parseFloat(growthRate.toFixed(1)),
        topCategoryName: topCategory.name,
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError('Failed to load analytics data. Please try again.')
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

    const currentMonth = new Date().getMonth();
    return months.map((month, index) => ({
      month,
      sales: salesByMonth[month]
    })).filter((_, index) => index <= currentMonth)
  }

  function generateCategoryDistribution(orders: any[], categories: any[]): CategoryData[] {
    const categorySales = new Map<string, number>();

    categories.forEach(category => {
      categorySales.set(category.id, 0);
    });
  
    for (const order of orders) {
      if (!order.order_items || !Array.isArray(order.order_items)) continue;
  
      for (const item of order.order_items) {
        if (item.products?.categories?.id) {
          const categoryId = item.products.categories.id;
          const saleAmount = (item.price || 0) * (item.quantity || 0);
  
          if (categorySales.has(categoryId)) {
            categorySales.set(categoryId, categorySales.get(categoryId)! + saleAmount);
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
      .sort((a, b) => b.value - a.value);
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
    if (windowWidth < 768) return null;
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  const getProductName = (name: string): string => {
    if (windowWidth < 640) {
      return name.length > 10 ? `${name.substring(0, 8)}...` : name;
    }
    return name;
  };

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
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sales Analytics</h1>
            <p className="text-gray-500">A detailed look into your business performance</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              <DollarSign className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 flex items-center mt-2">
                {stats.growthRate >= 0 ? (
                  <>
                    <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                    <span className="text-green-500 font-medium">+{stats.growthRate}%</span> from last month
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-1 h-4 w-4 text-red-500 transform rotate-180" />
                    <span className="text-red-500 font-medium">{stats.growthRate}%</span> from last month
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
              <ShoppingCart className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
              <p className="text-xs text-gray-500 mt-2">
                Avg. order: ${stats.avgOrderValue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Top Category</CardTitle>
              <Package className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-gray-900">
                {stats.topCategoryName}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  ${categoryData.length > 0 ? categoryData[0].value.toLocaleString() : 0} in sales
                </Badge>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-full rounded-xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Monthly Sales Trends</CardTitle>
                <p className="text-sm text-gray-500">Revenue performance over the year</p>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME_COLORS.border} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: THEME_COLORS.textMuted, fontSize: 12 }}
                        axisLine={{ stroke: THEME_COLORS.border }}
                      />
                      <YAxis
                        tick={{ fill: THEME_COLORS.textMuted, fontSize: 12 }}
                        axisLine={{ stroke: THEME_COLORS.border }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke={THEME_COLORS.primary}
                        strokeWidth={2}
                        dot={{ fill: THEME_COLORS.primary, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="h-full rounded-xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Sales by Category</CardTitle>
                <p className="text-sm text-gray-500">Distribution of sales across categories</p>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={renderPieLabel}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: THEME_COLORS.cardBg,
                          borderColor: THEME_COLORS.border,
                          borderRadius: '0.5rem',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number, name: string, props) => [`$${value.toLocaleString()}`, props.payload.name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ marginTop: '20px' }}
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
        </div>

        {/* Top Selling Products Bar Chart */}
        <Card className="rounded-xl transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Top Selling Products</CardTitle>
            <p className="text-sm text-gray-500">Top 10 products by sales volume</p>
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
                  <CartesianGrid strokeDasharray="3 3" stroke={THEME_COLORS.border} />
                  <XAxis
                    type="number"
                    tick={{ fill: THEME_COLORS.textMuted, fontSize: 12 }}
                    axisLine={{ stroke: THEME_COLORS.border }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: THEME_COLORS.textMuted, fontSize: 12 }}
                    axisLine={{ stroke: THEME_COLORS.border }}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="sales"
                    fill={THEME_COLORS.primary}
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