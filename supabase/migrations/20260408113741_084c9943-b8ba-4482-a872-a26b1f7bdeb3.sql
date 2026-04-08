CREATE OR REPLACE FUNCTION public.create_group(p_name text, p_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  INSERT INTO groups (name, invite_code, created_by)
  VALUES (p_name, UPPER(p_invite_code), auth.uid())
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id)
  VALUES (v_group_id, auth.uid());

  RETURN v_group_id;
END;
$$;