import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, json } from "../../lib/api";
import { useSettings } from "../../lib/state";
import { backgrounds } from "../../components/Stage";
import type { Voice } from "../../lib/types";
export function SettingsForm() {
  const { settings, update } = useSettings();
  const { data: voices } = useQuery({
    queryKey: ["voices"],
    queryFn: () => api<Voice[]>("/api/voices"),
  });
  const [error, setError] = useState("");
  async function preview() {
    try {
      const s = await api<{ audio_base64: string; mime: string }>("/api/tts", {
        method: "POST",
        body: json({
          text: "Hello! I’m Bestin, your reading companion.",
          voice: settings.voice,
        }),
      });
      const audio = new Audio(`data:${s.mime};base64,${s.audio_base64}`);
      await audio.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview unavailable");
    }
  }
  return (
    <div className="settings-grid">
      <label>
        Voice
        <div className="inline">
          <select
            value={settings.voice}
            onChange={(e) => update({ voice: e.target.value })}
          >
            {!voices?.some((v) => v.id === settings.voice) && (
              <option value={settings.voice}>{settings.voice}</option>
            )}
            {voices?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.locale}
              </option>
            ))}
          </select>
          <button onClick={preview}>Preview</button>
        </div>
      </label>
      <label>
        Speaking style
        <select
          value={settings.style}
          onChange={(e) =>
            update({ style: e.target.value as "concise" | "detailed" })
          }
        >
          <option value="concise">Concise</option>
          <option value="detailed">Detailed</option>
        </select>
      </label>
      <label>
        Character
        <select
          value={settings.character}
          onChange={(e) => update({ character: e.target.value })}
        >
          <option value="sage">Bestin</option>
          <option value="rafi">Rafi</option>
          <option value="owl">Owl-sage</option>
        </select>
      </label>
      <label>
        Scene
        <select
          value={settings.background}
          onChange={(e) => update({ background: e.target.value })}
        >
          {backgrounds.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </label>
      <label>
        Theme
        <select
          value={settings.theme}
          onChange={(e) =>
            update({ theme: e.target.value as "light" | "dark" })
          }
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      {(["mute", "autoplay", "captions"] as const).map((k) => (
        <label className="check" key={k}>
          <input
            type="checkbox"
            checked={settings[k]}
            onChange={(e) => update({ [k]: e.target.checked })}
          />
          {k === "mute"
            ? "Mute audio"
            : k === "autoplay"
              ? "Play answers automatically"
              : "Show captions"}
        </label>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
