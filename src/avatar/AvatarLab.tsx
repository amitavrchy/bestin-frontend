import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Stage, backgrounds } from "../components/Stage";
import { VISEMES, type VisemeId, type Viseme } from "../lib/types";
import { visemeAt } from "./useLipSync";
import demoVisemes from "./demo-visemes.json";
import type { Expression } from "../components/Avatar";
export function AvatarLab() {
  const [shape, setShape] = useState<VisemeId>("X");
  const [expression, setExpression] = useState<Expression>("idle");
  const [background, setBackground] = useState("library");
  const [character, setCharacter] = useState("sage");
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (elapsed >= 2) {
        setShape("X");
        setPlaying(false);
        return;
      }
      setShape(visemeAt(demoVisemes as Viseme[], elapsed));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  function sample() {
    setPlaying(true);
  }
  return (
    <div className="page narrow">
      <Link to="/">← Back to Bestin</Link>
      <h1>Avatar lab</h1>
      <Stage
        background={background}
        character={character}
        expression={expression}
        manual={shape}
      />
      <div className="panel form-stack">
        <label>
          Viseme
          <select
            value={shape}
            onChange={(e) => setShape(e.target.value as VisemeId)}
          >
            {VISEMES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Expression
          <select
            value={expression}
            onChange={(e) => setExpression(e.target.value as Expression)}
          >
            {[
              "idle",
              "listening",
              "thinking",
              "speaking",
              "happy",
              "confused",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Scene
          <select
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          >
            {backgrounds.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Character
          <select
            value={character}
            onChange={(e) => setCharacter(e.target.value)}
          >
            {["sage", "rafi", "owl"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <button onClick={sample} disabled={playing}>
          Play sample timeline
        </button>
      </div>
    </div>
  );
}
