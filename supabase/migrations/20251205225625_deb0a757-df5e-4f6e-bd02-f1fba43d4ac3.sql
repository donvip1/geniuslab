-- Create storage bucket for advertisement images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('advertisements', 'advertisements', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Anyone can view ad images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'advertisements');

-- Create policy for admin uploads
CREATE POLICY "Admins can upload ad images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));

-- Create policy for admin deletes
CREATE POLICY "Admins can delete ad images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));