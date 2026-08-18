// src/components/auth/LoginForm.tsx
import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import Button from "../ui/Button";

interface LoginFormProps {
  onSuccess: () => void;
}

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/wrong-password":       "That password doesn't look right. Give it another try!",
    "auth/invalid-credential":   "That password doesn't look right. Give it another try!",
    "auth/user-not-found":       "We couldn't find an account with that email. Want to sign up instead?",
    "auth/invalid-email":        "That doesn't look like a valid email address.",
    "auth/too-many-requests":    "Too many attempts! Please wait a moment before trying again.",
    "auth/network-request-failed": "Looks like you're offline. Check your connection and try again.",
    "auth/user-disabled":        "This account has been disabled. Please contact support.",
  };
  return map[code] ?? "Something went wrong. Please try again!";
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  if (showReset) {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        <p className="text-bark-brown font-fredoka text-sm text-center">
          Enter your email and we'll send a reset link 🌱
        </p>
        <input
          id="reset-email"
          type="email"
          required
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-flower-pink text-sm font-fredoka text-center">{error}</p>}
        {resetSent && (
          <p className="text-forest-green text-sm font-fredoka text-center">
            ✅ Check your email for the reset link!
          </p>
        )}
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Sending…" : "Send Reset Link"}
        </Button>
        <button
          type="button"
          onClick={() => { setShowReset(false); setResetSent(false); setError(""); }}
          className="w-full text-center text-sm text-forest-green font-fredoka hover:underline"
        >
          ← Back to Log In
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="login-email" className={labelClass}>Email</label>
        <input
          id="login-email"
          type="email"
          required
          placeholder="hello@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={labelClass}>Password</label>
        <input
          id="login-password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && (
        <p role="alert" className="text-flower-pink text-sm font-fredoka text-center bg-pink-50 rounded-2xl p-3">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth disabled={loading} size="lg">
        {loading ? "Logging in…" : "Log In 🌿"}
      </Button>
      <button
        type="button"
        onClick={() => { setShowReset(true); setError(""); }}
        className="w-full text-center text-sm text-forest-green/70 font-fredoka hover:text-forest-green transition-colors"
      >
        Forgot your password?
      </button>
    </form>
  );
}

const inputClass = `
  w-full px-4 py-3 rounded-2xl border-2 border-leaf-green/30
  bg-white/70 font-fredoka text-bark-brown placeholder-soil-brown/40
  focus:outline-none focus:border-forest-green focus:ring-2 focus:ring-forest-green/20
  transition-all duration-200
`;

const labelClass = "block text-sm font-fredoka font-semibold text-bark-brown mb-1";
