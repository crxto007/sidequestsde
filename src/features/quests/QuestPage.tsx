import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Shuffle, Zap } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Quest } from '@/types';

export default function QuestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!user) return;

      // Check for active quest
      const { data: activeQuest } = await supabase
        .from('active_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (activeQuest) {
        navigate('/upload');
        return;
      }

      // Get user's group
      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        navigate('/group');
        return;
      }
      setGroupId(membership.group_id);

      // Fetch quests
      const { data: questData } = await supabase.from('quests').select('*');
      setQuests(questData ?? []);
      setLoading(false);
    };
    init();
  }, [user, navigate]);

  const acceptQuest = async (quest: Quest) => {
    if (!user || !groupId) return;
    setSubmitting(true);

    const { error } = await supabase.from('active_quests').insert({
      user_id: user.id,
      group_id: groupId,
      quest_id: quest.id,
      status: 'active',
    });

    if (error) {
      toast.error('Failed to start quest');
      setSubmitting(false);
      return;
    }

    toast.success('Quest started!');
    navigate('/upload');
  };

  const pickRandom = () => {
    if (quests.length === 0) return;
    const random = quests[Math.floor(Math.random() * quests.length)];
    acceptQuest(random);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col min-h-screen px-6 pt-12 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-1">What's your quest?</h1>
      <p className="text-muted-foreground text-sm mb-6">Choose a quest or let fate decide.</p>

      <Button variant="accent" size="xl" className="w-full mb-6" onClick={pickRandom} disabled={submitting}>
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <><Shuffle className="h-5 w-5 mr-2" /> Random Quest</>
        )}
      </Button>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {quests.map((quest) => (
          <button
            key={quest.id}
            onClick={() => setSelectedQuest(selectedQuest?.id === quest.id ? null : quest)}
            className={`w-full text-left bg-card rounded-xl p-4 border transition-all active:scale-[0.98] ${
              selectedQuest?.id === quest.id ? 'border-primary ring-1 ring-primary' : 'border-border'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{quest.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{quest.description}</p>
              </div>
              <span className="bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                {quest.points_value} pts
              </span>
            </div>
          </button>
        ))}
      </div>

      {selectedQuest && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Button variant="accent" size="xl" className="w-full" onClick={() => acceptQuest(selectedQuest)} disabled={submitting}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <><Zap className="h-5 w-5 mr-2" /> Accept Quest</>
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
