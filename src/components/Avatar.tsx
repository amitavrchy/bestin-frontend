import { useAvatarMotion } from "../avatar/useAvatarMotion";
import type { Viseme, VisemeId } from "../lib/types";
import { useLipSync } from "../avatar/useLipSync";
import { Owl } from "../avatar/Owl";
export { visemeAt, useLipSync } from "../avatar/useLipSync";
export type Expression =
  "idle" | "listening" | "thinking" | "speaking" | "happy" | "confused";
const mouths: Record<VisemeId, React.ReactNode> = {
  X: (
    <path
      d="M139 195 Q150 201 161 195"
      fill="none"
      stroke="#783d3b"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  ),
  A: <path d="M140 196 Q150 192 160 196 Q150 201 140 196" fill="#713e40" />,
  B: (
    <path
      d="M137 194 Q150 190 163 194 Q159 204 150 204 Q141 204 137 194"
      fill="#67363a"
    />
  ),
  C: (
    <>
      <path
        d="M139 193 Q150 188 161 193 Q162 207 150 208 Q138 207 139 193"
        fill="#633238"
      />
      <path d="M142 194 Q150 196 158 194" stroke="#fff6e7" strokeWidth="3" />
    </>
  ),
  D: (
    <>
      <ellipse cx="150" cy="199" rx="12" ry="14" fill="#633238" />
      <path d="M141 192 Q150 195 159 192" stroke="#fff6e7" strokeWidth="3" />
      <path d="M144 208 Q150 202 156 208" fill="#dd777b" />
    </>
  ),
  E: (
    <>
      <path
        d="M135 194 Q150 189 165 194 Q160 204 150 204 Q140 204 135 194"
        fill="#633238"
      />
      <path d="M139 194 Q150 197 161 194" stroke="#fff6e7" strokeWidth="3" />
    </>
  ),
  F: (
    <>
      <ellipse cx="150" cy="198" rx="7" ry="8" fill="#a95d5d" />
      <ellipse cx="150" cy="198" rx="3.5" ry="5" fill="#633238" />
    </>
  ),
  G: (
    <>
      <path
        d="M138 194 Q150 190 162 194 L159 200 Q150 204 141 200Z"
        fill="#793d40"
      />
      <path d="M141 195 H159" stroke="#fff6e7" strokeWidth="3" />
      <path
        d="M142 202 Q150 206 158 202"
        fill="none"
        stroke="#c56f70"
        strokeWidth="2"
      />
    </>
  ),
  H: (
    <>
      <ellipse cx="150" cy="199" rx="9" ry="12" fill="#633238" />
      <path d="M146 206 Q150 202 154 206" stroke="#df8888" strokeWidth="3" />
    </>
  ),
};
const EMPTY_VISEMES: Viseme[] = [];
export function Avatar({
  audio = null,
  visemes = EMPTY_VISEMES,
  expression = "idle",
  character = "sage",
  manual,
}: {
  audio?: HTMLAudioElement | null;
  visemes?: Viseme[];
  expression?: Expression;
  character?: string;
  manual?: VisemeId;
}) {
  const shape = useLipSync(audio, visemes);
  const { blink, gaze } = useAvatarMotion();
  const isRafi = character === "rafi";
  const outfit =
    character === "rafi" || character === "rose"
      ? "#ad6b70"
      : character === "ocean"
        ? "#577f91"
        : "#718b71";
  if (character === "owl")
    return (
      <Owl expression={expression} shape={manual || shape} blink={blink} />
    );
  return (
    <svg
      className={`avatar avatar-${expression}`}
      viewBox="0 0 300 360"
      role="img"
      aria-label={`${isRafi ? "Rafi" : "Bestin"}, ${expression}`}
    >
      <defs>
        <linearGradient id="skin" x2="1" y2="1">
          <stop stopColor="#ffe0bd" />
          <stop offset="1" stopColor="#d99b7f" />
        </linearGradient>
        <linearGradient id="hair" x2="1" y2="1">
          <stop stopColor="#694940" />
          <stop offset="1" stopColor="#362b30" />
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
          d="M91 126 Q93 65 150 62 Q207 65 209 126 L205 182 Q199 237 150 251 Q101 237 95 182Z"
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
              <circle cx="125" cy="153" r="5" fill="#496459" />
              <circle cx="177" cy="153" r="5" fill="#496459" />
              <circle cx="126" cy="151" r="1.8" fill="white" />
              <circle cx="178" cy="151" r="1.8" fill="white" />
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
        <g fill="none" stroke="#806d5a" strokeWidth="2" opacity=".8">
          <circle cx="124" cy="154" r="17" />
          <circle cx="176" cy="154" r="17" />
          <path d="M141 153 Q150 148 159 153 M107 151 L93 147 M193 151 L207 147" />
        </g>
      </g>
    </svg>
  );
}
