-- Add delete policy for swipes so users can retake their swipes
create policy "Users can delete their own swipes"
  on public.swipes for delete
  to authenticated
  using (auth.uid() = swiper_id);