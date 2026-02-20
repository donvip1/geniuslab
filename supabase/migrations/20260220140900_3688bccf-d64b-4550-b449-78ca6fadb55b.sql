
-- =============================================
-- Phase 1: Core Restructuring Migration
-- =============================================

-- 1. Exam Categories
CREATE TABLE public.exam_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  monthly_price NUMERIC NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active exam categories"
  ON public.exam_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage exam categories"
  ON public.exam_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Nigerian Universities
CREATE TABLE public.nigerian_universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT,
  type TEXT NOT NULL DEFAULT 'federal',
  state TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nigerian_universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active universities"
  ON public.nigerian_universities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage universities"
  ON public.nigerian_universities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Subscription Plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_category_id UUID NOT NULL REFERENCES public.exam_categories(id),
  plan_type TEXT NOT NULL DEFAULT 'paystack',
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscription_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert subscriptions"
  ON public.subscription_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Payment Transactions
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_category_id UUID NOT NULL REFERENCES public.exam_categories(id),
  amount NUMERIC NOT NULL DEFAULT 1000,
  currency TEXT NOT NULL DEFAULT 'NGN',
  reference TEXT NOT NULL UNIQUE,
  paystack_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions"
  ON public.payment_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. User Trials
CREATE TABLE public.user_trials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_category_id UUID NOT NULL REFERENCES public.exam_categories(id),
  trial_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_used_today INTEGER NOT NULL DEFAULT 0,
  last_question_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exam_category_id)
);

ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own trials"
  ON public.user_trials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own trials"
  ON public.user_trials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trials"
  ON public.user_trials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all trials"
  ON public.user_trials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Alter subjects table
ALTER TABLE public.subjects
  ADD COLUMN semester TEXT,
  ADD COLUMN exam_category_id UUID REFERENCES public.exam_categories(id),
  ADD COLUMN department TEXT;

-- 7. Alter access_pins table
ALTER TABLE public.access_pins
  ADD COLUMN exam_category_id UUID REFERENCES public.exam_categories(id);

-- 8. Alter exam_settings table
ALTER TABLE public.exam_settings
  ADD COLUMN allow_semester_selection BOOLEAN NOT NULL DEFAULT true;

-- 9. Triggers for updated_at
CREATE TRIGGER update_exam_categories_updated_at
  BEFORE UPDATE ON public.exam_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Seed exam categories
INSERT INTO public.exam_categories (name, slug, description, icon_name, display_order) VALUES
  ('University CBT Exams', 'university-cbt', 'Practice CBT exams for Nigerian universities across all levels and semesters', 'GraduationCap', 1),
  ('JAMB UTME', 'jamb-utme', 'JAMB Unified Tertiary Matriculation Examination practice and mock tests', 'BookOpen', 2),
  ('WAEC', 'waec', 'West African Examinations Council practice exams', 'Award', 3),
  ('NECO', 'neco', 'National Examinations Council practice exams', 'FileText', 4),
  ('NABTEB', 'nabteb', 'National Business and Technical Examinations Board practice exams', 'Wrench', 5);

-- 11. Seed Nigerian universities (comprehensive list)
INSERT INTO public.nigerian_universities (name, abbreviation, type, state) VALUES
  -- Federal Universities
  ('University of Lagos', 'UNILAG', 'federal', 'Lagos'),
  ('University of Ibadan', 'UI', 'federal', 'Oyo'),
  ('University of Nigeria, Nsukka', 'UNN', 'federal', 'Enugu'),
  ('Ahmadu Bello University', 'ABU', 'federal', 'Kaduna'),
  ('Obafemi Awolowo University', 'OAU', 'federal', 'Osun'),
  ('University of Benin', 'UNIBEN', 'federal', 'Edo'),
  ('University of Ilorin', 'UNILORIN', 'federal', 'Kwara'),
  ('University of Port Harcourt', 'UNIPORT', 'federal', 'Rivers'),
  ('University of Calabar', 'UNICAL', 'federal', 'Cross River'),
  ('University of Jos', 'UNIJOS', 'federal', 'Plateau'),
  ('University of Maiduguri', 'UNIMAID', 'federal', 'Borno'),
  ('Bayero University Kano', 'BUK', 'federal', 'Kano'),
  ('Federal University of Technology, Akure', 'FUTA', 'federal', 'Ondo'),
  ('Federal University of Technology, Minna', 'FUTMINNA', 'federal', 'Niger'),
  ('Federal University of Technology, Owerri', 'FUTO', 'federal', 'Imo'),
  ('Nnamdi Azikiwe University', 'UNIZIK', 'federal', 'Anambra'),
  ('University of Abuja', 'UNIABUJA', 'federal', 'FCT'),
  ('University of Agriculture, Abeokuta', 'FUNAAB', 'federal', 'Ogun'),
  ('University of Agriculture, Makurdi', 'UAM', 'federal', 'Benue'),
  ('Michael Okpara University of Agriculture', 'MOUAU', 'federal', 'Abia'),
  ('Usmanu Danfodiyo University', 'UDUSOK', 'federal', 'Sokoto'),
  ('Abubakar Tafawa Balewa University', 'ATBU', 'federal', 'Bauchi'),
  ('Federal University Oye-Ekiti', 'FUOYE', 'federal', 'Ekiti'),
  ('Federal University Lokoja', 'FULOKOJA', 'federal', 'Kogi'),
  ('Federal University Lafia', 'FULAFIA', 'federal', 'Nasarawa'),
  ('Federal University Dutse', 'FUD', 'federal', 'Jigawa'),
  ('Federal University Dutsin-Ma', 'FUDMA', 'federal', 'Katsina'),
  ('Federal University Kashere', 'FUKASHERE', 'federal', 'Gombe'),
  ('Federal University Wukari', 'FUWUKARI', 'federal', 'Taraba'),
  ('Federal University Ndufu-Alike', 'FUNAI', 'federal', 'Ebonyi'),
  ('Federal University Gashua', 'FUGASHUA', 'federal', 'Yobe'),
  ('Federal University Gusau', 'FUGUSAU', 'federal', 'Zamfara'),
  ('Federal University Birnin-Kebbi', 'FUBK', 'federal', 'Kebbi'),
  ('Nigerian Defence Academy', 'NDA', 'federal', 'Kaduna'),
  ('Nigerian Police Academy', 'POLAC', 'federal', 'Kano'),
  ('National Open University of Nigeria', 'NOUN', 'federal', 'Lagos'),
  ('Air Force Institute of Technology', 'AFIT', 'federal', 'Kaduna'),
  ('Federal University of Health Sciences, Otukpo', 'FUHSO', 'federal', 'Benue'),
  ('Federal University of Health Sciences, Azare', 'FUHSA', 'federal', 'Bauchi'),
  ('Federal University of Health Sciences, Ila Orangun', 'FUHSI', 'federal', 'Osun'),
  -- State Universities
  ('Lagos State University', 'LASU', 'state', 'Lagos'),
  ('Rivers State University', 'RSU', 'state', 'Rivers'),
  ('Delta State University', 'DELSU', 'state', 'Delta'),
  ('Enugu State University of Science and Technology', 'ESUT', 'state', 'Enugu'),
  ('Imo State University', 'IMSU', 'state', 'Imo'),
  ('Abia State University', 'ABSU', 'state', 'Abia'),
  ('Anambra State University', 'ANSU', 'state', 'Anambra'),
  ('Ambrose Alli University', 'AAU', 'state', 'Edo'),
  ('Benue State University', 'BSU', 'state', 'Benue'),
  ('Cross River University of Technology', 'CRUTECH', 'state', 'Cross River'),
  ('Ekiti State University', 'EKSU', 'state', 'Ekiti'),
  ('Kaduna State University', 'KASU', 'state', 'Kaduna'),
  ('Kano University of Science and Technology', 'KUST', 'state', 'Kano'),
  ('Kebbi State University of Science and Technology', 'KSUSTA', 'state', 'Kebbi'),
  ('Kwara State University', 'KWASU', 'state', 'Kwara'),
  ('Ladoke Akintola University of Technology', 'LAUTECH', 'state', 'Oyo'),
  ('Nasarawa State University', 'NSUK', 'state', 'Nasarawa'),
  ('Olabisi Onabanjo University', 'OOU', 'state', 'Ogun'),
  ('Ondo State University of Science and Technology', 'OSUSTECH', 'state', 'Ondo'),
  ('Osun State University', 'UNIOSUN', 'state', 'Osun'),
  ('Plateau State University', 'PLASU', 'state', 'Plateau'),
  ('Sokoto State University', 'SSU', 'state', 'Sokoto'),
  ('Taraba State University', 'TSU', 'state', 'Taraba'),
  ('Adamawa State University', 'ADSU', 'state', 'Adamawa'),
  ('Bayelsa Medical University', 'BMU', 'state', 'Bayelsa'),
  ('Edo State University', 'EDSU', 'state', 'Edo'),
  ('Gombe State University', 'GSU', 'state', 'Gombe'),
  ('Ibrahim Badamasi Babangida University', 'IBBU', 'state', 'Niger'),
  ('Kogi State University', 'KSU', 'state', 'Kogi'),
  ('Yobe State University', 'YSU', 'state', 'Yobe'),
  ('Zamfara State University', 'ZSU', 'state', 'Zamfara'),
  ('Akwa Ibom State University', 'AKSU', 'state', 'Akwa Ibom'),
  ('Ebonyi State University', 'EBSU', 'state', 'Ebonyi'),
  ('Niger Delta University', 'NDU', 'state', 'Bayelsa'),
  ('Tai Solarin University of Education', 'TASUED', 'state', 'Ogun'),
  ('University of Africa, Toru-Orua', 'UAT', 'state', 'Bayelsa'),
  -- Polytechnics
  ('Yaba College of Technology', 'YABATECH', 'polytechnic', 'Lagos'),
  ('Federal Polytechnic Ilaro', 'FEDPOLYILARO', 'polytechnic', 'Ogun'),
  ('Auchi Polytechnic', 'AUCHIPOLY', 'polytechnic', 'Edo'),
  ('Federal Polytechnic Nekede', 'FEDPOLYNEKEDE', 'polytechnic', 'Imo'),
  ('Kaduna Polytechnic', 'KADPOLY', 'polytechnic', 'Kaduna'),
  ('Lagos State Polytechnic', 'LASPOTECH', 'polytechnic', 'Lagos'),
  ('The Polytechnic Ibadan', 'POLYIBADAN', 'polytechnic', 'Oyo'),
  ('Federal Polytechnic Ado-Ekiti', 'FEDPOLYADO', 'polytechnic', 'Ekiti'),
  ('Federal Polytechnic Bida', 'FEDPOLYBIDA', 'polytechnic', 'Niger'),
  ('Federal Polytechnic Bauchi', 'FEDPOLYBAUCHI', 'polytechnic', 'Bauchi'),
  ('Federal Polytechnic Offa', 'FEDPOLYOFFA', 'polytechnic', 'Kwara'),
  ('Rufus Giwa Polytechnic', 'RUGIPO', 'polytechnic', 'Ondo'),
  ('Federal Polytechnic Oko', 'FEDPOLYOKO', 'polytechnic', 'Anambra'),
  ('Institute of Management and Technology', 'IMT', 'polytechnic', 'Enugu'),
  ('Kwara State Polytechnic', 'KWARAPOLY', 'polytechnic', 'Kwara'),
  ('Moshood Abiola Polytechnic', 'MAPOLY', 'polytechnic', 'Ogun'),
  ('Delta State Polytechnic Ogwashi-Uku', 'DSPG', 'polytechnic', 'Delta'),
  ('Akwa Ibom State Polytechnic', 'AKWAPOLY', 'polytechnic', 'Akwa Ibom'),
  -- Colleges of Education
  ('Federal College of Education, Zaria', 'FCEZARIA', 'college', 'Kaduna'),
  ('Adeniran Ogunsanya College of Education', 'AOCOED', 'college', 'Lagos'),
  ('Federal College of Education, Abeokuta', 'FCEABEOKUTA', 'college', 'Ogun'),
  ('Federal College of Education (Technical), Akoka', 'FCETAKOKA', 'college', 'Lagos'),
  ('Alvan Ikoku Federal College of Education', 'AIFCE', 'college', 'Imo'),
  ('Federal College of Education, Obudu', 'FCEOBUDU', 'college', 'Cross River'),
  ('Federal College of Education, Kontagora', 'FCEKONTAGORA', 'college', 'Niger'),
  ('National Teachers Institute', 'NTI', 'college', 'Kaduna');
