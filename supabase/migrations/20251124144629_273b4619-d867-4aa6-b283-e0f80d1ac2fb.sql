-- Create admin_credentials table for username-based admin access
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin credentials
CREATE POLICY "Admins can view admin credentials"
ON public.admin_credentials
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create document_uploads table for tracking uploaded documents
CREATE TABLE public.document_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  extracted_text TEXT,
  questions_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

-- Admins can manage document uploads
CREATE POLICY "Admins can manage document uploads"
ON public.document_uploads
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on admin_credentials
CREATE TRIGGER update_admin_credentials_updated_at
BEFORE UPDATE ON public.admin_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on document_uploads
CREATE TRIGGER update_document_uploads_updated_at
BEFORE UPDATE ON public.document_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();