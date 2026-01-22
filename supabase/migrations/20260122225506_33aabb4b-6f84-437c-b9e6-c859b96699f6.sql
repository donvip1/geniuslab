-- Add link_url column to advertisements table for clickable ads
ALTER TABLE public.advertisements 
ADD COLUMN link_url TEXT;