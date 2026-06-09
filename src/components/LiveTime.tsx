import { useEffect, useState } from 'react';

/**
 * Live local time for the studio location (Eindhoven, NL).
 * Uses Europe/Amsterdam timezone via Intl so it stays correct
 * regardless of the visitor's clock or DST.
 *
 * Re-renders aligned to the next real minute boundary, then once per
 * minute — no per-second waste since we only display HH:MM.
 */

const TIME_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const DAY_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Amsterdam',
  weekday: 'short',
});

function readNow() {
  const now = new Date();
  return {
    time: TIME_FMT.format(now),
    day: DAY_FMT.format(now).toUpperCase(),
  };
}

export default function LiveTime() {
  const [parts, setParts] = useState(readNow);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    // Align the first tick to the next real minute boundary
    // so the display flips at the moment the clock actually changes.
    const now = new Date();
    const msToNextMinute =
      60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());

    const timeoutId = setTimeout(() => {
      setParts(readNow());
      intervalId = setInterval(() => setParts(readNow()), 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <span
      className="live-time"
      aria-label={`Local time ${parts.time} on ${parts.day} in Eindhoven, Netherlands`}
    >
      <span aria-hidden="true">
        ( {parts.time}&nbsp;&nbsp;{parts.day}&nbsp;&nbsp;EINDHOVEN, NL )
      </span>
    </span>
  );
}
