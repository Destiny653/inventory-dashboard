 // app/page.tsx

import Link from 'next/link'
import { ArrowRight, ShoppingBag, Store, Users, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'MarketHub - Multi-Vendor Marketplace Platform',
  description: 'Buy and sell products from thousands of independent vendors on our marketplace platform.',
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-theme-50 to-white py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block text-theme-900">Your One-Stop</span>
              <span className="block text-theme">Multi-Vendor Marketplace</span>
            </h1>
            <p className="mt-6 text-xl text-theme-600 max-w-2xl mx-auto">
              Join thousands of buyers and sellers on our platform. Shop unique products or start selling today with our powerful vendor tools.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/shop">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Shop Now
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/become-vendor">
                  <Store className="mr-2 h-5 w-5" />
                  Become a Vendor
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-10 -z-10">
          <div className="w-72 h-72 rounded-full bg-theme blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 right-0 opacity-10 -z-10">
          <div className="w-96 h-96 rounded-full bg-theme-500 blur-3xl"></div>
        </div>
      </section>
      
      {/* Featured Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-theme-900">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Electronics', image: '/images/categories/electronics.jpg', slug: 'electronics' },
              { name: 'Fashion', image: '/images/categories/fashion.jpg', slug: 'fashion' },
              { name: 'Home & Garden', image: '/images/categories/home.jpg', slug: 'home-garden' },
              { name: 'Beauty', image: '/images/categories/beauty.jpg', slug: 'beauty' },
              { name: 'Sports', image: '/images/categories/sports.jpg', slug: 'sports' },
              { name: 'Toys', image: '/images/categories/toys.jpg', slug: 'toys' },
            ].map((category) => (
              <Link 
                href={`/shop/category/${category.slug}`} 
                key={category.slug}
                className="group relative overflow-hidden rounded-lg aspect-square bg-theme-100 hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                <div 
                  className="absolute inset-0 bg-cover bg-center z-0" 
                  style={{ backgroundImage: `url(${category.image})` }}
                ></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <h3 className="text-white font-medium group-hover:underline">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" asChild>
              <Link href="/shop/categories">
                View All Categories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-16 bg-theme-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-theme-900">Featured Products</h2>
            <Button variant="ghost" asChild>
              <Link href="/shop" className="flex items-center text-theme">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 1, name: 'Wireless Earbuds', price: 79.99, vendor: 'AudioTech', image: '/images/products/earbuds.jpg', rating: 4.5 },
              { id: 2, name: 'Leather Wallet', price: 49.99, vendor: 'LeatherCraft', image: '/images/products/wallet.jpg', rating: 4.8 },
              { id: 3, name: 'Smart Watch', price: 199.99, vendor: 'TechGear', image: '/images/products/watch.jpg', rating: 4.2 },
              { id: 4, name: 'Ceramic Mug Set', price: 34.99, vendor: 'HomeEssentials', image: '/images/products/mugs.jpg', rating: 4.7 },
            ].map((product) => (
              <Link 
                href={`/shop/product/${product.id}`} 
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="aspect-square overflow-hidden">
                  <div 
                    className="h-full w-full bg-cover bg-center transform group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundImage: `url(${product.image})` }}
                  ></div>
                </div>
                <div className="p-4">
                  <div className="text-sm text-theme-500 mb-1">{product.vendor}</div>
                  <h3 className="font-medium group-hover:text-theme transition-colors">{product.name}</h3>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3.5 w-3.5 ${
                            i < Math.floor(product.rating) 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : i < product.rating 
                                ? 'text-yellow-400 fill-yellow-400 opacity-50' 
                                : 'text-theme-200'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-theme-500 ml-1">{product.rating}</span>
                  </div>
                  <div className="mt-2 font-bold text-theme-900">${product.price.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16 text-theme-900">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                title: 'Shop From Multiple Vendors', 
                description: 'Browse thousands of products from independent sellers all in one place.',
                icon: ShoppingBag 
              },
              { 
                title: 'Sell Your Products', 
                description: 'Create your vendor account, list products, and start selling to our community.',
                icon: Store 
              },
              { 
                title: 'Join Our Community', 
                description: 'Connect with other buyers and sellers in our growing marketplace.',
                icon: Users 
              },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-theme/10 flex items-center justify-center mb-6">
                  <item.icon className="h-8 w-8 text-theme" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-theme-900">{item.title}</h3>
                <p className="text-theme-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 bg-theme-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16 text-theme-900">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                quote: "As a vendor, I've been able to reach customers I never would have found otherwise. The platform is easy to use and the support team is fantastic.", 
                author: "Sarah Johnson",
                role: "Vendor - Handmade Jewelry",
                avatar: "/images/testimonials/sarah.jpg"
              },
              { 
                quote: "I love shopping here because I can find unique products from small businesses. The quality is always excellent and shipping is fast.", 
                author: "Michael Chen",
                role: "Customer",
                avatar: "/images/testimonials/michael.jpg"
              },
              { 
                quote: "This marketplace has transformed my small business. The tools they provide for vendors make it simple to manage inventory and track sales.", 
                author: "Priya Patel",
                role: "Vendor - Organic Skincare",
                avatar: "/images/testimonials/priya.jpg"
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start mb-4">
                  <div className="text-theme">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.17 6C6.37 6 4.1 8.27 4.1 11.07C4.1 13.87 6.37 16.14 9.17 16.14C9.7 16.14 10.2 16.04 10.69 15.88C10.85 17.26 10.62 20.13 7.88 22.13C7.88 22.13 11.64 22.13 14.47 17.86C15.31 16.54 15.96 14.68 15.96 12.21C15.96 8.71 12.96 6 9.17 6Z" fill="currentColor"/>
                      <path d="M19.5 6C16.7 6 14.43 8.27 14.43 11.07C14.43 13.87 16.7 16.14 19.5 16.14C20.03 16.14 20.53 16.04 21.02 15.88C21.18 17.26 20.95 20.13 18.21 22.13C18.21 22.13 21.97 22.13 24.8 17.86C25.64 16.54 26.29 14.68 26.29 12.21C26.29 8.71 23.29 6 19.5 6Z" fill="currentColor"/>
                    </svg>
                  </div>
                </div>
                <p className="text-theme-700 mb-6">{testimonial.quote}</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.author}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-theme-900">{testimonial.author}</div>
                    <div className="text-sm text-theme-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-theme text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-lg opacity-90 mb-8">
              Join our marketplace today and discover the benefits of our multi-vendor platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/shop">
                  Start Shopping
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" asChild>
                <Link href="/become-vendor">
                  Become a Vendor
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trust Badges */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
            {[
              'Secure Payments',
              'Free Returns',
              'Quality Guarantee',
              '24/7 Support',
              'Verified Vendors'
            ].map((badge, index) => (
              <div key={index} className="flex items-center">
                <CheckCircle className="h-5 w-5 text-theme mr-2" />
                <span className="text-theme-700">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
