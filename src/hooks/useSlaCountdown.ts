import { useEffect, useState } from "react";

export function useSlaCountdown(createdAt: string, responseTime: number) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
    return Math.max(0, responseTime - Math.floor(elapsed));
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  return secondsLeft;
}
