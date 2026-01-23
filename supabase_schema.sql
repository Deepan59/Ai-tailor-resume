-- Create the table for storing resume metadata
create table public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  file_path text not null,
  job_title text,
  company text,
  original_text text,
  tailored_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.resumes enable row level security;

-- Create policies to allow users to see/edit ONLY their own resumes
create policy "Users can view their own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resumes"
  on public.resumes for update
  using (auth.uid() = user_id);

-- Create a storage bucket for resume files
insert into storage.buckets (id, name, public) 
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Set up storage policies
create policy "Authenticated users can upload resumes"
  on storage.objects for insert
  with check ( bucket_id = 'resumes' and auth.role() = 'authenticated' );

create policy "Users can read their own resumes"
  on storage.objects for select
  using ( bucket_id = 'resumes' and auth.uid() = (storage.foldername(name))[1]::uuid );
