-- Elo Family - base para recorrencia, historico e gamificacao de missoes
-- Rode no SQL Editor do Supabase antes de publicar a versao com historico completo.

alter table public.tasks
  add column if not exists category text,
  add column if not exists active boolean not null default true;

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  parent_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz not null default now(),
  completed_date date not null default current_date,
  stars_earned integer not null default 0,
  approved_by_parent boolean not null default true,
  created_at timestamptz not null default now(),
  unique (task_id, child_id, completed_date)
);

create index if not exists idx_task_completions_child_date
  on public.task_completions (child_id, completed_date desc);

create index if not exists idx_task_completions_task_date
  on public.task_completions (task_id, completed_date desc);

alter table public.task_completions enable row level security;

create policy "Parents can read completions from their children"
on public.task_completions
for select
using (
  exists (
    select 1
    from public.children c
    where c.id = task_completions.child_id
      and c.parent_id = auth.uid()
  )
);

create policy "Parents can insert completions from their children"
on public.task_completions
for insert
with check (
  exists (
    select 1
    from public.children c
    where c.id = task_completions.child_id
      and c.parent_id = auth.uid()
  )
);

create policy "Parents can reset completions from their children"
on public.task_completions
for delete
using (
  exists (
    select 1
    from public.children c
    where c.id = task_completions.child_id
      and c.parent_id = auth.uid()
  )
);
