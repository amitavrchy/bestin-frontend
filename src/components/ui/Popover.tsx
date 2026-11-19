import type { ReactNode } from "react";
export function Popover({ label, children }: { label: string; children: ReactNode }) { return <details className="ui-popover"><summary>{label}</summary><div className="panel">{children}</div></details>; }
