-- Notification System Database Setup
-- This file contains SQL commands for setting up a comprehensive notification system

-- 1. Create notifications table
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

-- 2. Create orders table for order tracking
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  shipping_address JSONB,
  billing_address JSONB,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create products table for stock tracking
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_threshold INTEGER DEFAULT 5,
  category TEXT,
  images JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 6. Create RLS policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can view orders assigned to them" ON public.orders
  FOR SELECT USING (
    auth.uid() = vendor_id OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 7. Create RLS policies for products
CREATE POLICY "Vendors can manage their own products" ON public.products
  FOR ALL USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 8. Create function to send notifications
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

-- 9. Create function to check if user is admin
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

-- 10. Create function to get admin users
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

-- 11. Create trigger for order status updates
CREATE OR REPLACE FUNCTION public.handle_order_status_update()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- If order status changed, notify the customer
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify customer about status change
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
    
    -- Notify all admins about the status change
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

-- 12. Create trigger for new orders
CREATE OR REPLACE FUNCTION public.handle_new_order()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  vendor_user RECORD;
BEGIN
  -- Notify all admins about new order
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
  
  -- Notify vendor about new order
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

-- 13. Create trigger for low stock alerts
CREATE OR REPLACE FUNCTION public.handle_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Check if stock is below threshold
  IF NEW.stock_quantity <= NEW.min_stock_threshold AND OLD.stock_quantity > NEW.min_stock_threshold THEN
    -- Notify all admins about low stock
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
    
    -- Notify vendor about low stock
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger for new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Notify all admins about new user signup
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

-- 15. Create triggers
DROP TRIGGER IF EXISTS on_order_status_update ON public.orders;
CREATE TRIGGER on_order_status_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_update();

DROP TRIGGER IF EXISTS on_new_order ON public.orders;
CREATE TRIGGER on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_order();

DROP TRIGGER IF EXISTS on_low_stock ON public.products;
CREATE TRIGGER on_low_stock
  AFTER UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_low_stock();

DROP TRIGGER IF EXISTS on_new_user_signup ON auth.users;
CREATE TRIGGER on_new_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 16. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity);

-- 17. Create function to get unread notification count
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

-- 18. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_as_read(user_uuid UUID, notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET read = TRUE, updated_at = NOW()
  WHERE user_id = user_uuid AND id = ANY(notification_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Insert sample data for testing (optional)
-- Uncomment the following lines to insert sample notifications for testing

/*
INSERT INTO public.notifications (user_id, title, message, type, metadata) VALUES
(
  (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1),
  'Welcome to the Dashboard',
  'Your admin dashboard is now ready to use.',
  'system',
  '{"welcome": true}'
);

INSERT INTO public.orders (user_id, vendor_id, order_number, status, total_amount, items) VALUES
(
  (SELECT id FROM auth.users WHERE email = 'customer@example.com' LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'vendor@example.com' LIMIT 1),
  'ORD-2024-001',
  'pending',
  99.99,
  '[{"product_id": "123", "name": "Sample Product", "quantity": 1, "price": 99.99}]'
);
*/

-- 20. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notifications_as_read TO authenticated;

-- 21. Create a view for notification statistics
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

-- End of Notification System Setup 