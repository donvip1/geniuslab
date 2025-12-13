-- Allow admins to delete exam attempts (for clearing results feature)
CREATE POLICY "Admins can delete all attempts" 
ON public.exam_attempts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));