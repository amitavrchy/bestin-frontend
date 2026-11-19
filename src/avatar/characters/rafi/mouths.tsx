import type { VisemeId } from "../../../lib/types";
export const mouths: Record<VisemeId, React.ReactNode> = {
  X: (
    <path
      d="M138 195 Q150 199 162 195"
      fill="none"
      stroke="#70433c"
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
      <ellipse cx="150" cy="199" rx="10" ry="12" fill="#633238" />
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
      <ellipse cx="150" cy="198" rx="7" ry="8" fill="#9a5c4c" />
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
