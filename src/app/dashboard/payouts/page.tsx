 "use client"; // This is a client-side component

import { useState, useEffect, FormEvent } from 'react'
// import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Download, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface Payout {
  id: string;
  amount: number;
  status: string;
  method: string;
  created_at: string;
  processed_at: string | null;
}

export default function PayoutsPage() {
  const [balance, setBalance] = useState<number>(0)
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [payoutAmount, setPayoutAmount] = useState<string>('')
  const [payoutMethod, setPayoutMethod] = useState<string>('bank_transfer')
  const [notes, setNotes] = useState<string>('')
  
  useEffect(() => {
    fetchPayoutData()
  }, [])
  
  async function fetchPayoutData(): Promise<void> {
    try {
      setLoading(true)
      
      // In a real app, these would be actual Supabase queries
      // Simulating data for demonstration
      
      // Available balance
      setBalance(4325.75)
      
      // Payout history
      setPayouts([
        {
          id: 'pyt_123456',
          amount: 1200.00,
          status: 'completed',
          method: 'bank_transfer',
          created_at: '2025-03-15T14:30:00Z',
          processed_at: '2025-03-17T10:15:00Z',
        },
        {
          id: 'pyt_123457',
          amount: 850.50,
          status: 'completed',
          method: 'paypal',
          created_at: '2025-02-28T09:45:00Z',
          processed_at: '2025-03-02T11:20:00Z',
        },
        {
          id: 'pyt_123458',
          amount: 2000.00,
          status: 'pending',
          method: 'bank_transfer',
          created_at: '2025-03-25T16:10:00Z',
          processed_at: null,
        }
      ])
    } catch (error) {
      console.error('Error fetching payout data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function requestPayout(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()
    
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    
    if (parseFloat(payoutAmount) > balance) {
      alert('Payout amount cannot exceed available balance')
      return
    }
    
    try {
      // In a real app, this would be a Supabase insert
      const newPayout: Payout = {
        id: `pyt_${Math.floor(Math.random() * 1000000)}`,
        amount: parseFloat(payoutAmount),
        status: 'pending',
        method: payoutMethod,
        created_at: new Date().toISOString(),
        processed_at: null,
      }
      
      setPayouts([newPayout, ...payouts])
      setBalance(prev => prev - parseFloat(payoutAmount))
      
      // Reset form
      setPayoutAmount('')
      setPayoutMethod('bank_transfer')
      setNotes('')
      
      alert('Payout request submitted successfully')
    } catch (error) {
      console.error('Error requesting payout:', error)
      alert('Failed to submit payout request')
    }
  }

  function formatMethodName(method: string): string {
    return method.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  
  type PayoutStatus = 'completed' | 'pending' | 'failed' | string;
  
  function getStatusBadge(status: PayoutStatus): React.ReactElement {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>
    }
  }
  
  if (loading) {
    return <div className="flex justify-center items-center h-64 bg-white">Loading payout data...</div>
  }
  
  return (
    <div className="space-y-6 bg-white">
      <h1 className="text-2xl font-bold">Payouts</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader className="bg-white">
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="text-3xl font-bold">${balance.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Available for withdrawal
            </p>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full mt-4">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white">
                <DialogHeader className="bg-white">
                  <DialogTitle>Request Payout</DialogTitle>
                  <DialogDescription>
                    Enter the amount you want to withdraw and select your preferred method.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={requestPayout} className="space-y-4 py-4 bg-white">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5">$</span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        max={balance}
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="pl-7 bg-white"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum: ${balance.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="method">Payout Method</Label>
                    <Select 
                      value={payoutMethod} 
                      onValueChange={setPayoutMethod}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information..."
                      rows={3}
                      className="bg-white"
                    />
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Payouts are typically processed within 3-5 business days.
                    </p>
                  </div>
                  
                  <Button type="submit" className="w-full border">
                    Submit Payout Request
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="bg-white">
            <CardTitle>Payout Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 bg-white">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Payout Schedule</h4>
              <p className="text-sm text-muted-foreground">
                Payouts are processed every Monday and Thursday. Requests made before 2 PM will be included in the next batch.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Minimum Payout</h4>
              <p className="text-sm text-muted-foreground">
                The minimum payout amount is $50.00.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Processing Time</h4>
              <p className="text-sm text-muted-foreground">
                Bank transfers: 3-5 business days<br />
                PayPal: 1-2 business days<br />
                Stripe: 2-3 business days
              </p>
            </div>
            
            <Button variant="outline" className="w-full bg-white" asChild>
              <a href="/dashboard/settings">
                Manage Payout Methods
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Payout History</h2>
          <Button variant="outline" size="sm" className="bg-white">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        
        {payouts.length === 0 ? (
          <div className="text-center py-10 border rounded-md bg-white">
            <p className="text-gray-500">No payout history available</p>
          </div>
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader className="bg-white">
                <TableRow>
                  <TableHead>Reference ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Processed Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {payouts.map((payout) => (
                  <TableRow key={payout.id} className="bg-white">
                    <TableCell className="font-mono text-sm">{payout.id}</TableCell>
                    <TableCell className="font-medium">${payout.amount.toFixed(2)}</TableCell>
                    <TableCell>{formatMethodName(payout.method)}</TableCell>
                    <TableCell>{formatDate(payout.created_at)}</TableCell>
                    <TableCell>{payout.processed_at ? formatDate(payout.processed_at) : '-'}</TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
