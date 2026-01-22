-- Create page_views table for tracking visitor activity
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  user_id UUID,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_user_id ON public.page_views(user_id);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Everyone can insert page views (for tracking)
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Admins can view all page views" 
ON public.page_views 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add click tracking columns to advertisements
ALTER TABLE public.advertisements 
ADD COLUMN click_count INTEGER NOT NULL DEFAULT 0;

-- Create ad_clicks table for detailed click tracking
CREATE TABLE public.ad_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for ad clicks
CREATE INDEX idx_ad_clicks_advertisement_id ON public.ad_clicks(advertisement_id);
CREATE INDEX idx_ad_clicks_created_at ON public.ad_clicks(created_at DESC);

-- Enable RLS
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert ad clicks
CREATE POLICY "Anyone can insert ad clicks" 
ON public.ad_clicks 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view ad clicks
CREATE POLICY "Admins can view all ad clicks" 
ON public.ad_clicks 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));