-- Create job status enum
CREATE TYPE public.job_status AS ENUM ('pending', 'in_progress', 'done');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create farms table
CREATE TABLE public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  area_hectares NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task TEXT,
  application_dose TEXT,
  start_date DATE,
  due_date DATE,
  status public.job_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agrochemicals_used table
CREATE TABLE public.agrochemicals_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  dose NUMERIC(10,3) NOT NULL,
  unit TEXT NOT NULL,
  application_order INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agrochemicals_used ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients policies
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE USING (auth.uid() = user_id);

-- Farms policies (through client ownership)
CREATE POLICY "Users can view farms of own clients" ON public.farms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = farms.client_id AND clients.user_id = auth.uid())
  );

CREATE POLICY "Users can insert farms for own clients" ON public.farms
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = farms.client_id AND clients.user_id = auth.uid())
  );

CREATE POLICY "Users can update farms of own clients" ON public.farms
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = farms.client_id AND clients.user_id = auth.uid())
  );

CREATE POLICY "Users can delete farms of own clients" ON public.farms
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.clients WHERE clients.id = farms.client_id AND clients.user_id = auth.uid())
  );

-- Jobs policies
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Agrochemicals policies (through job ownership)
CREATE POLICY "Users can view agrochemicals of own jobs" ON public.agrochemicals_used
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = agrochemicals_used.job_id AND jobs.user_id = auth.uid())
  );

CREATE POLICY "Users can insert agrochemicals for own jobs" ON public.agrochemicals_used
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = agrochemicals_used.job_id AND jobs.user_id = auth.uid())
  );

CREATE POLICY "Users can update agrochemicals of own jobs" ON public.agrochemicals_used
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = agrochemicals_used.job_id AND jobs.user_id = auth.uid())
  );

CREATE POLICY "Users can delete agrochemicals of own jobs" ON public.agrochemicals_used
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = agrochemicals_used.job_id AND jobs.user_id = auth.uid())
  );

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_farms_updated_at
  BEFORE UPDATE ON public.farms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();