/*
# LoveHub Core Schema (fix pass)

Re-applies the corrected core schema for LoveHub by RawonzEXE.
See 0001_lovehub_core_schema for the full design. This pass fixes two
garbled policy statements (insert_gifts, insert_ai_msg) that caused a
syntax error. All statements are idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).
*/

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en','tr','az')),
  theme text NOT NULL DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  partner_searching boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- couples
-- ============================================================
CREATE TABLE IF NOT EXISTS public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anniversary_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT couples_distinct_users CHECK (user_id_1 <> user_id_2)
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_couples_user1 ON public.couples(user_id_1);
CREATE INDEX IF NOT EXISTS idx_couples_user2 ON public.couples(user_id_2);
CREATE INDEX IF NOT EXISTS idx_couples_users_unique ON public.couples(least(user_id_1,user_id_2), greatest(user_id_1,user_id_2));

DROP POLICY IF EXISTS "select_own_couple" ON public.couples;
CREATE POLICY "select_own_couple" ON public.couples
  FOR SELECT TO authenticated USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP POLICY IF EXISTS "insert_own_couple" ON public.couples;
CREATE POLICY "insert_own_couple" ON public.couples
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP POLICY IF EXISTS "update_own_couple" ON public.couples;
CREATE POLICY "update_own_couple" ON public.couples
  FOR UPDATE TO authenticated USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP POLICY IF EXISTS "delete_own_couple" ON public.couples;
CREATE POLICY "delete_own_couple" ON public.couples
  FOR DELETE TO authenticated USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP TRIGGER IF EXISTS trg_couples_updated_at ON public.couples;
CREATE TRIGGER trg_couples_updated_at
  BEFORE UPDATE ON public.couples
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_couple_member(couple_row public.couples)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = couple_row.user_id_1 OR auth.uid() = couple_row.user_id_2;
$$;

-- ============================================================
-- couple_invitations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.couple_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  couple_id uuid REFERENCES public.couples(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.couple_invitations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.couple_invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_inviter ON public.couple_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.couple_invitations(status);

DROP POLICY IF EXISTS "select_invitations" ON public.couple_invitations;
CREATE POLICY "select_invitations" ON public.couple_invitations
  FOR SELECT TO authenticated
  USING (
    auth.uid() = inviter_id
    OR auth.uid() = invitee_id
    OR (status = 'pending' AND expires_at > now())
  );

DROP POLICY IF EXISTS "insert_invitations" ON public.couple_invitations;
CREATE POLICY "insert_invitations" ON public.couple_invitations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "update_invitations" ON public.couple_invitations;
CREATE POLICY "update_invitations" ON public.couple_invitations
  FOR UPDATE TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id OR status = 'pending')
  WITH CHECK (auth.uid() = inviter_id OR auth.uid() = invitee_id);

DROP POLICY IF EXISTS "delete_invitations" ON public.couple_invitations;
CREATE POLICY "delete_invitations" ON public.couple_invitations
  FOR DELETE TO authenticated USING (auth.uid() = inviter_id);

DROP TRIGGER IF EXISTS trg_invitations_updated_at ON public.couple_invitations;
CREATE TRIGGER trg_invitations_updated_at
  BEFORE UPDATE ON public.couple_invitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- timeline_events
-- ============================================================
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  category text NOT NULL DEFAULT 'milestone' CHECK (category IN ('milestone','trip','date','photo','note','other')),
  cover_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_timeline_couple_date ON public.timeline_events(couple_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_author ON public.timeline_events(author_id);

DROP POLICY IF EXISTS "select_timeline" ON public.timeline_events;
CREATE POLICY "select_timeline" ON public.timeline_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = timeline_events.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_timeline" ON public.timeline_events;
CREATE POLICY "insert_timeline" ON public.timeline_events
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = author_id
  );

DROP POLICY IF EXISTS "update_timeline" ON public.timeline_events;
CREATE POLICY "update_timeline" ON public.timeline_events
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = timeline_events.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_timeline" ON public.timeline_events;
CREATE POLICY "delete_timeline" ON public.timeline_events
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = timeline_events.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_timeline_updated_at ON public.timeline_events;
CREATE TRIGGER trg_timeline_updated_at
  BEFORE UPDATE ON public.timeline_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- memories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  caption text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','video')),
  location text,
  taken_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_memories_couple_created ON public.memories(couple_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_author ON public.memories(author_id);

DROP POLICY IF EXISTS "select_memories" ON public.memories;
CREATE POLICY "select_memories" ON public.memories
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = memories.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_memories" ON public.memories;
CREATE POLICY "insert_memories" ON public.memories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = author_id
  );

DROP POLICY IF EXISTS "update_memories" ON public.memories;
CREATE POLICY "update_memories" ON public.memories
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = memories.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_memories" ON public.memories;
CREATE POLICY "delete_memories" ON public.memories
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = memories.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_memories_updated_at ON public.memories;
CREATE TRIGGER trg_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- love_map_locations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.love_map_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  category text NOT NULL DEFAULT 'special' CHECK (category IN ('special','first_date','trip','restaurant','home','other')),
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.love_map_locations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lovemap_couple ON public.love_map_locations(couple_id);

DROP POLICY IF EXISTS "select_lovemap" ON public.love_map_locations;
CREATE POLICY "select_lovemap" ON public.love_map_locations
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = love_map_locations.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_lovemap" ON public.love_map_locations;
CREATE POLICY "insert_lovemap" ON public.love_map_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = author_id
  );

DROP POLICY IF EXISTS "update_lovemap" ON public.love_map_locations;
CREATE POLICY "update_lovemap" ON public.love_map_locations
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = love_map_locations.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_lovemap" ON public.love_map_locations;
CREATE POLICY "delete_lovemap" ON public.love_map_locations
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = love_map_locations.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_lovemap_updated_at ON public.love_map_locations;
CREATE TRIGGER trg_lovemap_updated_at
  BEFORE UPDATE ON public.love_map_locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- date_plans
-- ============================================================
CREATE TABLE IF NOT EXISTS public.date_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','planned','completed','cancelled')),
  location text,
  budget_estimate integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_dates_couple_scheduled ON public.date_plans(couple_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_dates_status ON public.date_plans(status);

DROP POLICY IF EXISTS "select_dates" ON public.date_plans;
CREATE POLICY "select_dates" ON public.date_plans
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = date_plans.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_dates" ON public.date_plans;
CREATE POLICY "insert_dates" ON public.date_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = author_id
  );

DROP POLICY IF EXISTS "update_dates" ON public.date_plans;
CREATE POLICY "update_dates" ON public.date_plans
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = date_plans.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_dates" ON public.date_plans;
CREATE POLICY "delete_dates" ON public.date_plans
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = date_plans.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_dates_updated_at ON public.date_plans;
CREATE TRIGGER trg_dates_updated_at
  BEFORE UPDATE ON public.date_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- gift_suggestions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gift_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient text NOT NULL CHECK (recipient IN ('partner','me')),
  name text NOT NULL,
  description text,
  occasion text,
  budget_estimate integer,
  link_url text,
  status text NOT NULL DEFAULT 'idea' CHECK (status IN ('idea','purchased','given','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gift_suggestions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_gifts_couple ON public.gift_suggestions(couple_id);
CREATE INDEX IF NOT EXISTS idx_gifts_status ON public.gift_suggestions(status);

DROP POLICY IF EXISTS "select_gifts" ON public.gift_suggestions;
CREATE POLICY "select_gifts" ON public.gift_suggestions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = gift_suggestions.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_gifts" ON public.gift_suggestions;
CREATE POLICY "insert_gifts" ON public.gift_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = author_id
  );

DROP POLICY IF EXISTS "update_gifts" ON public.gift_suggestions;
CREATE POLICY "update_gifts" ON public.gift_suggestions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = gift_suggestions.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_gifts" ON public.gift_suggestions;
CREATE POLICY "delete_gifts" ON public.gift_suggestions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = gift_suggestions.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_gifts_updated_at ON public.gift_suggestions;
CREATE TRIGGER trg_gifts_updated_at
  BEFORE UPDATE ON public.gift_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- love_quizzes + quiz_results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.love_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.love_quizzes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quizzes_slug ON public.love_quizzes(slug);

DROP POLICY IF EXISTS "select_quizzes" ON public.love_quizzes;
CREATE POLICY "select_quizzes" ON public.love_quizzes
  FOR SELECT TO authenticated USING (is_active = true);

DROP TRIGGER IF EXISTS trg_quizzes_updated_at ON public.love_quizzes;
CREATE TRIGGER trg_quizzes_updated_at
  BEFORE UPDATE ON public.love_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.love_quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_quizresults_couple_quiz ON public.quiz_results(couple_id, quiz_id);

DROP POLICY IF EXISTS "select_quiz_results" ON public.quiz_results;
CREATE POLICY "select_quiz_results" ON public.quiz_results
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = quiz_results.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_quiz_results" ON public.quiz_results;
CREATE POLICY "insert_quiz_results" ON public.quiz_results
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "update_quiz_results" ON public.quiz_results;
CREATE POLICY "update_quiz_results" ON public.quiz_results
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = quiz_results.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_quiz_results" ON public.quiz_results;
CREATE POLICY "delete_quiz_results" ON public.quiz_results
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = quiz_results.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_quizresults_updated_at ON public.quiz_results;
CREATE TRIGGER trg_quizresults_updated_at
  BEFORE UPDATE ON public.quiz_results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- anniversaries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.anniversaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  anniversary_date date NOT NULL,
  recurrence text NOT NULL DEFAULT 'yearly' CHECK (recurrence IN ('once','yearly','monthly')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.anniversaries ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_anniv_couple_date ON public.anniversaries(couple_id, anniversary_date);

DROP POLICY IF EXISTS "select_anniversaries" ON public.anniversaries;
CREATE POLICY "select_anniversaries" ON public.anniversaries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = anniversaries.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_anniversaries" ON public.anniversaries;
CREATE POLICY "insert_anniversaries" ON public.anniversaries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = author_id
  );

DROP POLICY IF EXISTS "update_anniversaries" ON public.anniversaries;
CREATE POLICY "update_anniversaries" ON public.anniversaries
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = anniversaries.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_anniversaries" ON public.anniversaries;
CREATE POLICY "delete_anniversaries" ON public.anniversaries
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = anniversaries.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_anniv_updated_at ON public.anniversaries;
CREATE TRIGGER trg_anniv_updated_at
  BEFORE UPDATE ON public.anniversaries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- chat_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chat_couple_created ON public.chat_messages(couple_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON public.chat_messages(sender_id);

DROP POLICY IF EXISTS "select_chat" ON public.chat_messages;
CREATE POLICY "select_chat" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = chat_messages.couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "insert_chat" ON public.chat_messages;
CREATE POLICY "insert_chat" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c))
    AND auth.uid() = sender_id
  );

DROP POLICY IF EXISTS "update_chat" ON public.chat_messages;
CREATE POLICY "update_chat" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = chat_messages.couple_id AND public.is_couple_member(c)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = couple_id AND public.is_couple_member(c)));

DROP POLICY IF EXISTS "delete_chat" ON public.chat_messages;
CREATE POLICY "delete_chat" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.couples c WHERE c.id = chat_messages.couple_id AND public.is_couple_member(c)));

DROP TRIGGER IF EXISTS trg_chat_updated_at ON public.chat_messages;
CREATE TRIGGER trg_chat_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifs_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifs_read ON public.notifications(user_id, read_at);

DROP POLICY IF EXISTS "select_notifs" ON public.notifications;
CREATE POLICY "select_notifs" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_notifs" ON public.notifications;
CREATE POLICY "insert_notifs" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_notifs" ON public.notifications;
CREATE POLICY "update_notifs" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_notifs" ON public.notifications;
CREATE POLICY "delete_notifs" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_notifs_updated_at ON public.notifications;
CREATE TRIGGER trg_notifs_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ai_conversations + ai_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_aiconv_user_updated ON public.ai_conversations(user_id, updated_at DESC);

DROP POLICY IF EXISTS "select_ai_conv" ON public.ai_conversations;
CREATE POLICY "select_ai_conv" ON public.ai_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_ai_conv" ON public.ai_conversations;
CREATE POLICY "insert_ai_conv" ON public.ai_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_ai_conv" ON public.ai_conversations;
CREATE POLICY "update_ai_conv" ON public.ai_conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_ai_conv" ON public.ai_conversations;
CREATE POLICY "delete_ai_conv" ON public.ai_conversations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_aiconv_updated_at ON public.ai_conversations;
CREATE TRIGGER trg_aiconv_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_aimsg_conv_created ON public.ai_messages(conversation_id, created_at);

DROP POLICY IF EXISTS "select_ai_msg" ON public.ai_messages;
CREATE POLICY "select_ai_msg" ON public.ai_messages
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "insert_ai_msg" ON public.ai_messages;
CREATE POLICY "insert_ai_msg" ON public.ai_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_ai_msg" ON public.ai_messages;
CREATE POLICY "delete_ai_msg" ON public.ai_messages
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()));

DROP TRIGGER IF EXISTS trg_aimsg_updated_at ON public.ai_messages;
CREATE TRIGGER trg_aimsg_updated_at
  BEFORE UPDATE ON public.ai_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Storage buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_owner_select" ON storage.objects;
CREATE POLICY "avatars_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
CREATE POLICY "avatars_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "memories_owner_select" ON storage.objects;
CREATE POLICY "memories_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'memories' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "memories_owner_insert" ON storage.objects;
CREATE POLICY "memories_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'memories' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "memories_owner_update" ON storage.objects;
CREATE POLICY "memories_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'memories' AND (auth.uid()::text = (storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'memories' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "memories_owner_delete" ON storage.objects;
CREATE POLICY "memories_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'memories' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "chat_owner_select" ON storage.objects;
CREATE POLICY "chat_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chat-attachments' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "chat_owner_insert" ON storage.objects;
CREATE POLICY "chat_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-attachments' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "chat_owner_update" ON storage.objects;
CREATE POLICY "chat_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'chat-attachments' AND (auth.uid()::text = (storage.foldername(name))[1]))
  WITH CHECK (bucket_id = 'chat-attachments' AND (auth.uid()::text = (storage.foldername(name))[1]));

DROP POLICY IF EXISTS "chat_owner_delete" ON storage.objects;
CREATE POLICY "chat_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chat-attachments' AND (auth.uid()::text = (storage.foldername(name))[1]));

-- Auto-create a profile row when a new auth user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed a default love quiz so the Love Quiz feature has content.
INSERT INTO public.love_quizzes (slug, title, description, is_active)
VALUES ('love-language', 'Love Language Quiz', 'Discover how you and your partner give and receive love.', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.love_quizzes (slug, title, description, is_active)
VALUES ('relationship-checkup', 'Relationship Checkup', 'A quick health check for your relationship.', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.love_quizzes (slug, title, description, is_active)
VALUES ('couples-trivia', 'Couples Trivia', 'How well do you know each other?', true)
ON CONFLICT (slug) DO NOTHING;
