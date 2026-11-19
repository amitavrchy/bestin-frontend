import type { ProgressHTMLAttributes } from "react";
export function ProgressBar(props: ProgressHTMLAttributes<HTMLProgressElement>) { return <progress max={1} {...props} />; }
