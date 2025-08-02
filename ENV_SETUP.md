# Environment Variables Setup

## Quick Fix for "supabaseKey is required" Error

### Step 1: Create/Update .env.local
Create a file called `.env.local` in your project root (same level as `package.json`) with these variables:

```env
# Required - Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Required - Your Supabase anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdG5wdmJqY2NqY2NqY2NqY2MiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzOTI0OTYwMCwiZXhwIjoxOTU0ODI1NjAwfQ.YourAnonKeyHere

# Optional - Your Supabase service role key (for admin features)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdG5wdmJqY2NqY2NqY2NqY2MiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM5MjQ5NjAwLCJleHAiOjE5NTQ4MjU2MDB9.YourServiceRoleKeyHere
```

### Step 2: Get Your Keys from Supabase
1. Go to your Supabase dashboard
2. Click **Settings** → **API**
3. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Restart Development Server
```bash
npm run dev
```

## File Structure
```
your-project/
├── .env.local          ← Create this file
├── package.json
├── src/
└── ...
```

## Troubleshooting

### Error: "supabaseKey is required"
- Check if `.env.local` exists in project root
- Verify the key names are exactly as shown above
- Restart your development server

### Error: "Admin client not configured"
- Add the `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- Restart development server
- This is only needed for admin features

### Environment Variables Not Loading
- Make sure file is named `.env.local` (not `.env`)
- Check for typos in variable names
- Restart development server after changes

## Example .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzOTI0OTYwMCwiZXhwIjoxOTU0ODI1NjAwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM5MjQ5NjAwLCJleHAiOjE5NTQ4MjU2MDB9.example
``` 