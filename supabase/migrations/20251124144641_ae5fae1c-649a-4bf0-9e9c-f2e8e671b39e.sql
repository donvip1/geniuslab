-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Allow admins to upload documents
CREATE POLICY "Admins can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to view documents
CREATE POLICY "Admins can view documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete documents
CREATE POLICY "Admins can delete documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' AND
  has_role(auth.uid(), 'admin'::app_role)
);