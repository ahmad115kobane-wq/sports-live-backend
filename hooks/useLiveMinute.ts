import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// ─── Hook: Shared countdown for upcoming matches (HH:MM:SS) ───
// Single timer for ALL upcoming matches within 24h
// Uses ref-based comparison to avoid unnecessary re-renders
export function useCountdowns(matches: Match[]): Map<string, string> {
  const [countdowns, setCountdowns] = useState<Map<string, string>>(new Map());
  const matchesRef = useRef(matches);
  const prevResultRef = useRef<Map<string, string>>(new Map());
  matchesRef.current = matches;

  const computeAndSet = useCallback(() => {
    const map = new Map<string, string>();
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    for (const match of matchesRef.current) {
      if (match.status !== 'scheduled') continue;
      const diff = new Date(match.startTime).getTime() - now;
      if (diff <= 0 || diff > DAY) continue;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      // Show HH:MM only (no seconds) to reduce re-renders
      map.set(match.id, `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    // Only update state if values actually changed
    const prev = prevResultRef.current;
    if (map.size !== prev.size) {
      prevResultRef.current = map;
      setCountdowns(map);
      return;
    }
    let changed = false;
    for (const [id, val] of map) {
      if (prev.get(id) !== val) { changed = true; break; }
    }
    if (changed) {
      prevResultRef.current = map;
      setCountdowns(map);
    }
  }, []);

  useEffect(() => {
    computeAndSet();

    const hasUpcoming = matches.some(m => {
      if (m.status !== 'scheduled') return false;
      const diff = new Date(m.startTime).getTime() - Date.now();
      return diff > 0 && diff <= 24 * 60 * 60 * 1000;
    });
    if (!hasUpcoming) return;

    // Tick every 60s — minute-level countdown is sufficient
    const interval = setInterval(computeAndSet, 60000);
    return () => clearInterval(interval);
  }, [matches, computeAndSet]);

  return countdowns;
}

// ─── Hook: Multiple matches with MM:SS (home page, premium) ───
// Ticks every second but uses a single shared timer for all matches
// Uses ref-based comparison to avoid unnecessary re-renders
export function useLiveMatchTimes(matches: Match[]): Map<string, MatchTime> {
  const [times, setTimes] = useState<Map<string, MatchTime>>(new Map());
  const matchesRef = useRef(matches);
  const prevResultRef = useRef<Map<string, MatchTime>>(new Map());
  matchesRef.current = matches;

  const ACTIVE = useMemo(() => [...TICKING_STATUSES, ...PAUSED_STATUSES], []);

  const computeAndSet = useCallback(() => {
    const map = new Map<string, MatchTime>();
    for (const match of matchesRef.current) {
      if (ACTIVE.includes(match.status)) {
        const t = computeMatchTime(match);
        if (t) map.set(match.id, t);
      }
    }
    // Only update state if values actually changed
    const prev = prevResultRef.current;
    if (map.size !== prev.size) {
      prevResultRef.current = map;
      setTimes(map);
      return;
    }
    let changed = false;
    for (const [id, time] of map) {
      const p = prev.get(id);
      if (!p || p.minute !== time.minute || p.displayMinute !== time.displayMinute) {
        changed = true;
        break;
      }
    }
    if (changed) {
      prevResultRef.current = map;
      setTimes(map);
    }
  }, [ACTIVE]);

  useEffect(() => {
    computeAndSet();

    const hasTicking = matches.some(m => TICKING_STATUSES.includes(m.status));
    if (!hasTicking) return;

    // Tick every 30s — minute-level precision is enough for card display
    const interval = setInterval(computeAndSet, 30000);
    return () => clearInterval(interval);
  }, [matches, computeAndSet]);

  return times;
}
