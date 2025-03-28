import { useState } from 'react'
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  BanIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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

interface PayoutMethod {
  id: string;
  type: 'bank_account' | 'card';
  bank_name?: string;
  card_type?: string;
  last4: string;
}

interface PayoutRequestFormProps {
  availableBalance?: number;
  payoutMethods?: PayoutMethod[];
  onSubmit?: (data: { amount: number; payoutMethod: string; note: string; date: string }) => void;
}

export function PayoutRequestForm({ availableBalance = 0, payoutMethods = [], onSubmit }: PayoutRequestFormProps) {
  const [amount, setAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState(payoutMethods[0]?.id || '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
interface FormatCurrencyFn {
    (value: number): string;
}

const formatCurrency: FormatCurrencyFn = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value)
}
  
interface SubmitFormData {
    amount: number;
    payoutMethod: string;
    note: string;
    date: string;
}

interface FormError {
    message: string;
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
    setPayoutMethod(payoutMethods[0]?.id || '')
    setNote('')
    setSuccess(false)
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <DollarSign className="mr-2 h-4 w-4" />
          Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Request a withdrawal of your available balance to your preferred payout method.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Payout Requested</h3>
            <p className="text-muted-foreground mb-6">
              Your payout request for {formatCurrency(parseFloat(amount))} has been submitted successfully. 
              It will be processed within 1-3 business days.
            </p>
            <Button onClick={resetForm}>
              Request Another Payout
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="bg-muted p-4 rounded-md mb-2">
                <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                <div className="text-2xl font-bold">{formatCurrency(availableBalance)}</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Withdraw</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={availableBalance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                    required
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline"
                    onClick={() => setAmount((availableBalance / 4).toFixed(2))}
                  >
                    25%
                  </button>
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline"
                    onClick={() => setAmount((availableBalance / 2).toFixed(2))}
                  >
                    50%
                  </button>
                  <button 
                    type="button" 
                    className="text-blue-600 hover:underline"
                    onClick={() => setAmount(availableBalance.toFixed(2))}
                  >
                    Max
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payout-method">Payout Method</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod} required>
                  <SelectTrigger id="payout-method">
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    {payoutMethods.length === 0 ? (
                      <SelectItem value="no-methods" disabled>
                        No payout methods available
                      </SelectItem>
                    ) : (
                      payoutMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.type === 'bank_account' ? (
                            <div className="flex items-center">
                              <BanIcon className="mr-2 h-4 w-4" />
                              {method.bank_name} (••••{method.last4})
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <CreditCard className="mr-2 h-4 w-4" />
                              {method.card_type} (••••{method.last4})
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
                  rows={3}
                />
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                <p>Payout requests are typically processed within 1-3 business days.</p>
                <p>A processing fee of 2.9% + $0.30 may apply depending on your payout method.</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => resetForm()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || payoutMethods.length === 0}>
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
