// src/components/auth/SignupForm.tsx
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";
import Button from "../ui/Button";

interface SignupFormProps {
  onSuccess: () => void;
}

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    "auth/email-already-in-use": "An account with that email already exists! Try logging in instead.",
    "auth/invalid-email":        "That doesn't look like a valid email address.",
    "auth/weak-password":        "Your password needs to be at least 6 characters.",
    "auth/network-request-failed": "Looks like you're offline. Check your connection and try again.",
  };
  return map[code] ?? "Something went wrong. Please try again!";
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match — double-check and try again!");
      return;
    }
    if (password.length < 6) {
      setError("Your password needs to be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: displayName.trim() });

      // Create the parent document in Firestore
      await setDoc(doc(db, "parents", user.uid), {
        email: user.email,
        displayName: displayName.trim(),
        createdAt: serverTimestamp(),
      });

      onSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div>
        <label htmlFor="signup-name" className={labelClass}>Your name</label>
        <input
          id="signup-name"
          type="text"
          required
          placeholder="e.g. Alex"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-email" className={labelClass}>Email</label>
        <input
          id="signup-email"
          type="email"
          required
          placeholder="hello@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-password" className={labelClass}>Password</label>
        <input
          id="signup-password"
          type="password"
          required
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="signup-confirm" className={labelClass}>Confirm password</label>
        <input
          id="signup-confirm"
          type="password"
          required
          placeholder="Same password again"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      {error && (
        <p role="alert" className="text-flower-pink text-sm font-fredoka text-center bg-pink-50 rounded-2xl p-3">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth disabled={loading} size="lg">
        {loading ? "Creating your garden…" : "Create Account 🌱"}
      </Button>
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
