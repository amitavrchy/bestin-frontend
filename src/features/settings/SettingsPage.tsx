import { SettingsForm } from "./SettingsForm";
export function SettingsPage() {
  return (
    <div className="page narrow">
      <p className="eyebrow">MAKE YOURSELF AT HOME</p>
      <h1>
        Your settings<span className="accent">.</span>
      </h1>
      <p className="muted">A reading companion, just the way you like it.</p>
      <div className="panel">
        <SettingsForm />
      </div>
    </div>
  );
}
