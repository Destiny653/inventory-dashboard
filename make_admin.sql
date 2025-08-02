-- SQL Command to Make a User Admin
-- Run this in your Supabase SQL Editor

-- Option 1: Update by email (replace with your email)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
) 
WHERE email = 'your-email@example.com';

-- Option 2: Update by user ID (replace with your user ID)
-- First, find your user ID with this query:
-- SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'your-email@example.com';

-- Then update using the ID:
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
) 
WHERE id = 'your-user-id-here';

-- Option 3: Update and preserve existing metadata
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object('role', 'admin')
WHERE email = 'your-email@example.com';

-- Verify the update worked
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE email = 'your-email@example.com'; 