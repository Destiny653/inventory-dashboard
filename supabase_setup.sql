-- ==========================================
-- Supabase Database Setup for Inventory Dashboard
-- Consolidated Script containing all entities, functions, and RLS
-- ==========================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing triggers and functions (for clean initialization)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_order_status_update ON public.orders;
DROP TRIGGER IF EXISTS on_new_order ON public.orders;
DROP TRIGGER IF EXISTS on_low_stock ON public.products;
DROP TRIGGER IF EXISTS on_new_user_signup ON auth.users;

DROP VIEW IF EXISTS public.notification_stats CASCADE;
DROP VIEW IF EXISTS public.user_management_view CASCADE;
DROP VIEW IF EXISTS public.user_profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_users_with_roles() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_vendor(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_customer(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.send_notification(UUID, TEXT, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_users() CASCADE;
DROP FUNCTION IF EXISTS public.handle_order_status_update() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_order() CASCADE;
DROP FUNCTION IF EXISTS public.handle_low_stock() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;
DROP FUNCTION IF EXISTS public.get_unread_notification_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.mark_notifications_as_read(UUID, UUID[]) CASCADE;
DROP FUNCTION IF EXISTS public.decrement_product_stock(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- 3. Create Tables in Correct Dependency Order

-- A. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_threshold INTEGER DEFAULT 5,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  slug TEXT UNIQUE,
  avg_rating DECIMAL(3,2) DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  items JSONB NOT NULL DEFAULT '[]',
  shipping_address JSONB,
  billing_address JSONB,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT,
  shipping_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- D. Completed Orders Table (for historical archiving)
CREATE TABLE IF NOT EXISTS public.completed_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_order_id UUID NOT NULL,
  order_data JSONB NOT NULL DEFAULT '{}',
  customer_data JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- E. Completed Sales Table (for direct sales)
CREATE TABLE IF NOT EXISTS public.completed_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  customer_name TEXT DEFAULT 'Anonymous',
  customer_email TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax DECIMAL(10,2) NOT NULL CHECK (tax >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL,
  staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_in_person BOOLEAN DEFAULT TRUE,
  notes TEXT
);

-- F. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'stock', 'system', 'status_update', 'new_signup')),
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- G. Storage Setup (Products Bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Access" ON storage.objects;

-- Create policies for storage access control
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "Authenticated Upload Access" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');

CREATE POLICY "Authenticated Update Access" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'products');

CREATE POLICY "Authenticated Delete Access" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'products');

-- 4. Create Views for Application Logic

-- A. user_profiles view (safe projection of auth.users for general client use)
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'N/A') as full_name,
  raw_user_meta_data->>'phone' as phone,
  created_at,
  COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture') as avatar_url,
  COALESCE(raw_user_meta_data->>'role', 'user') as role
FROM auth.users;

-- B. user_management_view (expanded metadata projection for administrative pages)
CREATE OR REPLACE VIEW public.user_management_view AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  raw_user_meta_data->>'picture' as picture,
  created_at,
  last_sign_in_at,
  email_confirmed_at,
  phone_confirmed_at
FROM auth.users;

-- C. notification_stats view
CREATE OR REPLACE VIEW public.notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE read = FALSE) as unread_count,
  COUNT(*) FILTER (WHERE type = 'order') as order_notifications,
  COUNT(*) FILTER (WHERE type = 'stock') as stock_notifications,
  COUNT(*) FILTER (WHERE type = 'system') as system_notifications,
  MAX(created_at) as last_notification
FROM public.notifications
GROUP BY user_id;

-- 5. Helper Functions & Stored Procedures

-- A. Timestamp Updater Trigger Function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Handle New User Signup Metadata Configuration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Default role to 'user' if not explicitly set
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', 'user');
  END IF;
  
  -- Sync full_name if not provided but name is present
  IF NEW.raw_user_meta_data->>'full_name' IS NULL AND NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
    NEW.raw_user_meta_data = NEW.raw_user_meta_data || 
      jsonb_build_object('full_name', NEW.raw_user_meta_data->>'name');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Update User Role (Admin Operation)
CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE auth.users 
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    to_jsonb(new_role)
  )
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Fetch User Role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' 
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Fetch User Roles for Administrative Dashboard
CREATE OR REPLACE FUNCTION public.get_users_with_roles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'N/A') as full_name,
    COALESCE(u.raw_user_meta_data->>'role', 'user') as role,
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') as avatar_url,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F. User Verification & Role Validation Overloads
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'admin'
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_vendor(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'vendor'
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_customer(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' = 'customer'
    FROM auth.users 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- G. Programmatic Alert & Notification Delivery
CREATE OR REPLACE FUNCTION public.send_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT,
  notification_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    metadata
  ) VALUES (
    target_user_id,
    notification_title,
    notification_message,
    notification_type,
    notification_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- H. Retrieve List of Administrators
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (user_id UUID, email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email
  FROM auth.users au
  WHERE au.raw_user_meta_data->>'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- I. Trigger: Order Status Progression Alerting
CREATE OR REPLACE FUNCTION public.handle_order_status_update()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- 1. Notify Customer
    PERFORM public.send_notification(
      NEW.user_id,
      'Order Status Updated',
      'Your order #' || NEW.order_number || ' status has been updated to: ' || NEW.status,
      'status_update',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    
    -- 2. Notify Admins
    FOR admin_user IN SELECT * FROM public.get_admin_users() LOOP
      PERFORM public.send_notification(
        admin_user.user_id,
        'Order Status Changed',
        'Order #' || NEW.order_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
        'order',
        jsonb_build_object(
          'order_id', NEW.id,
          'order_number', NEW.order_number,
          'customer_id', NEW.user_id,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- J. Trigger: Placed Order Dispatch alerts
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  vendor_user RECORD;
BEGIN
  -- 1. Notify Admins
  FOR admin_user IN SELECT * FROM public.get_admin_users() LOOP
    PERFORM public.send_notification(
      admin_user.user_id,
      'New Order Received',
      'New order #' || NEW.order_number || ' received for $' || NEW.total_amount,
      'order',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'customer_id', NEW.user_id,
        'total_amount', NEW.total_amount
      )
    );
  END LOOP;
  
  -- 2. Notify Vendor
  SELECT id, email INTO vendor_user FROM auth.users WHERE id = NEW.vendor_id;
  IF FOUND THEN
    PERFORM public.send_notification(
      vendor_user.id,
      'New Order Assignment',
      'You have received a new order #' || NEW.order_number || ' for $' || NEW.total_amount,
      'order',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'customer_id', NEW.user_id,
        'total_amount', NEW.total_amount
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- K. Trigger: Low Stock Threshold Alerter
CREATE OR REPLACE FUNCTION public.handle_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  IF NEW.stock_quantity <= NEW.min_stock_threshold AND OLD.stock_quantity > NEW.min_stock_threshold THEN
    -- 1. Notify Admins
    FOR admin_user IN SELECT * FROM public.get_admin_users() LOOP
      PERFORM public.send_notification(
        admin_user.user_id,
        'Low Stock Alert',
        'Product "' || NEW.name || '" is running low on stock. Current quantity: ' || NEW.stock_quantity,
        'stock',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.name,
          'current_stock', NEW.stock_quantity,
          'threshold', NEW.min_stock_threshold,
          'vendor_id', NEW.vendor_id
        )
      );
    END LOOP;
    
    -- 2. Notify Vendor
    IF NEW.vendor_id IS NOT NULL THEN
      PERFORM public.send_notification(
        NEW.vendor_id,
        'Low Stock Alert',
        'Your product "' || NEW.name || '" is running low on stock. Current quantity: ' || NEW.stock_quantity,
        'stock',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.name,
          'current_stock', NEW.stock_quantity,
          'threshold', NEW.min_stock_threshold
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- L. Trigger: New User Signup Notification to Admin
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  FOR admin_user IN SELECT * FROM public.get_admin_users() LOOP
    PERFORM public.send_notification(
      admin_user.user_id,
      'New User Signup',
      'New user signed up: ' || COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'new_signup',
      jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'N/A'),
        'role', COALESCE(NEW.raw_user_meta_data->>'role', 'user')
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- M. RPC: Get Unread Notification Count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = user_uuid AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- N. RPC: Dismiss/Mark Notifications Read
CREATE OR REPLACE FUNCTION public.mark_notifications_as_read(user_uuid UUID, notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET read = TRUE, updated_at = NOW()
  WHERE user_id = user_uuid AND id = ANY(notification_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- O. RPC: Decrement Product Stock
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  product_id UUID,
  amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity - amount
  WHERE id = product_id;
  
  -- Validate that stock did not fall negative
  IF EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND stock_quantity < 0) THEN
    RAISE EXCEPTION 'Stock quantity cannot be negative';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach Table Triggers

-- Triggers for updated_at column automatic syncing
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers for notification lifecycle and workflows
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_order_status_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_update();

CREATE TRIGGER on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_order();

CREATE TRIGGER on_low_stock
  AFTER UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_low_stock();

CREATE TRIGGER on_new_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 7. Performance & Integrity Indexes
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth.users USING GIN ((raw_user_meta_data->>'role'));
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users (email);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies

-- A. Categories Policies
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Categories are manageable by admins" ON public.categories
  FOR ALL USING (public.is_admin());

-- B. Products Policies
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Vendors can manage their own products" ON public.products
  FOR ALL USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (public.is_admin());

-- C. Orders Policies
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can view orders assigned to them" ON public.orders
  FOR SELECT USING (auth.uid() = vendor_id OR public.is_admin());

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (public.is_admin());

-- D. Completed Orders Policies
CREATE POLICY "Users can view their own completed orders" ON public.completed_orders
  FOR SELECT USING (auth.uid() = (customer_data->>'id')::UUID OR public.is_admin());

CREATE POLICY "Admins can manage all completed orders" ON public.completed_orders
  FOR ALL USING (public.is_admin());

-- E. Completed Sales Policies
CREATE POLICY "Staff can view their own sales" ON public.completed_sales
  FOR SELECT USING (auth.uid() = staff_id OR public.is_admin());

CREATE POLICY "Admins can manage all sales records" ON public.completed_sales
  FOR ALL USING (public.is_admin());

-- F. Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR ALL USING (public.is_admin());

-- 10. Access Control & Execution Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT ON public.categories TO authenticated, anon;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.completed_orders TO authenticated;
GRANT ALL ON public.completed_sales TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_management_view TO authenticated;
GRANT SELECT ON public.notification_stats TO authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vendor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_customer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_as_read(UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, INTEGER) TO authenticated;

-- 11. Initial Seeding of Category & Product Data
INSERT INTO public.categories (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Electronics'),
  ('22222222-2222-2222-2222-222222222222', 'Fashion'),
  ('33333333-3333-3333-3333-333333333333', 'Home & Living'),
  ('44444444-4444-4444-4444-444444444444', 'Books'),
  ('55555555-5555-5555-5555-555555555555', 'Sports'),
  ('66666666-6666-6666-6666-666666666666', 'Beauty')
ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.products (id, name, description, price, stock_quantity, min_stock_threshold, category_id, slug, image_url) VALUES
  (gen_random_uuid(), 'iPhone 14 Pro', 'Latest Apple iPhone with advanced camera system', 999.99, 50, 5, '11111111-1111-1111-1111-111111111111', 'iphone-14-pro', 'https://images.unsplash.com/photo-1678911820864-e2c567c655d7?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Samsung 4K TV', '65-inch Smart TV with HDR', 799.99, 30, 5, '11111111-1111-1111-1111-111111111111', 'samsung-4k-tv', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'MacBook Pro M2', '14-inch MacBook Pro with M2 chip', 1499.99, 25, 5, '11111111-1111-1111-1111-111111111111', 'macbook-pro-m2', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Leather Jacket', 'Premium leather jacket for men', 199.99, 40, 5, '22222222-2222-2222-2222-222222222222', 'leather-jacket', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Designer Handbag', 'Luxury designer handbag', 299.99, 20, 5, '22222222-2222-2222-2222-222222222222', 'designer-handbag', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Running Shoes', 'Professional running shoes', 89.99, 60, 5, '22222222-2222-2222-2222-222222222222', 'running-shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Sofa Set', 'Modern 3-piece sofa set', 899.99, 15, 5, '33333333-3333-3333-3333-333333333333', 'sofa-set', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Dining Table', '6-seater wooden dining table', 499.99, 20, 5, '33333333-3333-3333-3333-333333333333', 'dining-table', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Smart LED Lamp', 'WiFi-enabled smart LED lamp', 49.99, 100, 5, '33333333-3333-3333-3333-333333333333', 'smart-led-lamp', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'The Great Gatsby', 'Classic novel by F. Scott Fitzgerald', 14.99, 200, 5, '44444444-4444-4444-4444-444444444444', 'the-great-gatsby', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Python Programming', 'Comprehensive guide to Python', 39.99, 150, 5, '44444444-4444-4444-4444-444444444444', 'python-programming', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Cooking Masterclass', 'Professional cooking techniques', 29.99, 100, 5, '44444444-4444-4444-4444-444444444444', 'cooking-masterclass', 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Tennis Racket', 'Professional tennis racket', 159.99, 40, 5, '55555555-5555-5555-5555-555555555555', 'tennis-racket', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Basketball', 'Official size basketball', 29.99, 80, 5, '55555555-5555-5555-5555-555555555555', 'basketball', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Yoga Mat', 'Premium non-slip yoga mat', 24.99, 120, 5, '55555555-5555-5555-5555-555555555555', 'yoga-mat', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Face Cream', 'Anti-aging face cream', 49.99, 100, 5, '66666666-6666-6666-6666-666666666666', 'face-cream', 'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Hair Dryer', 'Professional hair dryer', 79.99, 45, 5, '66666666-6666-6666-6666-666666666666', 'hair-dryer', 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?q=80&w=800&auto=format&fit=crop'),
  (gen_random_uuid(), 'Perfume Set', 'Luxury perfume gift set', 129.99, 30, 5, '66666666-6666-6666-6666-666666666666', 'perfume-set', 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop')
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, 
    price = EXCLUDED.price, 
    stock_quantity = EXCLUDED.stock_quantity,
    image_url = EXCLUDED.image_url;
