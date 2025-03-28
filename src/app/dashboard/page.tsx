'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { ArrowUpRight, Package, ShoppingCart, AlertTriangle, CreditCard } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0,
    pendingPayouts: 0
  })
  interface Sale {
    date: string;
    sales: number;
  }
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // In a real app, these would be actual Supabase queries
      // Simulating data for demonstration

      // Dashboard stats
      setStats({
        totalRevenue: 24780,
        totalOrders: 573,
        totalProducts: 128,
        lowStockItems: 12,
        pendingPayouts: 3
      })

      // Recent sales data
      setRecentSales([
        { date: '2025-03-20', sales: 1200 },
        { date: '2025-03-21', sales: 1800 },
        { date: '2025-03-22', sales: 1400 },
        { date: '2025-03-23', sales: 2200 },
        { date: '2025-03-24', sales: 1900 },
        { date: '2025-03-25', sales: 2400 },
        { date: '2025-03-26', sales: 2100 },
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard data...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+20.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <div className="text-xs text-muted-foreground">
              <span className="text-amber-500">{stats.lowStockItems} items</span> low in stock
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
            <div className="text-xs text-muted-foreground">
              Requires your attention
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={recentSales}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`$${value}`, 'Sales']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#8884d8"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <a href="/dashboard/products" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-center">
                  <Package className="h-8 w-8 mb-2 text-blue-500" />
                  <span className="font-medium">Add New Product</span>
                </a>
                <a href="/dashboard/orders" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-center">
                  <ShoppingCart className="h-8 w-8 mb-2 text-green-500" />
                  <span className="font-medium">View Orders</span>
                </a>
                <a href="/dashboard/stock-alerts" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="h-8 w-8 mb-2 text-amber-500" />
                  <span className="font-medium">Stock Alerts</span>
                </a>
                <a href="/dashboard/payouts" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-center">
                  <CreditCard className="h-8 w-8 mb-2 text-purple-500" />
                  <span className="font-medium">Request Payout</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
