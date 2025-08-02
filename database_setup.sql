-- Database Setup for Auth-Based User Management
-- This file contains SQL commands for setting up user management with Supabase Auth

-- Note: This setup assumes you're using Supabase Auth with the auth.users table
-- User roles are stored in the raw_user_meta_data JSON column

-- 1. Enable Row Level Security (RLS) on auth.users (if not already enabled)
-- This is typically enabled by default in Supabase

-- 2. Create a function to automatically set default role for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default role to 'user' if not specified
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', 'user');
  END IF;
  
  -- Set default full_name if not provided
  IF NEW.raw_user_meta_data->>'full_name' IS NULL AND NEW.raw_user_meta_data->>'name' IS NOT NULL THEN
    NEW.raw_user_meta_data = NEW.raw_user_meta_data || 
      jsonb_build_object('full_name', NEW.raw_user_meta_data->>'name');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to automatically set default role on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create a view for easier user management (optional)
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
FROM auth.users
ORDER BY created_at DESC;

-- 5. Create a function to update user role (for admin use)
CREATE OR REPLACE FUNCTION public.update_user_role(
  user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the role in raw_user_meta_data
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

-- 6. Create a function to get user role
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

-- 7. Create RLS policies for user management (if needed)
-- Note: These are typically handled by Supabase Auth, but you can add custom policies

-- Policy to allow users to read their own data
CREATE POLICY "Users can view own data" ON auth.users
  FOR SELECT USING (auth.uid() = id);

-- Policy to allow admins to read all user data
CREATE POLICY "Admins can view all users" ON auth.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 8. Create indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_auth_users_role 
ON auth.users USING GIN ((raw_user_meta_data->>'role'));

CREATE INDEX IF NOT EXISTS idx_auth_users_email 
ON auth.users (email);

-- 9. Create a function to list users with roles (for admin dashboard)
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

-- 10. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_with_roles() TO authenticated;
GRANT SELECT ON public.user_management_view TO authenticated;

-- 11. Create a function to check if user is admin
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

-- 12. Create a function to check if user is vendor
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

-- 13. Create a function to check if user is customer
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

-- Grant permissions for role checking functions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vendor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_customer(UUID) TO authenticated; 