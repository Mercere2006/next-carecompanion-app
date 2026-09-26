-- Migration: Add liked_by_companion column to reviews table
-- Enables companions to send hearts/likes to customer reviews

ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS liked_by_companion BOOLEAN DEFAULT false;

-- Policy to allow companions to update liked_by_companion on reviews belonging to them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Companions can update liked_by_companion on their reviews'
  ) THEN
    CREATE POLICY "Companions can update liked_by_companion on their reviews"
    ON public.reviews
    FOR UPDATE
    USING (auth.uid() = companion_id)
    WITH CHECK (auth.uid() = companion_id);
  END IF;
END $$;
