# Gigatron Sports

React, TypeScript, Vite, and Supabase storefront with catalogue, cart, secure checkout, contact enquiries, and a role-protected admin portal at `/admin`.

## Local setup

1. Copy `.env.example` to `.env` and enter the Supabase project URL and publishable key.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.

## Supabase setup

Apply every file in `supabase/migrations` in filename order. With the Supabase CLI linked to the project, use:

```sh
supabase db push
```

The migrations create the catalogue, settings, orders, enquiries, product-image storage, server-validated checkout functions, and row-level security policies.

## First administrator

Create the administrator in Supabase Dashboard under Authentication → Users. Then run this once in the SQL editor, replacing the email:

```sql
insert into public.admin_users (user_id, display_name)
select id, 'Gigatron Administrator'
from auth.users
where lower(email) = lower('admin@example.com')
on conflict (user_id) do nothing;
```

Only users present in `public.admin_users` can read orders and enquiries or change catalogue and site data. Never add a service-role key to the frontend or `.env`.

## Verification

```sh
npm run build
npx tsc -p tsconfig.app.json --noEmit
```
