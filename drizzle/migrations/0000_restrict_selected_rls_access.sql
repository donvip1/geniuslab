DROP POLICY IF EXISTS "Require authentication for user_roles" ON public.user_roles;

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Visitors can insert their own page views"
ON public.page_views
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Anyone can insert ad clicks" ON public.ad_clicks;
CREATE POLICY "Visitors can insert their own ad clicks"
ON public.ad_clicks
FOR INSERT
TO public
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Anyone can view ad images" ON storage.objects;
CREATE POLICY "Admins can list ad images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'advertisements'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);