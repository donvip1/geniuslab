-- Create function to increment ad click count
CREATE OR REPLACE FUNCTION public.increment_ad_click(ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisements
  SET click_count = click_count + 1
  WHERE id = ad_id;
END;
$$;