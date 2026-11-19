import type { ButtonHTMLAttributes } from "react";
export function IconButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }) { return <button className={`icon-button ${className}`} {...props} />; }
