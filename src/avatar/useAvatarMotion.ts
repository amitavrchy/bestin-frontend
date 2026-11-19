import { useEffect, useState } from "react";

/** Small frame-driven state machine; the browser supplies the animation clock. */
export function useAvatarMotion() {
  const [motion, setMotion] = useState({ blink: false, gaze: 0 });
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (media?.matches) return;
    let frame = 0;
    let nextBlink = performance.now() + 1800 + Math.random() * 3000;
    let blinkEnd = 0;
    let secondBlink = 0;
    let nextGaze = performance.now() + 1000;
    let blinking = false;
    const tick = (now: number) => {
      if (now >= nextBlink || (secondBlink > 0 && now >= secondBlink)) {
        blinking = true;
        blinkEnd = now + 130;
        if (secondBlink) secondBlink = 0;
        else {
          if (Math.random() < 0.2) secondBlink = now + 260;
          nextBlink = now + 2500 + Math.random() * 4000;
        }
        setMotion((previous) => ({ ...previous, blink: true }));
      }
      if (blinking && now >= blinkEnd) {
        blinking = false;
        setMotion((previous) => ({ ...previous, blink: false }));
      }
      if (now >= nextGaze) {
        nextGaze = now + 1800 + Math.random() * 3500;
        setMotion((previous) => ({ ...previous, gaze: Math.random() * 4 - 2 }));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return motion;
}
