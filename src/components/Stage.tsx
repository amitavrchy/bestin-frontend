import { Avatar, type Expression } from "./Avatar";
import type { Viseme, VisemeId } from "../types";
export const backgrounds = [
  "library",
  "night",
  "garden",
  "studio",
  "rain",
] as const;
export function Stage({
  background,
  character,
  audio,
  visemes,
  expression,
  manual,
}: {
  background: string;
  character: string;
  audio?: HTMLAudioElement | null;
  visemes?: Viseme[];
  expression?: Expression;
  manual?: VisemeId;
}) {
  return (
    <div className={`stage scene-${background}`}>
      <div className="scene-decor" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="stage-halo" />
      <Avatar
        character={character}
        audio={audio}
        visemes={visemes}
        expression={expression}
        manual={manual}
      />
      <div className="stage-caption">
        YOUR READING COMPANION <strong>Bestin</strong>
      </div>
    </div>
  );
}
