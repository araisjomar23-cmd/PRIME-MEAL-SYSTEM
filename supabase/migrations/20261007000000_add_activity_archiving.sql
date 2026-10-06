ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE OR REPLACE FUNCTION public.prevent_archived_activity_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.activities
    WHERE id = NEW.activity_id
      AND archived_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'This activity has been archived and is no longer accepting registrations.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS registrations_reject_archived_activity ON public.registrations;
CREATE TRIGGER registrations_reject_archived_activity
BEFORE INSERT ON public.registrations
FOR EACH ROW
EXECUTE FUNCTION public.prevent_archived_activity_registration();
