import { KeyboardEvent } from 'react';

export function formatDuration(durationSec: number) {
  const min = Math.floor(durationSec / 60);
  const sec = durationSec % 60;
  return min > 0 ? `${min}\u200Am ${sec}\u200As` : `${sec}\u200As`;
}

export function isEnterOrSpace(e: KeyboardEvent) {
  // Older browsers may return "Spacebar" instead of " " for the Space Bar key. Firefox did so until version 37, as did Internet Explorer 9, 10, and 11.
  return e.key === 'Enter' || e.key === 'Spacebar' || e.key === ' ';
}