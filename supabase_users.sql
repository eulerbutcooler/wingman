-- Supabase SQL schema for users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
