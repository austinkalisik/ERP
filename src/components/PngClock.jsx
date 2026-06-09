import { useEffect, useState } from "react";

const timeZone = "Pacific/Port_Moresby";

function formatPngTime(date) {
  return new Intl.DateTimeFormat("en-PG", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export default function PngClock({ compact = false }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={compact ? "png-clock-widget compact" : "png-clock-widget"}>
      <span>Papua New Guinea Time</span>
      <strong>{formatPngTime(now)}</strong>
    </div>
  );
}
