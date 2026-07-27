-- Partner invitation policies

drop policy if exists "Users can create invitations" on public.couple_invitations;
drop policy if exists "Users can view invitations" on public.couple_invitations;
drop policy if exists "Users can delete invitations" on public.couple_invitations;

create policy "Users can create invitations"
on public.couple_invitations
for insert
to authenticated
with check (
    inviter_id = auth.uid()
);

create policy "Users can view invitations"
on public.couple_invitations
for select
to authenticated
using (
    inviter_id = auth.uid()
    OR
    invitee_id = auth.uid()
);

create policy "Users can delete invitations"
on public.couple_invitations
for delete
to authenticated
using (
    inviter_id = auth.uid()
);