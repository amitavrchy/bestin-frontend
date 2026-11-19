import { useEffect, useState } from "react";
export function Toasts() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    let timer: number;
    const show = (event: Event) => {
      setMessage((event as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(""), 5000);
    };
    window.addEventListener("bestin-error", show);
    return () => {
      window.removeEventListener("bestin-error", show);
      window.clearTimeout(timer);
    };
  }, []);
  return message ? (
    <div className="toast" role="alert">
      {message}
      <button onClick={() => setMessage("")} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  ) : null;
}
