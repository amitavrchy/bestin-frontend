import { useEffect, useState } from "react";
import type { VisemeCue, VisemeId } from "../types";
import { asViseme } from "../types";

type AvatarProps = {
  visemes: VisemeCue[];
  audio: HTMLAudioElement | null;
};

function visemeAt(visemes: VisemeCue[], time: number): VisemeId {
  for (const cue of visemes) {
    if (time >= cue.start && time < cue.end) {
      return asViseme(cue.viseme);
    }
  }
  return "X";
}

function Mouth({ viseme }: { viseme: VisemeId }) {
  // All mouths share the same jaw anchor so swaps stay smooth.
  switch (viseme) {
    case "A":
      // Closed lips (M, B, P)
      return (
        <g>
          <path d="M86 148c10 6 28 6 38 0" fill="none" stroke="#8a3d45" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M90 147.5c8 3.5 22 3.5 30 0" fill="none" stroke="#c46b4a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    case "B":
      // Slight opening
      return (
        <g>
          <ellipse cx="105" cy="149" rx="16" ry="4.2" fill="#6b2c34" />
          <ellipse cx="105" cy="148.2" rx="14" ry="2.2" fill="#c45a62" />
        </g>
      );
    case "C":
      // Open (EH, AE)
      return (
        <g>
          <ellipse cx="105" cy="150" rx="15" ry="7.5" fill="#6b2c34" />
          <ellipse cx="105" cy="151.6" rx="11" ry="4.2" fill="#3a1418" />
          <path d="M94 147.2c7 2.4 15 2.4 22 0" fill="none" stroke="#e08a90" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case "D":
      // Wide open
      return (
        <g>
          <ellipse cx="105" cy="151" rx="15.5" ry="10.5" fill="#6b2c34" />
          <ellipse cx="105" cy="153.2" rx="11.5" ry="6.8" fill="#3a1418" />
          <path d="M94 146.2c7 2.8 16 2.8 22 0" fill="none" stroke="#e08a90" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    case "E":
      // Slightly rounded (ER)
      return (
        <g>
          <ellipse cx="105" cy="149.5" rx="12" ry="6" fill="#6b2c34" />
          <ellipse cx="105" cy="150.6" rx="8" ry="3.4" fill="#3a1418" />
        </g>
      );
    case "F":
      // Puckered (UW, W, OW)
      return (
        <g>
          <ellipse cx="105" cy="149.5" rx="8" ry="6.4" fill="#8a3d45" />
          <ellipse cx="105" cy="150.4" rx="5" ry="3.6" fill="#3a1418" />
        </g>
      );
    case "G":
      // Teeth on lip (F, V)
      return (
        <g>
          <path d="M91 146.5h28c1.2 0 2 .8 2 1.8 0 2.4-7 5.6-16 5.6s-16-3.2-16-5.6c0-1 .8-1.8 2-1.8Z" fill="#8a3d45" />
          <rect x="95" y="146.4" width="20" height="3.4" rx="0.6" fill="#f4efe6" />
        </g>
      );
    case "H":
      // Tongue toward teeth (L, TH)
      return (
        <g>
          <ellipse cx="105" cy="150" rx="14.5" ry="7" fill="#6b2c34" />
          <path d="M96 151.5c3 3.6 15 3.6 18 0-2 4-16 4-18 0Z" fill="#e08a90" />
          <path d="M94 146.6c7 2 15 2 22 0" fill="none" stroke="#f4efe6" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
        </g>
      );
    default:
      // Idle rest
      return (
        <g>
          <path d="M90 148c8 5.5 22 5.5 30 0" fill="none" stroke="#8a3d45" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
  }
}

export function Avatar({ visemes, audio }: AvatarProps) {
  const [viseme, setViseme] = useState<VisemeId>("X");
  const [blinking, setBlinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let raf = 0;
    const element = audio;
    if (!element) {
      setViseme("X");
      setSpeaking(false);
      return;
    }

    const tick = () => {
      const current = visemeAt(visemes, element.currentTime);
      setViseme(current);
      if (!element.paused && !element.ended) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onPlay = () => {
      setSpeaking(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onStop = () => {
      setSpeaking(false);
      setViseme("X");
      cancelAnimationFrame(raf);
    };

    element.addEventListener("play", onPlay);
    element.addEventListener("playing", onPlay);
    element.addEventListener("pause", onStop);
    element.addEventListener("ended", onStop);
    if (!element.paused && !element.ended) onPlay();

    return () => {
      cancelAnimationFrame(raf);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("playing", onPlay);
      element.removeEventListener("pause", onStop);
      element.removeEventListener("ended", onStop);
    };
  }, [audio, visemes]);

  useEffect(() => {
    let timer = 0;
    let held = 0;
    const schedule = () => {
      const wait = 2800 + Math.random() * 3200;
      timer = window.setTimeout(() => {
        setBlinking(true);
        held = window.setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 140);
      }, wait);
    };
    schedule();
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(held);
    };
  }, []);

  return (
    <div className={`avatar-stage${speaking ? " is-speaking" : ""}`}>
      <div className="avatar-bob">
        <svg className="avatar-svg" viewBox="0 0 210 280" role="img" aria-label="Bestin, an illustrated storyteller">
          <defs>
            <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f3c9a7" />
              <stop offset="100%" stopColor="#e4b08d" />
            </linearGradient>
            <linearGradient id="sweater" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2c5c57" />
              <stop offset="100%" stopColor="#1f3d3a" />
            </linearGradient>
            <linearGradient id="hair" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#2a211c" />
              <stop offset="100%" stopColor="#15110f" />
            </linearGradient>
            <radialGradient id="blush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e89884" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#e89884" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* backdrop glow */}
          <ellipse cx="105" cy="250" rx="78" ry="16" fill="#1f3d3a" opacity="0.12" />

          {/* torso */}
          <path d="M40 248c8-52 28-78 65-78s57 26 65 78v12H40v-12Z" fill="url(#sweater)" />
          <path d="M86 172c6 14 32 14 38 0 2 18-8 28-19 28s-21-10-19-28Z" fill="#d7c4a3" />
          <path d="M78 176c10 8 44 8 54 0 4 10-2 22-12 28H90c-10-6-16-18-12-28Z" fill="#c46b4a" opacity="0.95" />

          {/* neck */}
          <path d="M92 156c2 16 8 24 13 24s11-8 13-24" fill="url(#skin)" />

          {/* ears */}
          <ellipse cx="52" cy="122" rx="10" ry="14" fill="#e4b08d" />
          <ellipse cx="158" cy="122" rx="10" ry="14" fill="#e4b08d" />
          <ellipse cx="52" cy="123" rx="5.5" ry="8" fill="#d49278" />
          <ellipse cx="158" cy="123" rx="5.5" ry="8" fill="#d49278" />

          {/* head */}
          <ellipse cx="105" cy="120" rx="54" ry="62" fill="url(#skin)" />

          {/* hair back */}
          <path
            d="M50 118c-2-48 22-78 55-80 34-2 60 26 61 74 0 12-2 18-6 18-2-22-10-38-22-46-6 18-20 28-34 28s-28-10-34-28c-10 8-18 24-20 48-4 0-6-6-0-14Z"
            fill="url(#hair)"
          />

          {/* freckles + blush */}
          <ellipse cx="70" cy="138" rx="14" ry="8" fill="url(#blush)" />
          <ellipse cx="140" cy="138" rx="14" ry="8" fill="url(#blush)" />
          <circle cx="68" cy="136" r="1.1" fill="#c47b5a" />
          <circle cx="74" cy="140" r="1" fill="#c47b5a" />
          <circle cx="63" cy="141" r="0.9" fill="#c47b5a" />
          <circle cx="142" cy="136" r="1.1" fill="#c47b5a" />
          <circle cx="136" cy="140" r="1" fill="#c47b5a" />
          <circle cx="147" cy="141" r="0.9" fill="#c47b5a" />

          {/* brows */}
          <path d="M70 104c8-6 20-6 26-1" fill="none" stroke="#2a211c" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M114 103c8-6 20-6 26-1" fill="none" stroke="#2a211c" strokeWidth="2.6" strokeLinecap="round" />

          {/* eyes */}
          <g className={blinking ? "is-blinking" : undefined}>
            <ellipse className="eye-white" cx="82" cy="118" rx="11" ry="8.5" fill="#f8f4ee" />
            <ellipse className="eye-white" cx="128" cy="118" rx="11" ry="8.5" fill="#f8f4ee" />
            <circle cx="83" cy="119" r="5.4" fill="#2c5c57" />
            <circle cx="129" cy="119" r="5.4" fill="#2c5c57" />
            <circle cx="83" cy="119" r="2.4" fill="#15110f" />
            <circle cx="129" cy="119" r="2.4" fill="#15110f" />
            <circle cx="81" cy="117" r="1.2" fill="#ffffff" />
            <circle cx="127" cy="117" r="1.2" fill="#ffffff" />
            <rect className="eyelid" x="70" y="108" width="24" height="20" rx="8" fill="#e4b08d" />
            <rect className="eyelid" x="116" y="108" width="24" height="20" rx="8" fill="#e4b08d" />
          </g>

          {/* glasses */}
          <circle cx="82" cy="119" r="15" fill="none" stroke="#2a211c" strokeWidth="2" />
          <circle cx="128" cy="119" r="15" fill="none" stroke="#2a211c" strokeWidth="2" />
          <path d="M97 119h16" stroke="#2a211c" strokeWidth="2" />
          <path d="M67 116l-12-4" stroke="#2a211c" strokeWidth="2" strokeLinecap="round" />
          <path d="M143 116l12-4" stroke="#2a211c" strokeWidth="2" strokeLinecap="round" />

          {/* nose */}
          <path d="M105 122c3 10 8 14 8 16" fill="none" stroke="#c47b5a" strokeWidth="2" strokeLinecap="round" />

          <Mouth viseme={viseme} />

          {/* hair front */}
          <path d="M58 96c10-28 28-40 48-40 8 0 20 3 28 10-16 2-26 14-28 28-8-16-26-22-48 2Z" fill="url(#hair)" />
          <path d="M138 72c10 4 18 14 22 26 6-10 8-22 4-34-8 0-16 2-26 8Z" fill="url(#hair)" />
        </svg>
      </div>
      <p className="avatar-caption">{speaking ? "Speaking" : "Listening"}</p>
    </div>
  );
}
