import { useEffect, useState } from "react";
import type { Viseme, VisemeId } from "../lib/types";

/** Cues use a half-open interval so adjacent shapes never overlap. */
export function visemeAt(cues: Viseme[], time: number): VisemeId {
  return cues.find((cue) => time >= cue.start && time < cue.end)?.value ?? "X";
}

// A media element can only be connected to one MediaElementSourceNode. Reuse
// the graph across effect restarts, including React Strict Mode's test mount.
let audioContext: AudioContext | undefined;
const analysers = new WeakMap<HTMLAudioElement, AnalyserNode>();
function analyserFor(audio: HTMLAudioElement): AnalyserNode | undefined {
  try {
    const existing = analysers.get(audio);
    if (existing) return existing;
    audioContext ??= new AudioContext();
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analysers.set(audio, analyser);
    return analyser;
  } catch {
    return undefined;
  }
}

export function useLipSync(
  audio: HTMLAudioElement | null,
  cues: Viseme[],
): VisemeId {
  const [shape, setShape] = useState<VisemeId>("X");
  useEffect(() => {
    if (!audio) return;
    let frame = 0;
    const analyser = cues.length ? undefined : analyserFor(audio);
    const data = analyser ? new Uint8Array(analyser.fftSize) : undefined;
    const resume = () => {
      if (audioContext?.state === "suspended") void audioContext.resume();
    };
    audio.addEventListener("play", resume);
    if (!audio.paused) resume();
    const tick = () => {
      let next: VisemeId = "X";
      if (!audio.paused && !audio.ended) {
        next = visemeAt(cues, audio.currentTime);
        if (analyser && data) {
          analyser.getByteTimeDomainData(data);
          const volume = Math.sqrt(
            data.reduce((sum, value) => sum + ((value - 128) / 128) ** 2, 0) /
              data.length,
          );
          next = volume > 0.12 ? "D" : volume > 0.035 ? "C" : "X";
        }
      }
      setShape(next);
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      audio.removeEventListener("play", resume);
    };
  }, [audio, cues]);
  return audio ? shape : "X";
}
