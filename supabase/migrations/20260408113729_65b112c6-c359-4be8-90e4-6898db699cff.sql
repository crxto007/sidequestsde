-- Remove the open INSERT policy on group_members
DROP POLICY "Authenticated users can join groups" ON public.group_members;

-- Create secure join_group RPC that validates invite code and member cap
CREATE OR REPLACE FUNCTION public.join_group(p_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_member_count bigint;
BEGIN
  SELECT id INTO v_group_id FROM groups WHERE invite_code = UPPER(p_invite_code);
  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  SELECT COUNT(*) INTO v_member_count FROM group_members WHERE group_id = v_group_id;
  IF v_member_count >= 5 THEN
    RAISE EXCEPTION 'Group is full (max 5 members)';
  END IF;

  INSERT INTO group_members (group_id, user_id) VALUES (v_group_id, auth.uid());
  RETURN v_group_id;
END;
$$;