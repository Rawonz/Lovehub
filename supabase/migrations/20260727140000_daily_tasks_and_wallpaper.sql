/*
# Daily Tasks + Wallpaper

Adds:
1. `daily_tasks` — a couple-scoped daily checklist/to-do table (e.g. "Günlük Görevler").
2. `wallpaper` column on `couples` — a shared background theme both partners see
   inside the app (Settings > Preferences > Wallpaper).

All statements are idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS), matching
the style of the previous migrations in this project.
*/

-- ============================================================
-- couples.wallpaper (shared background for the couple)
-- ============================================================
ALTER TABLE public.couples
  ADD COLUMN IF NOT EXISTS wallpaper text NOT NULL DEFAULT 'default'
  CHECK (wallpaper IN ('default', 'sunset', 'ocean', 'blossom', 'midnight', 'forest'));

-- ============================================================
-- daily_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  task_date date NOT NULL DEFAULT current_date,
  is_done boolean NOT NULL DEFAULT false,
  done_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  done_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_daily_tasks_couple_date ON public.daily_tasks(couple_id, task_date);

DROP POLICY IF EXISTS "select_daily_tasks" ON public.daily_tasks;
CREATE POLICY "select_daily_tasks" ON public.daily_tasks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = daily_tasks.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_daily_tasks" ON public.daily_tasks;
CREATE POLICY "insert_daily_tasks" ON public.daily_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = author_id
  );

DROP POLICY IF EXISTS "update_daily_tasks" ON public.daily_tasks;
CREATE POLICY "update_daily_tasks" ON public.daily_tasks
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = daily_tasks.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_daily_tasks" ON public.daily_tasks;
CREATE POLICY "delete_daily_tasks" ON public.daily_tasks
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = daily_tasks.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_daily_tasks_updated_at ON public.daily_tasks;
CREATE TRIGGER trg_daily_tasks_updated_at
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
