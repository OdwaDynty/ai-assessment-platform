-- Lock down direct access to public.users (all access goes through our backend)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Function that creates a public.users row whenever a new auth.users row appears
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, supabase_id, email, role, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    'EDUCATOR',
    now(),
    now()
  )
  ON CONFLICT (supabase_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger that fires the function on every new signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();