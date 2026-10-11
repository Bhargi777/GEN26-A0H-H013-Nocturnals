-- Administrators assign roles. Accounts are created by administrators or the seed, not by public sign-up.

create or replace function public.admin_set_profile(
  p_user uuid,
  p_role user_role,
  p_department uuid default null,
  p_canteen uuid default null,
  p_club uuid default null
) returns profiles
language plpgsql security definer set search_path = public as $$
declare
  v_me profiles;
  v_target profiles;
  v_row profiles;
begin
  select * into v_me from profiles where id = auth.uid();
  if not found or v_me.role <> 'admin' then raise exception 'Only an administrator can assign roles.'; end if;
  select * into v_target from profiles where id = p_user;
  if not found then raise exception 'User not found.'; end if;

  if p_user = auth.uid() and p_role <> 'admin' then raise exception 'You cannot remove your own administrator role.'; end if;
  if p_role in ('canteen_kitchen', 'canteen_counter', 'canteen_manager') and p_canteen is null then raise exception 'Choose a canteen for this role.'; end if;
  if p_role = 'club_president' and p_club is null then raise exception 'Choose a club for a club president.'; end if;
  if p_role in ('technician', 'dept_office', 'dept_head') and p_department is null then raise exception 'Choose a department for this role.'; end if;
  if p_role = 'canteen_manager' and exists (select 1 from profiles where role = 'canteen_manager' and canteen_id = p_canteen and id <> p_user) then
    raise exception 'That canteen already has a manager. Change their role first.';
  end if;
  if p_role = 'club_president' and exists (select 1 from profiles where role = 'club_president' and club_id = p_club and id <> p_user) then
    raise exception 'That club already has a president. Change their role first.';
  end if;

  update profiles set
    role = p_role,
    department_id = case when p_role in ('technician', 'dept_office', 'dept_head', 'faculty', 'student', 'cr') then coalesce(p_department, department_id) else p_department end,
    canteen_id = case when p_role in ('canteen_kitchen', 'canteen_counter', 'canteen_manager') then p_canteen else null end,
    club_id = case when p_role = 'club_president' then p_club else null end
  where id = p_user returning * into v_row;

  if v_target.role is distinct from p_role then
    perform notify_user(p_user, 'Your role changed', 'An administrator set your role to ' || replace(p_role::text, '_', ' ') || '. Sign in again if menus look wrong.', '/dashboard');
  end if;
  return v_row;
end $$;

revoke execute on function public.admin_set_profile(uuid, user_role, uuid, uuid, uuid) from public, anon;
grant execute on function public.admin_set_profile(uuid, user_role, uuid, uuid, uuid) to authenticated;
