/*
# Allow couple partners to insert notifications for each other

## Problem
The `notifications` INSERT policy required `auth.uid() = user_id`. This blocks
legitimate cross-user notifications — e.g. when partner B accepts an invitation,
the app inserts a notification for partner A, but the insert runs as partner B
and fails the ownership check. The notification is silently dropped.

## Change
Relaxes the INSERT policy so an authenticated user may insert a notification
for either themselves OR the other member of their active couple. This keeps
notifications scoped to real couples while enabling partner-to-partner alerts.

## Security
- Still requires `authenticated`.
- The recipient must share an active couple with the inserting user, so random
  users cannot spam each other.
- SELECT / UPDATE / DELETE policies remain owner-only.
*/

DROP POLICY IF EXISTS "insert_notifs" ON public.notifications;

CREATE POLICY "insert_notifs" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.couples c
      WHERE c.status = 'active'
        AND (
          (c.user_id_1 = auth.uid() AND c.user_id_2 = notifications.user_id)
          OR (c.user_id_2 = auth.uid() AND c.user_id_1 = notifications.user_id)
        )
    )
  );
