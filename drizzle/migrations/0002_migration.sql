
create policy "media read" on storage.objects for select to authenticated using (bucket_id='media');
create policy "media upload own" on storage.objects for insert to authenticated with check (bucket_id='media' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "media update own" on storage.objects for update to authenticated using (bucket_id='media' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
create policy "media delete own" on storage.objects for delete to authenticated using (bucket_id='media' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
