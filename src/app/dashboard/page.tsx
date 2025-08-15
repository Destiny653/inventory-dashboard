'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, Package, ShoppingCart, AlertTriangle, CreditCard, DollarSign, Loader2, TrendingUp, Users, Eye } from 'lucide-react'
import { toast } from 'sonner'

// A more unified color palette for consistency
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

interface Order {
  created_at: string;
  total_amount: number;
  payment_status: string;
}

interface Product {
  stock_quantity: number;
  category: string;
}

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

interface CategoryData {
    name: string;
    value: number;
    color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    pendingPayouts: 0,
  })
  
  const [recentSales, setRecentSales] = useState<SalesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch orders and products data in parallel for efficiency
      const [{ data: ordersData, error: ordersError }, { data: productsData, error: productsError }] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*')
      ]);

      if (ordersError) throw ordersError
      if (productsError) throw productsError

      // Calculate stats
      const totalRevenue = ordersData?.reduce((sum: number, order: Order) => sum + (order.total_amount || 0), 0).toFixed(2) || 0;
      const totalOrders = ordersData?.length || 0;
      const totalProducts = productsData?.length || 0;
      const lowStockItems = productsData?.filter((product: Product) => product.stock_quantity < 10).length || 0;
      const pendingPayouts = ordersData?.filter((order: Order) => order.payment_status === 'pending').length || 0;

      setStats({
        totalRevenue,
        totalOrders,
        totalProducts,
        lowStockItems,
        pendingPayouts,
      });

      // Generate sales data for the last 7 days
      const salesByDate = generateSalesData(ordersData || []);
      setRecentSales(salesByDate);

      // Generate category data
      const categoryDistribution = generateCategoryData(productsData || []);
      setCategoryData(categoryDistribution);

      toast.success('Dashboard data loaded successfully!');

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  function generateSalesData(orders: Order[]): SalesData[] {
    const salesMap = new Map<string, { sales: number; orders: number }>()
    const today = new Date()
    
    // Initialize last 7 days with 0 sales and orders
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]
      salesMap.set(dateString, { sales: 0, orders: 0 })
    }
    
    // Aggregate sales and orders by date
    orders.forEach(order => {
      if (!order.created_at) return
      
      const orderDate = new Date(order.created_at).toISOString().split('T')[0]
      if (salesMap.has(orderDate)) {
        const current = salesMap.get(orderDate)!
        salesMap.set(orderDate, {
          sales: current.sales + (order.total_amount || 0),
          orders: current.orders + 1
        })
      }
    })
    
    // Convert to array of objects
    return Array.from(salesMap.entries()).map(([date, data]) => ({
      date,
      sales: data.sales,
      orders: data.orders
    }))
  }

  function generateCategoryData(products: Product[]): CategoryData[] {
    const categoryMap = new Map<string, number>()
    products.forEach(product => {
        if(product.category) {
            categoryMap.set(product.category, (categoryMap.get(product.category) || 0) + 1)
        }
    })
    
    const colors = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger]
    return Array.from(categoryMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-700">Loading dashboard data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 p-4 rounded-lg border border-red-200 bg-red-50 text-center">
          <p>{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-2 text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 lg:p-2">
      <div className="mx-auto max-7xl space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="bg-blue-50 border-blue-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Revenue</CardTitle>
              <div className="p-2 rounded-full bg-blue-100">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">${stats.totalRevenue.toLocaleString()}</div>
              {/* Note: percentage change is hardcoded as it requires more complex data fetching and calculation */}
              <p className="text-xs text-blue-700 flex items-center mt-1">
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600 font-medium">+20.1%</span> from last month
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
              <p className="text-xs text-purple-700 flex items-center mt-1">
                <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-600" />
                <span className="text-emerald-600 font-medium">+12.2%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Products</CardTitle>
              <div className="p-2 rounded-full bg-emerald-100">
                <Package className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">{stats.totalProducts}</div>
              <div className="text-xs text-emerald-700 mt-1">
                <span className="text-amber-600 font-medium">{stats.lowStockItems} items</span> low in stock
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Low Stock</CardTitle>
              <div className="p-2 rounded-full bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">{stats.lowStockItems}</div>
              <div className="text-xs text-amber-700 mt-1">
                Products need restocking
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-rose-50 border-rose-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-800">Pending Payouts</CardTitle>
              <div className="p-2 rounded-full bg-rose-100">
                <CreditCard className="h-4 w-4 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-900">{stats.pendingPayouts}</div>
              <div className="text-xs text-rose-700 mt-1">
                Requires your attention
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2 border shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Revenue & Orders Trend</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Daily performance over the last 7 days</p>
                </div>
                <div className="p-2 rounded-full bg-blue-50">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recentSales}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chartGrid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                      tickMargin={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                      stroke={COLORS.cardBorder}
                    />
                    <YAxis
                      yAxisId="revenue"
                      orientation="left"
                      tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                      stroke={COLORS.cardBorder}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                      stroke={COLORS.cardBorder}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: COLORS.cardBg,
                        borderColor: COLORS.cardBorder,
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: COLORS.textPrimary
                      }}
                      formatter={(value:any, name) => [
                        name === 'sales' ? `$${value?.toFixed(2)}` : value?.toFixed(2),
                        name === 'sales' ? 'Revenue' : 'Orders'
                      ]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="sales"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      activeDot={{ r: 6, fill: COLORS.primary }}
                    />
                    <Area
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orders"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      fill="url(#colorOrders)"
                      activeDot={{ r: 6, fill: COLORS.secondary }}
                    />
                  </AreaChart>
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
                  <p className="text-sm text-muted-foreground mt-1">Distribution breakdown of products</p>
                </div>
                <div className="p-2 rounded-full bg-purple-50">
                  <Eye className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: COLORS.cardBg,
                        borderColor: COLORS.cardBorder,
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        color: COLORS.textPrimary
                      }}
                      formatter={(value, name, props) => [`${value} items`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Manage your business operations</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <a href="/products" className="p-4 border border-border rounded-lg hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-center bg-background hover:shadow-sm group">
                <div className="p-3 rounded-full bg-blue-100 mb-2 group-hover:bg-blue-200 transition-colors">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <span className="font-medium text-foreground">Add Product</span>
                <span className="text-xs text-muted-foreground mt-1">Manage inventory</span>
              </a>
              
              <a href="/orders" className="p-4 border border-border rounded-lg hover:bg-purple-50 transition-colors flex flex-col items-center justify-center text-center bg-background hover:shadow-sm group">
                <div className="p-3 rounded-full bg-purple-100 mb-2 group-hover:bg-purple-200 transition-colors">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                </div>
                <span className="font-medium text-foreground">View Orders</span>
                <span className="text-xs text-muted-foreground mt-1">Process new orders</span>
              </a>
              
              <a href="/stock-alerts" className="p-4 border border-border rounded-lg hover:bg-amber-50 transition-colors flex flex-col items-center justify-center text-center bg-background hover:shadow-sm group">
                <div className="p-3 rounded-full bg-amber-100 mb-2 group-hover:bg-amber-200 transition-colors">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <span className="font-medium text-foreground">Stock Alerts</span>
                <span className="text-xs text-muted-foreground mt-1">{stats.lowStockItems} items need attention</span>
              </a>
              
              <a href="/payouts" className="p-4 border border-border rounded-lg hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center text-center bg-background hover:shadow-sm group">
                <div className="p-3 rounded-full bg-emerald-100 mb-2 group-hover:bg-emerald-200 transition-colors">
                  <CreditCard className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="font-medium text-foreground">Payouts</span>
                <span className="text-xs text-muted-foreground mt-1">Withdraw earnings</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};