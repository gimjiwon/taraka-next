"use client";

import { useEffect, useMemo, useState } from "react";

function format(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function DeadlineTimer({ seconds, onExpire }: { seconds: number; onExpire?: () => void }) {
  const deadline = useMemo(() => Date.now() + seconds * 1000, [seconds]);
  const [remaining, setRemaining] = useState(deadline - Date.now());

  useEffect(() => {
    let expired = false;
    const tick = () => {
      const next = deadline - Date.now();
      setRemaining(next);
      if (next <= 0 && !expired) {
        expired = true;
        onExpire?.();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    window.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("visibilitychange", tick);
    };
  }, [deadline, onExpire]);

  return <strong>{format(remaining)}</strong>;
}
