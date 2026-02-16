-- Create device commands table for remote control
create table if not exists device_commands (
    id uuid default gen_random_uuid() primary key,
    vehicle_id uuid references vehicles(id) on delete cascade not null,
    command_type text not null check (command_type in ('STOP_TRACKING', 'START_TRACKING', 'RELOAD', 'KILL_APP', 'DIM_SCREEN', 'RESET_SCREEN', 'GET_STATUS', 'START_RIDE', 'COMPLETE_RIDE')),
    payload jsonb default '{}'::jsonb,
    status text default 'pending' check (status in ('pending', 'executed', 'failed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table device_commands enable row level security;

-- Policies
create policy "Enable read access for authenticated users" on device_commands
    for select using (auth.role() = 'authenticated');

create policy "Enable insert access for authenticated users" on device_commands
    for insert with check (auth.role() = 'authenticated');

create policy "Enable update access for authenticated users" on device_commands
    for update using (auth.role() = 'authenticated');

-- Enable realtime
alter publication supabase_realtime add table device_commands;
