/**
 * Shared image URL resolution utility.
 * Ensures all image URLs returned by the API are full absolute URLs
 * that the mobile app can load directly.
 * 
 * - Relative paths (e.g. /store/img.jpg) → prepend BASE_URL
 * - Full R2/external URLs → proxy through backend to avoid CORS/access issues
 */

const BASE_URL = process.env.BASE_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')
  || 'https://sports-live.up.railway.app';

/**
 * Resolve a single image URL to a full absolute URL.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Full URL (R2 or external) → proxy through backend
  if (url.startsWith('http')) {
    return `${BASE_URL}/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  // Relative path → make absolute (served by express.static)
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Resolve image URLs in a team object (logoUrl).
 */
export function resolveTeamImages(team: any): any {
  if (!team) return team;
  return { ...team, logoUrl: resolveImageUrl(team.logoUrl) };
}

/**
 * Resolve image URLs in a competition object (logoUrl).
 */
export function resolveCompetitionImages(comp: any): any {
  if (!comp) return comp;
  return { ...comp, logoUrl: resolveImageUrl(comp.logoUrl) };
}

/**
 * Resolve image URLs in a match object (nested team + competition logos).
 */
export function resolveMatchImages(match: any): any {
  if (!match) return match;
  const resolved: any = { ...match };
  if (resolved.homeTeam) resolved.homeTeam = resolveTeamImages(resolved.homeTeam);
  if (resolved.awayTeam) resolved.awayTeam = resolveTeamImages(resolved.awayTeam);
  if (resolved.competition) resolved.competition = resolveCompetitionImages(resolved.competition);
  return resolved;
}

/**
 * Resolve image URLs in a notification object (nested match → teams/competition).
 */
export function resolveNotificationImages(notification: any): any {
  if (!notification) return notification;
  const resolved: any = { ...notification };
  if (resolved.match) resolved.match = resolveMatchImages(resolved.match);
  return resolved;
}

/**
 * Resolve image URLs in a player object (imageUrl).
 */
export function resolvePlayerImages(player: any): any {
  if (!player) return player;
  return { ...player, imageUrl: resolveImageUrl(player.imageUrl) };
}
