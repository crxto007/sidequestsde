import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Upload, CheckCircle2, ImagePlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ActiveQuest, Quest } from '@/types';

export default function UploadPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuest, setActiveQuest] = useState<ActiveQuest | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  useEffect(() => {
    const init = async () => {
      if (!user) return;

      const { data: aq } = await supabase
        .from('active_quests')
        .select('*, quests(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (!aq) {
        navigate('/quest');
        return;
      }

      setActiveQuest(aq);
      setQuest(aq.quests as unknown as Quest);
      setLoading(false);
    };
    init();
  }, [user, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!activeQuest) return;
    const tick = () => {
      const now = Date.now();
      const exp = new Date(activeQuest.expires_at).getTime();
      const diff = exp - now;
      if (diff <= 0) {
        setExpired(true);
        setTimeLeft('Expired');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s remaining`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeQuest]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file || !activeQuest || !quest || !user) return;
    setSubmitting(true);

    const filePath = `${user.id}/${activeQuest.id}.jpg`;
    const { error: uploadError } = await supabase.storage.from('quest-proofs').upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed');
      setSubmitting(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('quest-proofs').getPublicUrl(filePath);

    await supabase.from('quest_proofs').insert({
      active_quest_id: activeQuest.id,
      user_id: user.id,
      image_url: urlData.publicUrl,
    });

    await supabase.from('active_quests').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', activeQuest.id);

    await supabase.rpc('', {}).catch(() => {});
    // Update points directly
    const { data: currentProfile } = await supabase.from('profiles').select('points').eq('id', user.id).single();
    const newPoints = (currentProfile?.points ?? 0) + quest.points_value;
    await supabase.from('profiles').update({ points: newPoints }).eq('id', user.id);

    setEarnedPoints(quest.points_value);
    setCompleted(true);
    setSubmitting(false);
    await refreshProfile();
    toast.success('Proof submitted!');
  };

  const handleStartNew = async () => {
    if (!activeQuest) return;
    await supabase.from('active_quests').update({ status: 'expired' }).eq('id', activeQuest.id);
    navigate('/quest');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Completed state
  if (completed) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center min-h-screen px-6 pb-24 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
          <CheckCircle2 className="h-24 w-24 text-primary mb-6" />
        </motion.div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Quest Complete!</h1>
        <p className="text-primary text-xl font-bold mb-8">+{earnedPoints} pts</p>
        <Button variant="accent" size="xl" className="w-full max-w-xs" onClick={() => navigate('/group')}>
          Back to Group
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col min-h-screen px-6 pt-12 pb-24">
      {/* Quest card */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h2 className="text-lg font-bold text-foreground">{quest?.title}</h2>
        <p className="text-muted-foreground text-sm mt-1">{quest?.description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
            {quest?.points_value} pts
          </span>
          {expired ? (
            <span className="text-destructive text-sm font-medium flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> Quest expired
            </span>
          ) : (
            <span className="text-primary text-sm font-mono font-medium">{timeLeft}</span>
          )}
        </div>
      </div>

      {expired ? (
        <Button variant="accent" size="xl" className="w-full" onClick={handleStartNew}>
          Start New Quest
        </Button>
      ) : (
        <>
          {/* Upload zone */}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full aspect-square max-h-[300px] rounded-xl border-2 border-dashed border-primary/40 bg-card flex flex-col items-center justify-center gap-3 mb-6 overflow-hidden active:scale-[0.98] transition-transform"
          >
            {preview ? (
              <img src={preview} alt="Proof preview" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <>
                <ImagePlus className="h-12 w-12 text-primary/50" />
                <p className="text-muted-foreground text-sm">Drop proof here or tap to upload</p>
              </>
            )}
          </button>

          <Button
            variant="accent"
            size="xl"
            className="w-full"
            disabled={!file || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <><Upload className="h-5 w-5 mr-2" /> Submit Proof</>
            )}
          </Button>
        </>
      )}
    </motion.div>
  );
}
