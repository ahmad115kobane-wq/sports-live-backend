import { useState, useEffect, useRef, useCallback } from 'react';
import { Match } from '@/types';

// ─── Types ───
export interface MatchTime {
  minute: number;
  seconds: number;
  display: string;       // "12:34" format
  displayMinute: string; // "12'" format (minute only)
  isTicking: boolean;
}

const PAUSED_STATUSES = ['halftime', 'extra_time_halftime', 'penalties'];
const TICKING_STATUSES = ['live', 'extra_time'];

// ─── Core: compute elapsed time from timestamps ───
function computeMatchTime(match: Match): MatchTime | null {
  if (!match) return null;

  const status = match.status;
  const now = Date.now();

  // ── Active play: compute from timestamps ──
  if (status === 'live' && match.liveStartedAt) {
    if (match.secondHalfStartedAt) {
      // Second half
      const elapsedMs = now - new Date(match.secondHalfStartedAt).getTime();
      const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
      const baseMinute = 45;
      const min = baseMinute + Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return {
        minute: min + 1,
        seconds: sec,
        display: `${min + 1}:${sec < 10 ? '0' : ''}${sec}`,
        displayMinute: `${min + 1}'`,
        isTicking: true,
      };
    }
    // First half
    const elapsedMs = now - new Date(match.liveStartedAt).getTime();
    const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return {
      minute: min + 1,
      seconds: sec,
      display: `${min + 1}:${sec < 10 ? '0' : ''}${sec}`,
      displayMinute: `${min + 1}'`,
      isTicking: true,
    };
  }

  // Extra time
  if (status === 'extra_time' && match.updatedAt) {
    const base = match.currentMinute || 91;
    const elapsedMs = now - new Date(match.updatedAt).getTime();
    const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
    const extraMin = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const min = base + extraMin;
    return {
      minute: min,
      seconds: sec,
      display: `${min}:${sec < 10 ? '0' : ''}${sec}`,
      displayMinute: `${min}'`,
      isTicking: true,
    };
  }

  // ── Paused states: fixed values, no ticking ──
  if (status === 'halftime') return fixedTime(45, 'HT');
  if (status === 'extra_time_halftime') return fixedTime(105, 'HT');
  if (status === 'penalties') return fixedTime(120, 'PEN');
  if (status === 'finished') return fixedTime(match.currentMinute || 90, 'FT');

  // Fallback to server value
  if (match.currentMinute) return fixedTime(match.currentMinute);

  return null;
}

function fixedTime(minute: number, label?: string): MatchTime {
  return {
    minute,
    seconds: 0,
    display: label || `${minute}'`,
    displayMinute: label || `${minute}'`,
    isTicking: false,
  };
}

// ─── Hook: Single match (match detail page) ───
// Ticks every second for live matches, uses ref-based updates for performance
export function useLiveMinute(match: Match | null): number | null {
  const [minute, setMinute] = useState<number | null>(null);
  const matchRef = useRef(match);
  matchRef.current = match;

  useEffect(() => {
    if (!match) { setMinute(null); return; }

    const time = computeMatchTime(match);
    setMinute(time?.minute ?? match.currentMinute ?? null);

    const isTicking = TICKING_STATUSES.includes(match.status);
    if (!isTicking) return;

    // Tick every 30s to update minute (seconds shown separately via useLiveMatchTime)
    const interval = setInterval(() => {
      const m = matchRef.current;
      if (!m) return;
      const t = computeMatchTime(m);
      setMinute(t?.minute ?? m.currentMinute ?? null);
    }, 30000);

    return () => clearInterval(interval);
  }, [match?.id, match?.status, match?.currentMinute, match?.liveStartedAt, match?.secondHalfStartedAt, match?.updatedAt]);

  return minute;
}

// ─── Hook: Single match with seconds (match detail page) ───
// Returns full MatchTime with MM:SS, ticks every second
export function useLiveMatchTime(match: Match | null): MatchTime | null {
  const [time, setTime] = useState<MatchTime | null>(null);
  const matchRef = useRef(match);
  matchRef.current = match;

  useEffect(() => {
    if (!match) { setTime(null); return; }

    const computed = computeMatchTime(match);
    setTime(computed);

    const isTicking = TICKING_STATUSES.includes(match.status);
    if (!isTicking) return;

    // Tick every second for smooth MM:SS display
    const interval = setInterval(() => {
      const m = matchRef.current;
      if (!m) return;
      const t = computeMatchTime(m);
      setTime(t);
    }, 1000);

    return () => clearInterval(interval);
  }, [match?.id, match?.status, match?.currentMinute, match?.liveStartedAt, match?.secondHalfStartedAt, match?.updatedAt]);

  return time;
}

// ─── Hook: Multiple matches (home page) ───
// Single shared interval for ALL live matches — O(n) per tick, no per-match timers
// Returns Map<matchId, MatchTime>
export function useLiveMinutes(matches: Match[]): Map<string, number> {
  const [minutes, setMinutes] = useState<Map<string, number>>(new Map());
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  useEffect(() => {
    const ACTIVE_STATUSES = [...TICKING_STATUSES, ...PAUSED_STATUSES];

    const compute = () => {
      const map = new Map<string, number>();
      for (const match of matchesRef.current) {
        if (ACTIVE_STATUSES.includes(match.status)) {
          const t = computeMatchTime(match);
          if (t) map.set(match.id, t.minute);
        }
      }
      setMinutes(map);
    };

    compute();

    const hasTicking = matches.some(m => TICKING_STATUSES.includes(m.status));
    if (!hasTicking) return;

    // Tick every 30s for home page cards (minute-level precision is enough)
    const interval = setInterval(compute, 30000);
    return () => clearInterval(interval);
  }, [matches]);

  return minutes;
}

// ─── Hook: Multiple matches with MM:SS (home page, premium) ───
// Ticks every second but uses a single shared timer for all matches
export function useLiveMatchTimes(matches: Match[]): Map<string, MatchTime> {
  const [times, setTimes] = useState<Map<string, MatchTime>>(new Map());
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  const compute = useCallback(() => {
    const ACTIVE_STATUSES = [...TICKING_STATUSES, ...PAUSED_STATUSES];
    const map = new Map<string, MatchTime>();
    for (const match of matchesRef.current) {
      if (ACTIVE_STATUSES.includes(match.status)) {
        const t = computeMatchTime(match);
        if (t) map.set(match.id, t);
      }
    }
    return map;
  }, []);

  useEffect(() => {
    setTimes(compute());

    const hasTicking = matches.some(m => TICKING_STATUSES.includes(m.status));
    if (!hasTicking) return;

    // Single 1-second interval for ALL matches
    const interval = setInterval(() => {
      setTimes(compute());
    }, 1000);

    return () => clearInterval(interval);
  }, [matches, compute]);

  return times;
}
