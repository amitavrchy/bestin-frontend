import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/state";
import { Stage } from "../../components/Stage";
export function AuthPage({ register = false }: { register?: boolean }) {
  const { user, signIn } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  if (user) return <Navigate to="/" replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await signIn(
        String(form.get("email")),
        String(form.get("password")),
        register ? String(form.get("name")) : undefined,
      );
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <div className="auth-art">
        <Link className="brand" to="/">
          ✳ bestin.
        </Link>
        <div>
          <p className="eyebrow">A LITTLE MORE HUMAN</p>
          <h1>
            Every book has
            <br />a story to tell.
          </h1>
          <p>
            Meet your thoughtful companion for the questions that come to mind
            as you read.
          </p>
        </div>
        <Stage background="library" character="sage" expression="happy" />
      </div>
      <div className="auth-form">
        <div className="auth-inner">
          <p className="eyebrow">WELCOME TO BESTIN</p>
          <h1>{register ? "Start your story" : "Welcome back"}</h1>
          <p className="muted">
            {register
              ? "Create an account and get curious."
              : "A good conversation is waiting for you."}
          </p>
          <form onSubmit={submit} className="form-stack">
            {register && (
              <label>
                Name
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy ? "One moment…" : register ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="muted">
            {register ? "Already have an account?" : "New around here?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
