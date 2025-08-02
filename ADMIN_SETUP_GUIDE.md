# Admin Setup Guide

This guide explains how to set up admin functionality with proper service role key configuration.

## Environment Variables Setup

### 1. **Get Your Service Role Key**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (not the anon key)

### 2. **Add to Environment Variables**
Add this to your `.env.local` file:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Add this new variable
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. **Restart Your Development Server**
```bash
npm run dev
```

## How It Works

### **Client Types**
- **`supabase`**: Regular client with anon key (for user operations)
- **`supabaseAdmin`**: Admin client with service role key (for admin operations)

### **Admin Operations**
The admin client can perform these operations:
- `supabaseAdmin.auth.admin.listUsers()` - List all users
- `supabaseAdmin.auth.admin.getUserById()` - Get specific user
- `supabaseAdmin.auth.admin.updateUserById()` - Update user metadata

### **Security**
- Service role key has full admin privileges
- Only use admin client for admin operations
- Regular client for user operations

## Testing Admin Functionality

### 1. **Check Environment Variables**
Make sure your `.env.local` has the service role key:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. **Test Admin Access**
1. Go to `/dashboard/admin/settings`
2. Click on the "Users" tab
3. You should see all users listed
4. Try updating a user's role

### 3. **Verify Admin Role**
Run this SQL in Supabase to verify your admin role:
```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email = 'your-email@example.com';
```

## Troubleshooting

### **"User not allowed" Error**
1. Check if `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Restart your development server
3. Verify the service role key is correct
4. Check if you have admin role in your user metadata

### **"Failed to fetch users" Error**
1. Verify service role key has proper permissions
2. Check Supabase project settings
3. Ensure admin client is being used

### **Environment Variable Not Found**
1. Make sure `.env.local` is in your project root
2. Restart the development server
3. Check for typos in variable name

## Code Changes Made

### **1. Updated Supabase Client (`src/lib/supabase.ts`)**
```typescript
// Added admin client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

### **2. Updated User Management (`src/app/dashboard/admin/settings/page.tsx`)**
```typescript
// Using admin client for admin operations
const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
```

## Security Best Practices

### **1. Environment Variables**
- Never commit service role key to version control
- Use `.env.local` for local development
- Use environment variables in production

### **2. Client Usage**
- Use `supabase` for user operations
- Use `supabaseAdmin` only for admin operations
- Don't expose admin client to frontend

### **3. Access Control**
- Verify user has admin role before allowing admin operations
- Log admin actions for audit trail
- Implement proper error handling

## Production Deployment

### **1. Environment Variables**
Set these in your production environment:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **2. Security Considerations**
- Service role key has full database access
- Use Row Level Security (RLS) policies
- Implement proper authentication checks
- Monitor admin operations

## Example Usage

### **Fetch All Users**
```typescript
const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
```

### **Update User Role**
```typescript
const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
  user_metadata: { role: 'admin' }
})
```

### **Get User by ID**
```typescript
const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId)
``` 