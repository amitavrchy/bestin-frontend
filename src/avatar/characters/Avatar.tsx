import type { Viseme, VisemeId, WordTime } from "../../lib/types";
import { useLipSync } from "../useLipSync";
import { useAvatarMotion } from "../useAvatarMotion";
import { Bestin } from "./bestin/Bestin";
import { Rafi } from "./rafi/Rafi";
import { Sage } from "./sage/Sage";
export type Expression = "idle" | "listening" | "thinking" | "speaking" | "happy" | "confused";
const EMPTY: Viseme[] = [];
export function Avatar(props: { audio?: HTMLAudioElement | null; visemes?: Viseme[]; expression?: Expression; character?: string; manual?: VisemeId; words?: WordTime[] }) {
  const shape = useLipSync(props.audio ?? null, props.visemes ?? EMPTY);
  const { blink } = useAvatarMotion();
  if (props.character === "owl") return <Sage expression={props.expression ?? "idle"} shape={props.manual || shape} blink={blink} audio={props.audio} words={props.words} visemes={props.visemes} />;
  return props.character === "rafi" ? <Rafi {...props} /> : <Bestin {...props} />;
}
