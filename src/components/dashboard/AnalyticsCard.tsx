import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BarChart3,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface AnalyticsCardProps {
  title: string;
  value: number;
  type: 'currency' | 'percentage' | 'number';
  change: number;
  timeRange?: string;
  onTimeRangeChange?: (value: string) => void;
  linkHref?: string;
}

export function AnalyticsCard({ title, value, type, change, timeRange = '7d', onTimeRangeChange, linkHref }: AnalyticsCardProps) {
  // Determine if change is positive, negative, or neutral
  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral = change === 0
  
  // Format the value based on type
  const formattedValue = (() => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value)
      case 'percentage':
        return `${value}%`
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(value)
    }
  })()
  
  // Format the change value
  const formattedChange = (() => {
    const absChange = Math.abs(change)
    let result = ''
    
    if (type === 'percentage') {
      result = `${absChange}%`
    } else if (type === 'currency') {
      result = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(absChange)
    } else {
      result = new Intl.NumberFormat('en-US').format(absChange)
    }
    
    return isPositive ? `+${result}` : isNegative ? `-${result}` : result
  })()
  
  // Get the appropriate icon based on the title
  const getIcon = () => {
    switch (title.toLowerCase()) {
      case 'revenue':
      case 'sales':
      case 'earnings':
        return <DollarSign className="h-5 w-5" />
      case 'orders':
        return <ShoppingBag className="h-5 w-5" />
      case 'customers':
      case 'users':
        return <Users className="h-5 w-5" />
      default:
        return <BarChart3 className="h-5 w-5" />
    }
  }
  
  // Get the time range text
  const getTimeRangeText = () => {
    switch (timeRange) {
      case '24h': return 'Last 24 hours'
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case 'ytd': return 'Year to date'
      default: return 'Last 7 days'
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            {getIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        <div className="flex items-center mt-1">
          <div className={`flex items-center text-sm ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : isNegative ? (
              <TrendingDown className="h-4 w-4 mr-1" />
            ) : null}
            <span>{formattedChange}</span>
          </div>
          <span className="text-xs text-muted-foreground ml-1.5">
            vs. previous period
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-1 pb-2 px-6">
        <div className="flex items-center justify-between w-full">
          {onTimeRangeChange ? (
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="h-7 text-xs w-auto px-2 border-none">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder={getTimeRangeText()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {getTimeRangeText()}
            </span>
          )}
          
          {linkHref && (
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
              <a href={linkHref} className="flex items-center">
                Details
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
