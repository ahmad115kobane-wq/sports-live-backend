/**
 * Shared image URL resolution utility.
 * Ensures all image URLs returned by the API are full absolute URLs
 * that the mobile app can load directly.
 * 
 * - Relative paths (e.g. /store/img.jpg) → prepend BASE_URL
 * - R2 URLs → rewrite to /api/r2/<key> so backend streams them via S3 client
 * - Other external URLs → pass through as-is
 */

const BASE_URL = process.env.BASE_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')
  || 'https://sports-live.up.railway.app';

const _R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

/**
 * Resolve a single image URL to a full absolute URL.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // R2 URL → rewrite to backend proxy path (uses S3 GetObject, no fetch needed)
  if (_R2_PUBLIC_URL && url.startsWith(_R2_PUBLIC_URL)) {
    const key = url.replace(`${_R2_PUBLIC_URL}/`, '');
    return `${BASE_URL}/api/r2/${key}`;
  }
  // Other external URL → pass through as-is
  if (url.startsWith('http')) return url;
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
