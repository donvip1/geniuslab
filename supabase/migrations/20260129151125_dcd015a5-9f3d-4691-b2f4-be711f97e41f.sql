-- Create pin_batches table for tracking batch generations
CREATE TABLE public.pin_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text,
  pin_count integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);

-- Create access_pins table for storing individual PINs
CREATE TABLE public.access_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_code text UNIQUE NOT NULL,
  batch_id uuid NOT NULL REFERENCES public.pin_batches(id) ON DELETE CASCADE,
  is_used boolean DEFAULT false,
  used_by uuid,
  used_by_email text,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);

-- Add is_pin_required column to exam_settings
ALTER TABLE public.exam_settings
ADD COLUMN is_pin_required boolean DEFAULT false;

-- Enable RLS on both tables
ALTER TABLE public.pin_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_pins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pin_batches
CREATE POLICY "Admins can manage pin batches"
ON public.pin_batches
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for access_pins
CREATE POLICY "Admins can manage access pins"
ON public.access_pins
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own active pin"
ON public.access_pins
FOR SELECT
USING (auth.uid() = used_by);

CREATE POLICY "Users can activate unused pins"
ON public.access_pins
FOR UPDATE
USING (is_used = false AND used_by IS NULL)
WITH CHECK (auth.uid() = used_by);

-- Create index for faster PIN lookups
CREATE INDEX idx_access_pins_pin_code ON public.access_pins(pin_code);
CREATE INDEX idx_access_pins_used_by ON public.access_pins(used_by);
CREATE INDEX idx_access_pins_batch_id ON public.access_pins(batch_id);