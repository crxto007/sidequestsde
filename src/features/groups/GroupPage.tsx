import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Copy, Check, Users, Plus, LogIn } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Group, GroupMember } from '@/types';

export default function GroupPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myGroup, setMyGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchGroup = async () => {
    if (!user) return;
    setLoading(true);

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (memberships && memberships.length > 0) {
      const groupId = memberships[0].group_id;
      const { data: group } = await supabase.from('groups').select('*').eq('id', groupId).single();
      if (group) {
        setMyGroup(group);
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('*, profiles(*)')
          .eq('group_id', groupId);
        setMembers(groupMembers ?? []);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroup(); }, [user]);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupName.trim()) return;
    setSubmitting(true);

    const code = generateCode();
    const { error } = await supabase.rpc('create_group', {
      p_name: groupName.trim(),
      p_invite_code: code,
    });

    if (error) {
      toast.error('Failed to create group');
      setSubmitting(false);
      return;
    }

    toast.success('Group created!');
    await fetchGroup();
    setSubmitting(false);
    setShowCreate(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.rpc('join_group', {
      p_invite_code: inviteCode.trim().toUpperCase(),
    });

    if (error) {
      const msg = error.message?.includes('full') ? 'Group is full (max 5 members)'
        : error.message?.includes('Invalid') ? 'Invalid invite code'
        : 'Failed to join group';
      toast.error(msg);
      setSubmitting(false);
      return;
    }

    toast.success('Joined group!');
    await fetchGroup();
    setSubmitting(false);
    setShowJoin(false);
  };

  const copyCode = () => {
    if (myGroup) {
      navigator.clipboard.writeText(myGroup.invite_code);
      setCopied(true);
      toast.success('Invite code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group home view
  if (myGroup) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col min-h-screen px-6 pt-12 pb-24">
        <h1 className="text-3xl font-bold text-foreground mb-2">{myGroup.name}</h1>

        <button onClick={copyCode} className="flex items-center gap-2 bg-card rounded-xl px-4 py-3 border border-border mb-6 w-fit active:scale-95 transition-transform">
          <span className="text-muted-foreground text-sm">Invite code</span>
          <span className="font-mono font-bold text-primary tracking-widest">{myGroup.invite_code}</span>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>

        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Members</h2>
        <div className="space-y-3 flex-1">
          {members.map((m) => {
            const p = m.profiles as unknown as { username: string; points: number } | undefined;
            const username = p?.username ?? 'Unknown';
            const points = p?.points ?? 0;
            const initials = username.slice(0, 2).toUpperCase();
            return (
              <div key={m.id} className="flex items-center gap-3 bg-card rounded-xl p-4 border border-border">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {initials}
                </div>
                <span className="flex-1 font-medium text-foreground">{username}</span>
                <span className="bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{points} pts</span>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <Button variant="accent" size="xl" className="w-full" onClick={() => navigate('/quest')}>
            Start a Quest →
          </Button>
        </div>
      </motion.div>
    );
  }

  // No group - show create/join
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col min-h-screen px-6 pt-12 pb-24 space-y-4">
      <h1 className="text-2xl font-bold text-foreground mb-2">Join or create a group</h1>
      <p className="text-muted-foreground text-sm mb-4">You need a group to start questing with friends.</p>

      {!showCreate && !showJoin && (
        <div className="space-y-4">
          <button onClick={() => setShowCreate(true)} className="w-full bg-card border border-border rounded-xl p-6 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <Plus className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">Create a Group</span>
            </div>
            <p className="text-muted-foreground text-sm">Start a new group and invite your friends.</p>
          </button>

          <button onClick={() => setShowJoin(true)} className="w-full bg-card border border-border rounded-xl p-6 text-left active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <LogIn className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">Join a Group</span>
            </div>
            <p className="text-muted-foreground text-sm">Enter an invite code from a friend.</p>
          </button>
        </div>
      )}

      {showCreate && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCreate} className="space-y-4">
          <Input
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="h-[52px] rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground text-base"
            required
          />
          <Button type="submit" variant="accent" size="xl" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Group'}
          </Button>
          <Button type="button" variant="ghost" size="xl" className="w-full text-muted-foreground" onClick={() => setShowCreate(false)}>Cancel</Button>
        </motion.form>
      )}

      {showJoin && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleJoin} className="space-y-4">
          <Input
            placeholder="Enter 6-character code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="h-[52px] rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground text-base font-mono tracking-widest text-center"
            required
          />
          <Button type="submit" variant="accent" size="xl" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Join Group'}
          </Button>
          <Button type="button" variant="ghost" size="xl" className="w-full text-muted-foreground" onClick={() => setShowJoin(false)}>Cancel</Button>
        </motion.form>
      )}
    </motion.div>
  );
}
