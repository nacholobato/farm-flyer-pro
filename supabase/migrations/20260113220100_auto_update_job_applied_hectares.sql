-- Auto-update job's superficie_aplicada_has from operational attendance records
-- This trigger automatically calculates and updates the "hectáreas aplicadas" 
-- whenever attendance records are added, updated, or deleted

-- Function to update job's superficie_aplicada_has
CREATE OR REPLACE FUNCTION public.update_job_applied_hectares()
RETURNS TRIGGER AS $$
DECLARE
  v_job_id UUID;
  v_total_hectares NUMERIC(10,2);
BEGIN
  -- Determine which job_id to update
  IF (TG_OP = 'DELETE') THEN
    v_job_id := OLD.job_id;
  ELSE
    v_job_id := NEW.job_id;
  END IF;
  
  -- Calculate total hectares for this job from all attendance records
  SELECT COALESCE(SUM(hectares_done), 0)
  INTO v_total_hectares
  FROM public.operational_attendance
  WHERE job_id = v_job_id;
  
  -- Update the job's superficie_aplicada_has
  UPDATE public.jobs
  SET superficie_aplicada_has = v_total_hectares
  WHERE id = v_job_id;
  
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update job applied hectares
CREATE TRIGGER update_job_applied_hectares_on_attendance
  AFTER INSERT OR UPDATE OF hectares_done OR DELETE ON public.operational_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_applied_hectares();

-- Also handle when job_id changes in an attendance record
CREATE OR REPLACE FUNCTION public.update_job_applied_hectares_on_job_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If job_id changed, update both old and new jobs
  IF (OLD.job_id IS DISTINCT FROM NEW.job_id) THEN
    -- Update old job
    UPDATE public.jobs
    SET superficie_aplicada_has = (
      SELECT COALESCE(SUM(hectares_done), 0)
      FROM public.operational_attendance
      WHERE job_id = OLD.job_id
    )
    WHERE id = OLD.job_id;
    
    -- Update new job
    UPDATE public.jobs
    SET superficie_aplicada_has = (
      SELECT COALESCE(SUM(hectares_done), 0)
      FROM public.operational_attendance
      WHERE job_id = NEW.job_id
    )
    WHERE id = NEW.job_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for job_id changes
CREATE TRIGGER update_both_jobs_on_attendance_job_change
  AFTER UPDATE OF job_id ON public.operational_attendance
  FOR EACH ROW
  WHEN (OLD.job_id IS DISTINCT FROM NEW.job_id)
  EXECUTE FUNCTION public.update_job_applied_hectares_on_job_change();

-- Add comment for documentation
COMMENT ON FUNCTION public.update_job_applied_hectares() IS 
  'Auto-updates job superficie_aplicada_has by summing hectares_done from all related operational_attendance records';

COMMENT ON FUNCTION public.update_job_applied_hectares_on_job_change() IS 
  'Handles updating both old and new jobs when attendance record job_id is changed';
