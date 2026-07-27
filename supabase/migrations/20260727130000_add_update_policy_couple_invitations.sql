-- Add missing UPDATE policy for couple_invitations
-- Allows both inviter and invitee to update invitation records

drop policy if exists "Users can update invitations" on public.couple_invitations;

create policy "Users can update invitations"
on public.couple_invitations
for update
to authenticated
using (
    inviter_id = auth.uid()
    OR
    invitee_id = auth.uid()
)
with check (
    inviter_id = auth.uid()
    OR
    invitee_id = auth.uid()
);
