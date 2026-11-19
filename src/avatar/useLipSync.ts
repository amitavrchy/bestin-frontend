import { useEffect, useState } from "react";
import type { Viseme, VisemeId } from "../types";
export function visemeAt(cues: Viseme[], time: number): VisemeId {
  return cues.find((c) => time >= c.start && time < c.end)?.value || "X";
}
export function useLipSync(
  audio: HTMLAudioElement | null,
  cues: Viseme[],
): VisemeId {
  const [shape, setShape] = useState<VisemeId>("X");
  useEffect(() => {
    if (!audio) {
      setShape("X");
      return;
    }
    let frame = 0;
    let context: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    let data: Uint8Array<ArrayBuffer> | undefined;
    if (!cues.length) {
      try {
        context = new AudioContext();
        const source = context.createMediaElementSource(audio);
        analyser = context.createAnalyser();
        source.connect(analyser);
        analyser.connect(context.destination);
        data = new Uint8Array(analyser.fftSize);
      } catch {
        /* timeline remains closed if audio analysis is unavailable */
      }
    }
    const tick = () => {
      let next: VisemeId = "X";
      if (!audio.paused && !audio.ended) {
        next = visemeAt(cues, audio.currentTime);
        if (analyser && data) {
          analyser.getByteTimeDomainData(data);
          const volume = Math.sqrt(
            data.reduce((n, v) => n + ((v - 128) / 128) ** 2, 0) / data.length,
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
      void context?.close();
    };
  }, [audio, cues]);
  return shape;
}
