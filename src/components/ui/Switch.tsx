import type { InputHTMLAttributes } from "react";
export function Switch(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role">) { return <input type="checkbox" role="switch" {...props} />; }
