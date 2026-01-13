-- Create operational attendance system tables and RLS policies
-- Author: Antigravity AI
-- Date: 2026-01-12

-- 1. Create staff_role enum
CREATE TYPE public.staff_role AS ENUM ('pilot', 'assistant');

-- 2. Create activity_type enum
CREATE TYPE public.activity_type AS ENUM ('spraying', 'mapping', 'scouting');

-- 3. Create work_teams table
CREATE TABLE public.work_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role public.staff_role NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create drones table
CREATE TABLE public.drones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  serial_number TEXT,
  total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create generators table
CREATE TABLE public.generators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  internal_code TEXT,
  total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create operational_attendance table
CREATE TABLE public.operational_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  activity_type public.activity_type,
  pilot_id UUID REFERENCES public.work_teams(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES public.work_teams(id) ON DELETE SET NULL,
  drone_id UUID REFERENCES public.drones(id) ON DELETE SET NULL,
  generator_id UUID REFERENCES public.generators(id) ON DELETE SET NULL,
  gen_usage_hours NUMERIC(5,2),
  hectares_done NUMERIC(10,2),
  agronomic_obs TEXT,
  technical_obs TEXT,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Enable RLS on all new tables
ALTER TABLE public.work_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_attendance ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for work_teams
CREATE POLICY "Users can view organization work teams"
ON public.work_teams
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert organization work teams"
ON public.work_teams
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update organization work teams"
ON public.work_teams
FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete organization work teams"
ON public.work_teams
FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 9. Create RLS policies for drones
CREATE POLICY "Users can view organization drones"
ON public.drones
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert organization drones"
ON public.drones
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update organization drones"
ON public.drones
FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete organization drones"
ON public.drones
FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 10. Create RLS policies for generators
CREATE POLICY "Users can view organization generators"
ON public.generators
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert organization generators"
ON public.generators
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update organization generators"
ON public.generators
FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete organization generators"
ON public.generators
FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 11. Create RLS policies for operational_attendance
CREATE POLICY "Users can view organization attendance"
ON public.operational_attendance
FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert organization attendance"
ON public.operational_attendance
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update organization attendance"
ON public.operational_attendance
FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can delete organization attendance"
ON public.operational_attendance
FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- 12. Create triggers for updated_at
CREATE TRIGGER set_work_teams_updated_at
  BEFORE UPDATE ON public.work_teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_drones_updated_at
  BEFORE UPDATE ON public.drones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_generators_updated_at
  BEFORE UPDATE ON public.generators
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_operational_attendance_updated_at
  BEFORE UPDATE ON public.operational_attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. Create function to update drone hours
CREATE OR REPLACE FUNCTION public.update_drone_total_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_drone_id UUID;
  v_old_hours NUMERIC(5,2);
  v_new_hours NUMERIC(5,2);
BEGIN
  -- Determine which drone_id to update based on operation
  IF (TG_OP = 'DELETE') THEN
    v_drone_id := OLD.drone_id;
    v_old_hours := COALESCE(OLD.gen_usage_hours, 0);
    v_new_hours := 0;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Handle drone_id change
    IF (OLD.drone_id IS DISTINCT FROM NEW.drone_id) THEN
      -- Subtract from old drone
      IF (OLD.drone_id IS NOT NULL) THEN
        UPDATE public.drones
        SET total_hours = GREATEST(0, total_hours - COALESCE(OLD.gen_usage_hours, 0))
        WHERE id = OLD.drone_id;
      END IF;
      -- Add to new drone
      IF (NEW.drone_id IS NOT NULL) THEN
        UPDATE public.drones
        SET total_hours = total_hours + COALESCE(NEW.gen_usage_hours, 0)
        WHERE id = NEW.drone_id;
      END IF;
      RETURN NEW;
    END IF;
    
    v_drone_id := NEW.drone_id;
    v_old_hours := COALESCE(OLD.gen_usage_hours, 0);
    v_new_hours := COALESCE(NEW.gen_usage_hours, 0);
  ELSE -- INSERT
    v_drone_id := NEW.drone_id;
    v_old_hours := 0;
    v_new_hours := COALESCE(NEW.gen_usage_hours, 0);
  END IF;

  -- Update drone total_hours if drone_id exists
  IF (v_drone_id IS NOT NULL) THEN
    UPDATE public.drones
    SET total_hours = GREATEST(0, total_hours - v_old_hours + v_new_hours)
    WHERE id = v_drone_id;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14. Create function to update generator hours
CREATE OR REPLACE FUNCTION public.update_generator_total_hours()
RETURNS TRIGGER AS $$
DECLARE
  v_generator_id UUID;
  v_old_hours NUMERIC(5,2);
  v_new_hours NUMERIC(5,2);
BEGIN
  -- Determine which generator_id to update based on operation
  IF (TG_OP = 'DELETE') THEN
    v_generator_id := OLD.generator_id;
    v_old_hours := COALESCE(OLD.gen_usage_hours, 0);
    v_new_hours := 0;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Handle generator_id change
    IF (OLD.generator_id IS DISTINCT FROM NEW.generator_id) THEN
      -- Subtract from old generator
      IF (OLD.generator_id IS NOT NULL) THEN
        UPDATE public.generators
        SET total_hours = GREATEST(0, total_hours - COALESCE(OLD.gen_usage_hours, 0))
        WHERE id = OLD.generator_id;
      END IF;
      -- Add to new generator
      IF (NEW.generator_id IS NOT NULL) THEN
        UPDATE public.generators
        SET total_hours = total_hours + COALESCE(NEW.gen_usage_hours, 0)
        WHERE id = NEW.generator_id;
      END IF;
      RETURN NEW;
    END IF;
    
    v_generator_id := NEW.generator_id;
    v_old_hours := COALESCE(OLD.gen_usage_hours, 0);
    v_new_hours := COALESCE(NEW.gen_usage_hours, 0);
  ELSE -- INSERT
    v_generator_id := NEW.generator_id;
    v_old_hours := 0;
    v_new_hours := COALESCE(NEW.gen_usage_hours, 0);
  END IF;

  -- Update generator total_hours if generator_id exists
  IF (v_generator_id IS NOT NULL) THEN
    UPDATE public.generators
    SET total_hours = GREATEST(0, total_hours - v_old_hours + v_new_hours)
    WHERE id = v_generator_id;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. Create triggers for auto-updating equipment hours
CREATE TRIGGER update_drone_hours_on_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.operational_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_drone_total_hours();

CREATE TRIGGER update_generator_hours_on_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.operational_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_generator_total_hours();

-- 16. Create function to calculate hectares validation
CREATE OR REPLACE FUNCTION public.get_job_hectares_summary(p_job_id UUID)
RETURNS TABLE (
  total_hectares_done NUMERIC,
  job_theoretical_hectares NUMERIC,
  job_applied_hectares NUMERIC,
  exceeds_theoretical BOOLEAN,
  exceeds_applied BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(oa.hectares_done), 0) as total_hectares_done,
    j.superficie_teorica_has as job_theoretical_hectares,
    j.superficie_aplicada_has as job_applied_hectares,
    CASE 
      WHEN j.superficie_teorica_has IS NOT NULL THEN 
        COALESCE(SUM(oa.hectares_done), 0) > j.superficie_teorica_has
      ELSE false
    END as exceeds_theoretical,
    CASE 
      WHEN j.superficie_aplicada_has IS NOT NULL THEN 
        COALESCE(SUM(oa.hectares_done), 0) > j.superficie_aplicada_has
      ELSE false
    END as exceeds_applied
  FROM public.jobs j
  LEFT JOIN public.operational_attendance oa ON oa.job_id = j.id
  WHERE j.id = p_job_id
  GROUP BY j.id, j.superficie_teorica_has, j.superficie_aplicada_has;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 17. Create indexes for better query performance
CREATE INDEX idx_work_teams_organization_id ON public.work_teams(organization_id);
CREATE INDEX idx_work_teams_role ON public.work_teams(role);
CREATE INDEX idx_drones_organization_id ON public.drones(organization_id);
CREATE INDEX idx_generators_organization_id ON public.generators(organization_id);
CREATE INDEX idx_operational_attendance_organization_id ON public.operational_attendance(organization_id);
CREATE INDEX idx_operational_attendance_job_id ON public.operational_attendance(job_id);
CREATE INDEX idx_operational_attendance_start_date ON public.operational_attendance(start_date);
CREATE INDEX idx_operational_attendance_pilot_id ON public.operational_attendance(pilot_id);
CREATE INDEX idx_operational_attendance_assistant_id ON public.operational_attendance(assistant_id);
CREATE INDEX idx_operational_attendance_drone_id ON public.operational_attendance(drone_id);
CREATE INDEX idx_operational_attendance_generator_id ON public.operational_attendance(generator_id);
