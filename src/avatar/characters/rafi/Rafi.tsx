import { useRef } from "react";
import { useAvatarDynamics } from "../../useAvatarDynamics";
import type { WordTime } from "../../../lib/types";
import { useAvatarMotion } from "../../useAvatarMotion";
import type { Viseme, VisemeId } from "../../../lib/types";
import { useLipSync } from "../../useLipSync";

export type Expression =
  "idle" | "listening" | "thinking" | "speaking" | "happy" | "confused";
import { mouths } from "./mouths";
const EMPTY_WORDS: WordTime[] = [];
const EMPTY_VISEMES: Viseme[] = [];
export function Rafi({
  audio = null,
  visemes = EMPTY_VISEMES,
  expression = "idle",
  manual,
  words = EMPTY_WORDS,
}: {
  audio?: HTMLAudioElement | null;
  visemes?: Viseme[];
  expression?: Expression;
  manual?: VisemeId;
  words?: WordTime[];
}) {
  const ref = useRef<SVGSVGElement>(null);
  useAvatarDynamics(ref, expression, audio, words, visemes);
  const shape = useLipSync(audio, visemes);
  const { blink, gaze } = useAvatarMotion();
  const isRafi = true;
  const outfit = "#526f82";
  return (
    <svg
      ref={ref}
      className={`avatar avatar-${expression}`}
      viewBox="0 0 300 360"
      role="img"
      aria-label={`${isRafi ? "Rafi" : "Bestin"}, ${expression}`}
    >
      <defs>
        <linearGradient id="skin" x2="1" y2="1">
          <stop stopColor="#dca77f" />
          <stop offset="1" stopColor="#a56a50" />
        </linearGradient>
        <radialGradient id="iris"><stop stopColor="#b3aa72" /><stop offset=".65" stopColor="#52786c" /><stop offset="1" stopColor="#304c47" /></radialGradient>
        <linearGradient id="hair" x2="1" y2="1">
          <stop stopColor="#29292d" />
          <stop offset="1" stopColor="#171b20" />
        </linearGradient>
      </defs>
      <g className="avatar-body">
        <path
          d="M37 360 Q40 274 104 260 L196 260 Q260 274 263 360"
          fill={outfit}
        />
        <path d="M102 262 Q150 305 198 262 L179 250 H121Z" fill="#f4dfbe" />
        <path
          d="M118 245 L118 273 Q150 295 182 273 L182 245"
          fill="url(#skin)"
        />
        <path
          d="M90 360 L103 285 M210 360 L197 285"
          fill="none"
          stroke="#ffffff"
          opacity=".2"
          strokeWidth="3"
        />
        <path d="M130 280 Q150 310 170 280 L162 317 H138Z" fill="#e6be89" />
        <circle cx="150" cy="319" r="4" fill="#dfc59c" />
        <path d="M188 301 h24 v30 h-24z" fill="#e8d5b5" stroke="#3a5665" strokeWidth="2" /><path d="M205 297 l-4 25" stroke="#d5a554" strokeWidth="3" />
        <path
          d="M43 337 Q64 295 96 286 M257 337 Q236 295 204 286 M107 299 L99 350 M193 299 L201 350"
          fill="none"
          stroke="#344f49"
          strokeWidth="2"
          opacity=".25"
        />
        <path
          d="M105 270 L126 292 L113 304 L99 284 M195 270 L174 292 L187 304 L201 284"
          fill="#f9e9d1"
        />
        <path
          d="M121 259 Q150 278 179 259"
          fill="none"
          stroke="#b97b69"
          opacity=".4"
          strokeWidth="3"
        />
      </g>
      <g className="avatar-head">
        <path
          d={
            isRafi
              ? "M79 156 Q67 56 128 43 Q205 23 222 105 L220 174 Q214 195 207 200 L93 200 Q81 181 79 156Z"
              : "M76 149 Q62 40 150 35 Q238 40 224 149 L230 218 Q214 259 182 256 L118 256 Q85 259 70 218Z"
          }
          fill="url(#hair)"
        />
        <ellipse cx="91" cy="168" rx="15" ry="24" fill="#dba284" />
        <ellipse cx="209" cy="168" rx="15" ry="24" fill="#dba284" />
        <path
          d="M91 126 Q93 65 150 62 Q207 65 209 126 L207 183 Q203 228 150 248 Q97 228 93 183Z"
          fill="url(#skin)"
        />
        <path
          d={
            isRafi
              ? "M91 133 Q76 84 105 59 Q123 41 143 48 Q163 29 180 47 Q209 43 214 82 L210 132 Q198 112 195 99 Q174 111 157 98 Q128 118 98 109Z"
              : "M91 133 Q80 60 132 48 Q193 25 211 94 L210 133 Q193 122 188 88 Q155 121 97 113Z"
          }
          fill="url(#hair)"
        />
        <path
          d="M101 103 Q112 67 149 60"
          fill="none"
          stroke="#b48470"
          opacity=".35"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M97 100 Q113 63 144 57 M103 108 Q132 85 161 75 M111 104 Q145 91 173 70 M193 83 Q205 107 204 128" fill="none" stroke="#929091" strokeWidth="1.4" opacity=".28" strokeLinecap="round" />
        <path d="M103 205 Q117 233 150 241 Q183 233 197 205 Q189 239 150 251 Q111 239 103 205Z" fill="#a9665a" opacity=".13" />
        <path
          d="M96 161 Q100 188 107 206 M204 161 Q200 188 193 206"
          fill="none"
          stroke="#fff0d6"
          strokeWidth="3"
          opacity=".35"
        />
        <path
          d="M87 163 Q91 152 96 164 M213 163 Q209 152 204 164"
          fill="none"
          stroke="#b97d6b"
          strokeWidth="2"
        />
        <path
          className="eyebrows"
          d="M111 140 Q123 134 136 140 M164 140 Q177 134 189 140"
          fill="none"
          stroke="#60423d"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g
          transform={`translate(${gaze} ${expression === "thinking" ? -3 : 0})`}
        >
          <ellipse
            cx="124"
            cy="153"
            rx="12"
            ry={blink ? 1 : 8}
            fill="#fffaf0"
          />
          <ellipse
            cx="176"
            cy="153"
            rx="12"
            ry={blink ? 1 : 8}
            fill="#fffaf0"
          />
          {!blink && (
            <>
              <circle cx="125" cy="153" r="5" fill="url(#iris)" />
              <circle cx="125" cy="153" r="2.4" fill="#263a35" />
              <circle cx="177" cy="153" r="5" fill="url(#iris)" />
              <circle cx="177" cy="153" r="2.4" fill="#263a35" />
              <circle cx="126" cy="151" r="1.8" fill="white" />
              <circle cx="178" cy="151" r="1.8" fill="white" />
              <circle cx="123" cy="155" r=".8" fill="#fff" opacity=".8" />
              <circle cx="175" cy="155" r=".8" fill="#fff" opacity=".8" />
            </>
          )}
        </g>
        <path
          d="M112 147 Q124 139 136 147 M164 147 Q176 139 188 147"
          fill="none"
          stroke="#65423b"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M112 159 Q124 166 136 159 M164 159 Q176 166 188 159 M112 146 l-3 -3 M115 144 l-2 -3 M185 144 l2 -3 M188 146 l3 -3" fill="none" stroke="#79524a" strokeWidth="1.2" strokeLinecap="round" opacity=".65" />
        <path
          d="M149 155 Q145 173 151 175 L155 174"
          fill="none"
          stroke="#bd806f"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <ellipse cx="112" cy="180" rx="10" ry="5" fill="#e89d92" opacity=".3" />
        <ellipse cx="188" cy="180" rx="10" ry="5" fill="#e89d92" opacity=".3" />
        <g className="mouth" aria-hidden="true">
          {(Object.keys(mouths) as VisemeId[]).map((value) => (
            <g
              key={value}
              data-viseme={value}
              className="mouth-shape"
              opacity={
                (manual || shape) === value &&
                !(expression === "happy" && !manual && shape === "X")
                  ? 1
                  : 0
              }
            >
              {mouths[value]}
            </g>
          ))}
          <g
            className="mouth-shape"
            opacity={expression === "happy" && !manual && shape === "X" ? 1 : 0}
          >
            <path
              d="M137 194 Q150 209 163 194 Q150 203 137 194"
              fill="#783d3b"
            />
          </g>
        </g>
        <path d="M108 204 Q150 235 192 204 Q184 235 150 242 Q116 235 108 204Z" fill="#493b35" opacity=".18" />
        <path d="M120 220 l3 2 m8 2 l3 2 m8 1 l3 1 m8 0 l3 -1 m8 -2 l3 -2 m8 -2 l3 -2" stroke="#493b35" opacity=".35" strokeWidth="1" />

      </g>
    </svg>
  );
}
