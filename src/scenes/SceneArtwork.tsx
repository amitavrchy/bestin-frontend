/** Decorative artwork stays independent from the avatar so each scene can be replaced. */
export function SceneArtwork({ scene }: { scene: string }) {
  return (
    <svg
      className="scene-artwork"
      viewBox="0 0 600 440"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="scene-light"><stop stopColor="#fff3cf" stopOpacity=".55"/><stop offset="1" stopColor="#fff3cf" stopOpacity="0"/></radialGradient>
        <radialGradient id="scene-vignette"><stop offset=".55" stopColor="#17262a" stopOpacity="0"/><stop offset="1" stopColor="#17262a" stopOpacity=".25"/></radialGradient>
      </defs>
      {scene === "library" && (
        <g>
          <rect width="600" height="440" fill="#d7bca0" />
          <rect y="310" width="600" height="130" fill="#a97e68" />
          {[25, 430].map((x) => (
            <g key={x} transform={`translate(${x} 20)`}>
              <rect width="145" height="295" rx="5" fill="#755449" />
              <rect x="9" y="10" width="127" height="275" fill="#a17b68" />
              {[0, 1, 2].map((row) => (
                <g key={row} transform={`translate(13 ${20 + row * 87})`}>
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <rect
                      key={n}
                      x={n * 17}
                      y={12 + (n % 3) * 5}
                      width="14"
                      height={58 - (n % 3) * 5}
                      rx="1"
                      fill={
                        [
                          "#d5aa78",
                          "#62786d",
                          "#994f4d",
                          "#e0c7a6",
                          "#786d75",
                          "#b68565",
                          "#d4b486",
                        ][n]
                      }
                    />
                  ))}
                  <rect y="70" width="120" height="8" fill="#684a40" />
                </g>
              ))}
            </g>
          ))}
          <path d="M346 48 H414 L399 92 H361Z" fill="#f7dfae" />
          <path
            d="M380 92 V184 M357 185 H403"
            stroke="#6b564c"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx="380" cy="92" r="150" fill="url(#scene-light)" />
          {Array.from({length: 14}, (_, i) => <circle key={i} className="scene-dust" cx={180 + (i * 39) % 260} cy={40 + (i * 61) % 260} r={1 + i % 2} fill="#fff1ce" style={{animationDelay: `${i * -.7}s`}} />)}
        </g>
      )}
      {scene === "night" && (
        <g>
          <rect width="600" height="440" fill="#29334c" />
          <circle cx="452" cy="90" r="45" fill="#f6e3b8" opacity=".8" />
          {Array.from({ length: 28 }, (_, i) => (
            <circle
              className="scene-star"
              key={i}
              cx={(i * 97 + 37) % 600}
              cy={(i * 53 + 15) % 250}
              r={i % 4 === 0 ? 2.5 : 1.3}
              fill="#fff2d1"
              style={{ animationDelay: `${(i % 7) * 0.4}s` }}
            />
          ))}
          <path className="scene-shooting-star" d="M370 35 l-48 20" stroke="#fff3d4" strokeWidth="2" opacity=".8" />
          <path
            d="M0 332 Q100 265 190 319 T380 315 T600 300 V440 H0Z"
            fill="#414c64"
          />
          <path
            d="M38 330 L118 177 L195 330 M118 177 V356 M68 260 H169"
            fill="none"
            stroke="#a59c9c"
            strokeWidth="6"
            opacity=".65"
          />
          <circle cx="118" cy="170" r="12" fill="#e7cda4" />
        </g>
      )}
      {scene === "garden" && (
        <g>
          <rect width="600" height="440" fill="#d3dfc5" />
          <circle cx="490" cy="70" r="65" fill="#fff3c8" opacity=".7" />
          <path d="M0 315 Q150 255 300 315 T600 290 V440 H0Z" fill="#a7c29c" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g
              className="scene-leaf"
              key={i}
              transform={`translate(${i * 110 - 20} 0)`}
            >
              <path
                d="M30 0 Q45 75 15 145 M30 65 Q10 45 0 48 M25 100 Q50 70 65 76"
                fill="none"
                stroke="#678d70"
                strokeWidth="5"
              />
              <ellipse
                cx="2"
                cy="47"
                rx="22"
                ry="10"
                fill="#80a884"
                transform="rotate(25 2 47)"
              />
              <ellipse
                cx="61"
                cy="76"
                rx="23"
                ry="11"
                fill="#719a77"
                transform="rotate(-30 61 76)"
              />
            </g>
          ))}
          {[0, 1].map(i => <g key={i} className="scene-butterfly" style={{animationDelay: `${i * -5}s`}} transform={`translate(${90 + i * 350} ${160 + i * 50})`}><path d="M0 0 Q-15 -18 -17 -4 Q-14 7 0 3 Q14 7 17 -4 Q15 -18 0 0Z" fill="#f8d5a3"/><path d="M0 -3 V8" stroke="#8d7966" strokeWidth="2"/></g>)}
          <path
            d="M40 370 Q75 315 130 347 M470 350 Q535 310 590 370"
            fill="none"
            stroke="#739c79"
            strokeWidth="8"
          />
        </g>
      )}
      {scene === "rain" && (
        <g>
          <rect width="600" height="440" fill="#a7b6b5" />
          <rect x="55" y="20" width="490" height="325" rx="6" fill="#7f999c" />
          <path
            d="M300 20 V345 M55 190 H545"
            stroke="#d7d0bd"
            strokeWidth="12"
          />
          {Array.from({ length: 30 }, (_, i) => (
            <path
              className="scene-rain-streak"
              key={i}
              d={`M${70 + ((i * 79) % 460)} ${(i * 43) % 250} l-8 32`}
              stroke="#e8f2e9"
              strokeWidth="2"
              opacity=".5"
              style={{ animationDelay: `${(i % 9) * -0.3}s` }}
            />
          ))}
          {Array.from({length: 18}, (_, i) => <ellipse key={i} cx={75 + (i * 97) % 450} cy={30 + (i * 71) % 300} rx="2" ry="4" fill="#eff8f4" opacity=".45"/>)}
          <path d="M0 350 H600 V440 H0Z" fill="#bc9a81" />
          <path
            d="M70 350 Q90 265 126 350 M465 350 Q500 280 535 350"
            fill="#6d8175"
          />
        </g>
      )}
      {scene === "studio" && (
        <g>
          <rect width="600" height="440" fill="#eaded2" />
          <circle className="scene-blob" cx="220" cy="145" r="130" fill="#f6d8ca" opacity=".45" />
          <circle className="scene-blob" cx="390" cy="250" r="145" fill="#c7d8c9" opacity=".5" style={{animationDelay: "-5s"}} />
          <circle cx="300" cy="200" r="170" fill="#f5ece1" opacity=".7" />
          <circle
            cx="300"
            cy="200"
            r="145"
            fill="none"
            stroke="#d9c8b6"
            strokeWidth="2"
          />
          <path d="M0 350 Q300 310 600 350 V440 H0Z" fill="#d7c7ba" />
        </g>
      )}
      <rect width="600" height="440" fill="url(#scene-vignette)" pointerEvents="none" />
    </svg>
  );
}
