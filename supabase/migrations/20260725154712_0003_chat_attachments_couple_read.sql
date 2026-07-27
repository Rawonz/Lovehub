/*
# Allow both couple members to read chat attachments

## Problem
Chat attachment storage SELECT policy only allowed the uploader (folder owner)
to read. But chat attachments are shared between couple members — when partner A
uploads an image, partner B must be able to view it. The current policy blocks
partner B, so attachments sent by the other person show as broken images.

## Change
Relaxes the SELECT policy so an authenticated user can read a chat attachment
if they own it OR they share an active couple with the owner (folder name = owner's user_id).
INSERT/UPDATE/DELETE stay owner-only.

## Security
- Still requires `authenticated`.
- Read access is scoped to files owned by the user or their active couple partner.
- Write/delete remain owner-only, so partners can't modify each other's files.
*/

DROP POLICY IF EXISTS "chat_owner_select" ON storage.objects;

CREATE POLICY "chat_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND (
      (auth.uid())::text = (storage.foldername(name))[1]
      OR EXISTS (
        SELECT 1
        FROM public.couples c
        WHERE c.status = 'active'
          AND (
            (c.user_id_1 = auth.uid() AND c.user_id_2::text = (storage.foldername(name))[1])
            OR (c.user_id_2 = auth.uid() AND c.user_id_1::text = (storage.foldername(name))[1])
          )
      )
    )
  );
