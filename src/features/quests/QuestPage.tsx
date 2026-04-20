import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Shuffle, Zap, Play } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Quest } from '@/types';

// Sample side quests for single player
const SIDE_QUESTS: Quest[] = [
  {
    id: 'sq-1',
    title: 'Morning Reflection',
    description: 'Write down 3 things you are grateful for this morning.',
    category: 'mindfulness',
    points_value: 10,
  },
  {
    id: 'sq-2',
    title: '10-Minute Walk',
    description: 'Take a 10-minute walk outside and observe your surroundings.',
    category: 'fitness',
    points_value: 15,
  },
  {
    id: 'sq-3',
    title: 'Digital Detox',
    description: 'Spend 1 hour without looking at any screen.',
    category: 'wellness',
    points_value: 20,
  },
  {
    id: 'sq-4',
    title: 'Random Act of Kindness',
    description: 'Do something nice for a stranger or friend without expecting anything back.',
    category: 'social',
    points_value: 25,
  },
  {
    id: 'sq-5',
    title: 'Hydration Challenge',
    description: 'Drink 8 glasses of water throughout the day.',
    category: 'health',
    points_value: 10,
  },
  {
    id: 'sq-6',
    title: 'Deep Breathing',
    description: 'Practice 5 minutes of deep breathing exercises.',
    category: 'mindfulness',
    points_value: 15,
  },
  {
    id: 'sq-7',
    title: 'Healthy Meal',
    description: 'Cook and eat a healthy, balanced meal today.',
    category: 'health',
    points_value: 20,
  },
  {
    id: 'sq-8',
    title: 'Stretch Session',
    description: 'Do a 10-minute full body stretch routine.',
    category: 'fitness',
    points_value: 15,
  },
  {
    id: 'sq-9',
    title: 'Read a Chapter',
    description: 'Read at least one chapter of a book you enjoy.',
    category: 'learning',
    points_value: 15,
  },
  {
    id: 'sq-10',
    title: 'Journal Entry',
    description: 'Write about your day and how you felt for 5 minutes.',
    category: 'mindfulness',
    points_value: 15,
  },
];

type ViewState = 'start' | 'selecting' | 'loading';

export default function QuestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('start');
  const [currentQuest, setCurrentQuest] = useState<Quest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkActiveQuest = async () => {
      if (!user) return;

      const { data: activeQuest, error } = await supabase
        .from('active_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!error && activeQuest) {
        navigate('/upload');
        return;
      }
    };

    checkActiveQuest();
  }, [user, navigate]);

  const getRandomQuest = (): Quest => {
    const randomIndex = Math.floor(Math.random() * SIDE_QUESTS.length);
    return SIDE_QUESTS[randomIndex];
  };

  const handleStart = () => {
    setViewState('selecting');
    setCurrentQuest(getRandomQuest());
  };

  const handleRefresh = () => {
    let newQuest = getRandomQuest();
    while (newQuest.id === currentQuest?.id) {
      newQuest = getRandomQuest();
    }
    setCurrentQuest(newQuest);
  };

  const handleAccept = async () => {
    if (!user || !currentQuest) return;
    setSubmitting(true);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase.from('active_quests').insert({
      user_id: user.id,
      quest_id: currentQuest.id,
      quest_title: currentQuest.title,
      quest_description: currentQuest.description,
      points_value: currentQuest.points_value,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast.error('Failed to start quest');
      setSubmitting(false);
      return;
    }

    toast.success('Quest started! You have 24 hours.');
    navigate('/upload');
  };

  // Start screen
  if (viewState === 'start') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center min-h-screen px-6 pb-24"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-block"
          >
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 mx-auto">
              <Zap className="h-12 w-12 text-primary" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Ready for a side quest?</h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto">
            Complete daily challenges, earn points, and build streaks.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-xs"
        >
          <Button variant="accent" size="xl" className="w-full" onClick={handleStart}>
            <Play className="h-5 w-5 mr-2" /> Start
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Quest selection screen
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-screen px-6 pt-12 pb-24"
    >
      <h1 className="text-2xl font-bold text-foreground mb-1">Your side quest</h1>
      <p className="text-muted-foreground text-sm mb-8">Accept it or try another one.</p>

      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {currentQuest && (
            <motion.div
              key={currentQuest.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-card rounded-2xl p-6 border border-border shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {currentQuest.category}
                </span>
                <span className="bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                  {currentQuest.points_value} pts
                </span>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-3">{currentQuest.title}</h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                {currentQuest.description}
              </p>

              <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  You will have <span className="font-bold text-foreground">24 hours</span> to complete
                  this quest and upload proof.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3 mt-8">
        <Button
          variant="accent"
          size="xl"
          className="w-full"
          onClick={handleAccept}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Zap className="h-5 w-5 mr-2" /> Go
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="xl"
          className="w-full"
          onClick={handleRefresh}
          disabled={submitting}
        >
          <Shuffle className="h-5 w-5 mr-2" /> Try Another
        </Button>
      </div>
    </motion.div>
  );
}
