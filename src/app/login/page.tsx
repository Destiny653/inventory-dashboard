 'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    
    // Check if user is already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // User is already logged in, redirect based on role
                const userRole = session.user.user_metadata?.role || 'customer'
                redirectUserBasedOnRole(userRole)
            }
        }
        
        checkSession()
    }, [router])

    const redirectUserBasedOnRole = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                router.push('/dashboard/admin')
                break
            case 'vendor':
                router.push('/dashboard/vendor')
                break
            case 'customer':
                router.push('/dashboard')
                break
            default:
                router.push('/dashboard')
                break
        }
    }

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!email || !password) {
            setError('Please enter both email and password')
            return
        }

        try {
            setLoading(true)
            setError('')

            // Supabase auth call
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                throw error
            }

            if (data?.user) {
                // Get user role from metadata
                const userRole = data.user.user_metadata?.role || 'customer'
                
                // Check if user has admin or vendor role
                if (['admin', 'vendor'].includes(userRole.toLowerCase())) {
                    // Redirect based on role
                    redirectUserBasedOnRole(userRole)
                } else {
                    // User doesn't have admin or vendor role
                    await supabase.auth.signOut()
                    router.push('/welcome')
                    return
                }
            }
        } catch (err: any) {
            console.error('Login error:', err)
            setError(err.message || 'An unexpected error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleLogin() {
        try {
            setLoading(true)
            
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`
                }
            })
            
            if (error) throw error
            
            // The redirect happens automatically by Supabase
            // Role checking will be handled in the callback page or after redirect
        } catch (err: any) {
            console.error('Google login error:', err)
            setError(err.message || 'Failed to sign in with Google. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">MultiVendor Market</h1>
                    <p className="text-gray-600 mt-2">Sign in to your account</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {/* <Link
                                        href="/forgot-password"
                                        className="text-sm text-blue-600 hover:text-blue-500"
                                    >
                                        Forgot password?
                                    </Link> */}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Remember me for 30 days
                                </Label>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded shadow-[0_3px_2px_0_rgba(0,0,0,0.3)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-all duration-200 ease-in-out dark:bg-blue-500 dark:text-white dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] dark:hover:shadow-[0_6px_20px_rgba(255,255,255,0.15)] dark:hover:bg-blue-400"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </Button>
                    </CardContent>
                    {/* <CardFooter className="flex justify-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter> */}
                </Card>

                <div className="text-center mt-6">
                    <p className="text-xs text-gray-500">
                        By signing in, you agree to our{' '}
                        <Link href="/terms" className="underline hover:text-gray-700">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="underline hover:text-gray-700">
                            Privacy Policy
                        </Link>
                    </p>
                </div>

                {/* Demo account information */}
                <div className="mt-8 p-4 border border-blue-100 rounded-md bg-blue-50">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Access Levels</h3>
                    <div className="text-xs text-blue-700 space-y-1">
                        <p>Admin: Full system access</p>
                        <p>Vendor: Vendor dashboard access</p>
                        <p>Customer: Basic dashboard access</p>
                        <p className="text-red-600 font-medium">Note: Access is determined by your account role</p>
                    </div>
                </div>
            </div>
        </div>
    )
}