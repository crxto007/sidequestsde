-- Fix 1: Restrict groups SELECT policy to members only
DROP POLICY "Anyone can look up groups" ON public.groups;

CREATE POLICY "Members can view their groups" ON public.groups
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = id
        AND group_members.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

-- Create a secure RPC for invite code lookup (returns group id and name only, no invite_code leak)
CREATE OR REPLACE FUNCTION public.lookup_group_by_invite_code(code text)
RETURNS TABLE(group_id uuid, group_name text, member_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id AS group_id, g.name AS group_name,
    (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count
  FROM groups g
  WHERE g.invite_code = UPPER(code)
  LIMIT 1;
$$;

-- Fix 2: Make quest-proofs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'quest-proofs';

-- Drop the public SELECT policy
DROP POLICY "Quest proof images are publicly accessible" ON storage.objects;

-- Add owner-only SELECT policy
CREATE POLICY "Users can view their own quest proof images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'quest-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);