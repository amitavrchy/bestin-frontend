import type { Expression } from "../components/Avatar";
import type { VisemeId } from "../lib/types";

/** A separate silhouette for the owl professor, sharing the same expression and speech cues. */
export function Owl({
  expression,
  shape,
  blink,
}: {
  expression: Expression;
  shape: VisemeId;
  blink: boolean;
}) {
  const open = shape !== "X" && shape !== "A";
  return (
    <svg
      className={`avatar avatar-${expression}`}
      viewBox="0 0 300 360"
      role="img"
      aria-label={`Owl-sage, ${expression}`}
    >
      <defs>
        <linearGradient id="owl-feathers" x2="1" y2="1">
          <stop stopColor="#c99968" />
          <stop offset="1" stopColor="#765451" />
        </linearGradient>
        <linearGradient id="owl-vest" x2="0" y2="1">
          <stop stopColor="#637f79" />
          <stop offset="1" stopColor="#344e50" />
        </linearGradient>
      </defs>
      <g className="avatar-body">
        <path
          d="M40 360 Q41 276 92 257 Q150 237 208 257 Q259 276 260 360Z"
          fill="url(#owl-vest)"
        />
        <path d="M88 269 Q150 317 212 269 L201 360 H99Z" fill="#e8cda4" />
        <path
          d="M95 275 L120 300 L109 360 H68 Q70 306 95 275 M205 275 L180 300 L191 360 H232 Q230 306 205 275"
          fill="#4f6e6c"
        />
        <path
          d="M119 300 L150 318 L181 300 M150 318 V360"
          fill="none"
          stroke="#c0a47e"
          strokeWidth="2"
        />
        <circle cx="150" cy="335" r="3" fill="#a77a4c" />
        <circle cx="150" cy="350" r="3" fill="#a77a4c" />
        <path
          d="M71 307 Q55 319 51 350 M229 307 Q245 319 249 350"
          fill="none"
          stroke="#90a59b"
          strokeWidth="3"
          opacity=".6"
        />
      </g>
      <g className="avatar-head">
        <path
          d="M76 113 L67 53 Q91 60 111 77 Q150 62 189 77 Q209 60 233 53 L224 113 Q239 145 226 207 Q218 250 150 268 Q82 250 74 207 Q61 145 76 113Z"
          fill="url(#owl-feathers)"
        />
        <path
          d="M76 113 L76 71 L102 88 M224 113 L224 71 L198 88"
          fill="#e1ba91"
          opacity=".5"
        />
        <path
          d="M82 157 Q79 99 119 102 Q141 102 150 130 Q159 102 181 102 Q221 99 218 157 Q218 209 179 222 Q161 226 150 206 Q139 226 121 222 Q82 209 82 157Z"
          fill="#f2dfbf"
        />
        <path
          d="M98 111 Q119 94 142 118 M158 118 Q181 94 202 111"
          fill="none"
          stroke="#9b6b55"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse cx="119" cy="157" rx="22" ry={blink ? 2 : 24} fill="#fffaf0" />
        <ellipse cx="181" cy="157" rx="22" ry={blink ? 2 : 24} fill="#fffaf0" />
        {!blink && (
          <>
            <circle cx="121" cy="159" r="12" fill="#b57e41" />
            <circle cx="179" cy="159" r="12" fill="#b57e41" />
            <circle cx="122" cy="159" r="7" fill="#302b2b" />
            <circle cx="178" cy="159" r="7" fill="#302b2b" />
            <circle cx="125" cy="155" r="3" fill="white" />
            <circle cx="181" cy="155" r="3" fill="white" />
          </>
        )}
        <g fill="none" stroke="#786044" strokeWidth="3">
          <circle cx="119" cy="157" r="28" />
          <circle cx="181" cy="157" r="28" />
          <path d="M147 155 Q150 151 153 155 M91 152 L78 148 M209 152 L222 148" />
        </g>
        <path
          d={
            open
              ? "M139 187 Q150 182 161 187 L150 204Z"
              : "M139 187 Q150 183 161 187 L150 195Z"
          }
          fill="#c58b48"
          stroke="#98653c"
          strokeWidth="2"
        />
        {open && (
          <path d="M144 190 Q150 194 156 190 L150 199Z" fill="#6e3939" />
        )}
        <path
          d="M98 213 Q111 227 126 229 M202 213 Q189 227 174 229 M130 244 Q150 251 170 244"
          fill="none"
          stroke="#d7b991"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M80 131 L73 125 M83 140 L72 137 M220 131 L227 125 M217 140 L228 137"
          stroke="#8d6352"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
