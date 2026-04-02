-- Create role enum if not exists
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'counselor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_roles if not exists
DO $$ BEGIN
  CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create counselor_responses table
CREATE TABLE IF NOT EXISTS public.counselor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  counselor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_read BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.counselor_responses ENABLE ROW LEVEL SECURITY;

-- Students can view their own responses
DO $$ BEGIN
  CREATE POLICY "Students can view their own responses"
  ON public.counselor_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Counselors can insert responses
DO $$ BEGIN
  CREATE POLICY "Counselors can create responses"
  ON public.counselor_responses FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'counselor'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Counselors can view all responses
DO $$ BEGIN
  CREATE POLICY "Counselors can view all responses"
  ON public.counselor_responses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'counselor'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Students can update read status
DO $$ BEGIN
  CREATE POLICY "Students can update read status"
  ON public.counselor_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_counselor_responses_student_id ON public.counselor_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_counselor_responses_created_at ON public.counselor_responses(created_at DESC);