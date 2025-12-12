-- Create exam_settings table to store exam mode configuration
CREATE TABLE public.exam_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_exam_mode boolean NOT NULL DEFAULT false,
  exam_duration_minutes integer NOT NULL DEFAULT 15,
  exam_start_time timestamp with time zone,
  exam_end_time timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view exam settings (students need to know the time)
CREATE POLICY "Everyone can view exam settings"
ON public.exam_settings
FOR SELECT
USING (true);

-- Only admins can manage exam settings
CREATE POLICY "Admins can manage exam settings"
ON public.exam_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings row
INSERT INTO public.exam_settings (is_exam_mode, exam_duration_minutes)
VALUES (false, 15);

-- Add trigger for updated_at
CREATE TRIGGER update_exam_settings_updated_at
BEFORE UPDATE ON public.exam_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();