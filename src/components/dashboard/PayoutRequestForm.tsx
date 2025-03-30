 'use client'

import { useState } from 'react'
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Building,
  InfoIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent 
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PayoutMethod {
  id: string;
  type: 'bank_account' | 'card';
  bank_name?: string;
  card_type?: string;
  last4: string;
  default?: boolean;
}

interface PayoutRequestFormProps {
  availableBalance?: number;
  payoutMethods?: PayoutMethod[];
  onSubmit?: (data: { amount: number; payoutMethod: string; note: string; date: string }) => void;
  processingFee?: number;
  flatFee?: number;
}

export function PayoutRequestForm({ 
  availableBalance = 0, 
  payoutMethods = [], 
  onSubmit,
  processingFee = 2.9,
  flatFee = 0.3
}: PayoutRequestFormProps) {
  const defaultMethod = payoutMethods.find(method => method.default) || payoutMethods[0];
  
  const [amount, setAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState(defaultMethod?.id || '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false)
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }
  
  const calculateFee = (amount: number): number => {
    return (amount * (processingFee / 100)) + flatFee;
  }
  
  const calculateNetAmount = (amount: number): number => {
    return amount - calculateFee(amount);
  }
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === '' || (/^\d*\.?\d{0,2}$/.test(value) && !isNaN(parseFloat(value)))) {
      setAmount(value);
      setError('');
    }
  }
  
  const setPercentage = (percentage: number) => {
    const calculatedAmount = (availableBalance * percentage).toFixed(2);
    setAmount(calculatedAmount);
    setError('');
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    // Validate amount
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (numAmount > availableBalance) {
      setError('Amount exceeds available balance')
      return
    }
    
    if (numAmount < 5) {
      setError('Minimum payout amount is $5.00')
      return
    }
    
    if (!payoutMethod) {
      setError('Please select a payout method')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      // In a real app, this would submit to the backend
      await new Promise<void>(resolve => setTimeout(resolve, 1500))
      
      if (onSubmit) {
        onSubmit({
          amount: numAmount,
          payoutMethod,
          note,
          date: new Date().toISOString(),
        })
      }
      
      setSuccess(true)
      
    } catch (err: unknown) {
      console.error('Payout request error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const resetForm = () => {
    setAmount('')
    setPayoutMethod(defaultMethod?.id || '')
    setNote('')
    setSuccess(false)
    setError('')
  }
  
  const selectedMethod = payoutMethods.find(method => method.id === payoutMethod);
  const numAmount = parseFloat(amount) || 0;
  const feeAmount = calculateFee(numAmount);
  const netAmount = calculateNetAmount(numAmount);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white">
          <DollarSign className="mr-2 h-4 w-4" />
          Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Request Payout</DialogTitle>
          <DialogDescription>
            Request a withdrawal of your available balance to your preferred payout method.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-6 flex flex-col items-center text-center bg-white">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payout Requested</h3>
            <p className="text-muted-foreground mb-4">
              Your payout request for {formatCurrency(parseFloat(amount))} has been submitted successfully.
            </p>
            <div className="bg-muted p-4 rounded-md w-full mb-6">
              <div className="flex justify-between mb-2">
                <span>Request amount:</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Processing fee:</span>
                <span className="text-muted-foreground">-{formatCurrency(feeAmount)}</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span>You'll receive:</span>
                <span className="font-bold">{formatCurrency(netAmount)}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Your funds will be sent to {selectedMethod?.type === 'bank_account' ? 
                `${selectedMethod.bank_name} (••••${selectedMethod.last4})` : 
                `${selectedMethod?.card_type ?? 'Unknown Card'} (••••${selectedMethod?.last4 ?? '0000'})`
              } within 1-3 business days.
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => resetForm()} className="flex-1">
                Close
              </Button>
              <Button onClick={() => {
                resetForm();
                setShowFeeBreakdown(false);
              }} className="flex-1">
                New Request
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white">
            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Card className="border-none shadow-none bg-muted">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                  <div className="text-2xl font-bold">{formatCurrency(availableBalance)}</div>
                </CardContent>
              </Card>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center justify-between">
                  <span>Amount to Withdraw</span>
                  <span className="text-xs text-muted-foreground">
                    Min: $5.00
                  </span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="pl-9 bg-white"
                    required
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline"
                    onClick={() => setPercentage(0.25)}
                  >
                    25%
                  </button>
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline"
                    onClick={() => setPercentage(0.5)}
                  >
                    50%
                  </button>
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline"
                    onClick={() => setPercentage(0.75)}
                  >
                    75%
                  </button>
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline"
                    onClick={() => setPercentage(1)}
                  >
                    Max
                  </button>
                </div>
              </div>
              
              {numAmount > 0 && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Request amount:</span>
                    <span>{formatCurrency(numAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <span>Processing fee:</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-3 w-3 ml-1 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">
                              A {processingFee}% + ${flatFee.toFixed(2)} processing fee applies to all payouts.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-muted-foreground">-{formatCurrency(feeAmount)}</span>
                  </div>
                  <div className="border-t border-border pt-1 mt-1 flex justify-between font-medium">
                    <span>You'll receive:</span>
                    <span>{formatCurrency(netAmount)}</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="payout-method">Payout Method</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod} required>
                  <SelectTrigger id="payout-method" className="bg-white">
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {payoutMethods.length === 0 ? (
                      <SelectItem value="no-methods" disabled>
                        No payout methods available
                      </SelectItem>
                    ) : (
                      payoutMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.type === 'bank_account' ? (
                            <div className="flex items-center">
                              <Building className="mr-2 h-4 w-4" />
                              {method.bank_name} (••••{method.last4})
                              {method.default && <span className="ml-2 text-xs text-muted-foreground">(Default)</span>}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <CreditCard className="mr-2 h-4 w-4" />
                              {method.card_type} (••••{method.last4})
                              {method.default && <span className="ml-2 text-xs text-muted-foreground">(Default)</span>}
                            </div>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {payoutMethods.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    <a href="/dashboard/settings/payout-methods" className="text-blue-600 hover:underline">
                      Add a payout method
                    </a> to continue.
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note for your reference"
                  rows={2}
                  className="resize-none bg-white"
                />
              </div>
              
              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <p className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Payout requests are typically processed within 1-3 business days.
                </p>
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => resetForm()}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || payoutMethods.length === 0 || numAmount <= 0 || numAmount > availableBalance}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Request Payout'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
