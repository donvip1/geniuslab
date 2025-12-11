-- Create team_experts table for managing team members
CREATE TABLE public.team_experts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  alias text,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_experts ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_experts
CREATE POLICY "Everyone can view active team experts"
ON public.team_experts
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage team experts"
ON public.team_experts
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create success_stories table for managing testimonials
CREATE TABLE public.success_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name text NOT NULL,
  program text NOT NULL,
  image_url text,
  quote text NOT NULL,
  quote_author text,
  review text NOT NULL,
  color_theme text NOT NULL DEFAULT 'emerald',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- RLS policies for success_stories
CREATE POLICY "Everyone can view active success stories"
ON public.success_stories
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage success stories"
ON public.success_stories
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_team_experts_updated_at
BEFORE UPDATE ON public.team_experts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_success_stories_updated_at
BEFORE UPDATE ON public.success_stories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default team experts data
INSERT INTO public.team_experts (name, alias, title, description, image_url, display_order) VALUES
('Etim Enefiok Nsisong', 'Colossus', 'Data Scientist & Academic Tutor', 'He is a third-year (300 Level) student at the Federal University Oye-Ekiti (FUOYE), currently pursuing a degree in the Department of Science Laboratory Technology. As an accomplished Data Scientist and passionate Academic Tutor, he has established himself as a prominent figure in both the data science and educational spheres. Affectionately known as "Colossus", he is celebrated for his commanding presence and vast reservoir of knowledge. Outside of his academic and professional commitments, He is an ardent advocate for mental wellness and personal development among the student community, believing strongly in the holistic growth of individuals beyond mere academic achievement.', NULL, 1),
('Alabi Kolapo Joshua', 'Green Arrow', 'Full Stack Developer & Academic Tutor', 'A 300-level student of the Department of Physics at the Federal University of Oye-Ekiti (FUOYE), Alabi Kolapo Joshua is a distinguished Full-Stack Developer and Academic Tutor known for his precision and sharp intellect—traits that earned him the moniker "Green Arrow." He is the former Faculty Representative of the National Association of Science Students (NASS) for the Faculty of Science, where he demonstrated exceptional leadership and commitment to student welfare. In addition to his academic and professional pursuits, he is a strong advocate for academic excellence and community development within the student body.', NULL, 2),
('Joel Oludipe Olamide', 'Mathlete', 'Mathematics Expert & Academic Tutor', 'A 300-level student of the Department of Mathematics at the Federal University of Oye-Ekiti (FUOYE), Joel Oludipe Olamide is a passionate Mathematics Expert and Academic Tutor. Known as "Mathlete" for his exceptional problem-solving abilities and love for numbers, he has distinguished himself as a leading figure in mathematical education. He serves as the Pioneer Vice President of the Faculty of Physical Sciences and holds the position of Public Relations Officer (PRO) at the National Association of Mathematics Students (NAMSSN). His dedication to academic excellence and student development has made him a respected mentor among his peers.', NULL, 3),
('Adeyeye Kehinde David', 'Son of God', 'Biology Expert & Academic Tutor', 'A 300-level student biologist from the Department of Animal and Environmental Biology at FUOYE. He is presently the Public Relations Officer of the Faculty of Life Sciences. A leader equipped with the passion for teaching and has been distributing knowledge since time past.', NULL, 4);

-- Insert default success stories data
INSERT INTO public.success_stories (student_name, program, quote, quote_author, review, color_theme, display_order) VALUES
('Emmanuel Okunlola', 'Nursing Department, FUOYE', 'The tutorials transformed my understanding of core subjects.', 'Emmanuel Okunlola', 'Success they say comes with determination and perseverance. I''m Emmanuel Okunlola from the Nursing Department FUOYE. The tutorials transformed my understanding of core subjects. In 100 level I made a CGPA of 4.56 and in 200 level I made a CGPA of 4.82. The expert tutors here don''t just teach - they mentor you for life.', 'emerald', 1),
('Blessing Idoko', '200L Nursing Student', 'GeniusLab helped me achieve academic excellence beyond my expectations.', 'Blessing Idoko', 'I''m Blessing Idoko, a 200L Nursing student. GeniusLab helped me achieve academic excellence beyond my expectations. The personalized attention and comprehensive study materials made all the difference. I went from struggling with core courses to consistently scoring high grades. The tutors are patient, knowledgeable, and truly care about student success.', 'blue', 2),
('Marvelous Adekunle', '300L Science Lab Tech', 'The structured approach to learning at GeniusLab is unmatched.', 'Marvelous Adekunle', 'As a 300L Science Lab Tech student, I can confidently say that the structured approach to learning at GeniusLab is unmatched. The tutors break down complex concepts into digestible bits. My academic performance improved significantly, and I gained confidence in subjects I once feared. Highly recommend to any serious student!', 'purple', 3);