-- Create messages table for Aqib's portfolio
create table messages (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text,
  message text not null,
  ip_address text,
  user_agent text,
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table messages enable row level security;

-- Allow service role full access
create policy "Service role full access" on messages
  for all to service_role
  using (true) with check (true);

-- Create index for faster queries
create index idx_messages_created_at on messages(created_at desc);
create index idx_messages_read on messages(read);
