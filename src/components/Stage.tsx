import { useState, type CSSProperties } from "react";
import { SceneArtwork } from "../scenes/SceneArtwork";
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
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  return (
    <div
      className={`stage scene-${background}`}
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        setOffset({
          x: (event.clientX - box.left) / box.width - 0.5,
          y: (event.clientY - box.top) / box.height - 0.5,
        });
      }}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
      style={
        {
          "--scene-x": `${offset.x * 10}px`,
          "--scene-y": `${offset.y * 8}px`,
        } as CSSProperties
      }
    >
      <SceneArtwork scene={background} />
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
        YOUR READING COMPANION{" "}
        <strong>
          {character === "owl"
            ? "Owl-sage"
            : character === "rafi"
              ? "Rafi"
              : "Bestin"}
        </strong>
      </div>
    </div>
  );
}
