import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Loader2, Mail } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = isSignUp
      ? await signUp(email, password, username)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
    } else if (isSignUp) {
      setShowConfirmation(true);
    } else {
      navigate('/group');
    }
    setLoading(false);
  };

  if (showConfirmation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-safe">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm space-y-6 text-center"
        >
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click the link to activate your account.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setShowConfirmation(false);
              setIsSignUp(false);
              setEmail('');
              setPassword('');
              setUsername('');
            }}
          >
            Back to Sign In
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 pb-safe">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">SideQuest</h1>
          </div>
          <p className="text-muted-foreground text-sm">Real life. Real proof. Real points.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.2 }}>
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-[52px] rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground text-base"
                required
              />
            </motion.div>
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-[52px] rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground text-base"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-[52px] rounded-xl bg-card border-border text-foreground placeholder:text-muted-foreground text-base"
            required
            minLength={6}
          />

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="accent"
            size="xl"
            className="w-full"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
