import { motion } from 'framer-motion';
import { LogOut, Zap } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center min-h-screen px-6 pt-16 pb-24">
      <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold mb-4">
        {initials}
      </div>
      <h1 className="text-2xl font-bold text-foreground">{profile?.username}</h1>
      <div className="flex items-center gap-2 mt-2 mb-8">
        <Zap className="h-5 w-5 text-primary" />
        <span className="text-primary font-bold text-lg">{profile?.points ?? 0} pts</span>
      </div>

      <Button variant="ghost" size="xl" className="w-full max-w-xs text-destructive" onClick={handleSignOut}>
        <LogOut className="h-5 w-5 mr-2" /> Sign Out
      </Button>
    </motion.div>
  );
}
