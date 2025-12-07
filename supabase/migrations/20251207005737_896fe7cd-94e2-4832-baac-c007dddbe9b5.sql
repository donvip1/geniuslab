-- Fix the security definer view issue by setting SECURITY INVOKER
ALTER VIEW public.questions_public SET (security_invoker = on);