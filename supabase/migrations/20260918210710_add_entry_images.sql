insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'entry-images',
  'entry-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "read own entry images" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "upload own entry images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "delete own entry images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'entry-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
