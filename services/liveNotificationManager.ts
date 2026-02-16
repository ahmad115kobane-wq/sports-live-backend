import notifee, { AndroidImportance, AndroidCategory, AndroidStyle } from '@notifee/react-native';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { API_URL } from '@/constants/config';

// ─── Types ───────────────────────────────────────────────────────
export interface LiveMatchNotificationData {
  matchId: string;
  type?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore?: string;
  awayScore?: string;
  minute?: string;
  homePossession?: string;
  awayPossession?: string;
  competitionName?: string;
  status?: string;
  liveStartedAt?: string;
  secondHalfStartedAt?: string;
}

// ─── In-memory match state for local timer ───────────────────────
interface MatchTimerState {
  data: LiveMatchNotificationData;
  timer: ReturnType<typeof setInterval> | null;
  lastMinute: number;
}

const matchTimers = new Map<string, MatchTimerState>();
const activeNotifications = new Map<string, string>();
let liveChannelId: string | null = null;
let eventChannelId: string | null = null;

// ─── Helpers ─────────────────────────────────────────────────────
function resolveLogoUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return `${API_URL.replace('/api', '')}${url}`;
  return url;
}

function computeLocalMinute(data: LiveMatchNotificationData): number {
  const now = Date.now();
  const status = data.status;

  if (status === 'halftime' || data.type === 'end_half') return 45;
  if (status === 'extra_time_halftime') return 105;
  if (status === 'penalties') return 120;

  if (status === 'live' || !status) {
    if (data.secondHalfStartedAt) {
      const elapsed = Math.floor((now - new Date(data.secondHalfStartedAt).getTime()) / 60000);
      return Math.max(46, 46 + elapsed);
    }
    if (data.liveStartedAt) {
      const elapsed = Math.floor((now - new Date(data.liveStartedAt).getTime()) / 60000);
      return Math.max(1, 1 + elapsed);
    }
  }

  if (status === 'extra_time') {
    const base = parseInt(data.minute || '91') || 91;
    return base;
  }

  return parseInt(data.minute || '0') || 0;
}

function getStatusLine(type?: string, minute?: number, status?: string): string {
  if (status === 'halftime' || type === 'end_half' || type === 'halftime') return '⏸  استراحة الشوط الأول';
  if (status === 'extra_time_halftime') return '⏸  استراحة الأشواط الإضافية';
  if (status === 'penalties') return '⚡  ركلات الترجيح';
  if (status === 'extra_time') return `⚡  الأشواط الإضافية  •  ${minute}'`;
  if (type === 'goal') return `⚽  هدف!  •  الدقيقة ${minute}'`;
  if (type === 'red_card') return `🟥  بطاقة حمراء  •  الدقيقة ${minute}'`;
  if (type === 'penalty') return `⚠️  ركلة جزاء  •  الدقيقة ${minute}'`;
  if (type === 'match_start' || type === 'start_half') return `▶️  بدأت المباراة`;
  if (minute && minute > 0) return `🔴  مباشر  •  الدقيقة ${minute}'`;
  return '🔴  مباشر';
}

// ─── Channels ────────────────────────────────────────────────────
async function ensureLiveChannel(): Promise<string> {
  if (liveChannelId) return liveChannelId;
  if (Platform.OS === 'android') {
    liveChannelId = await notifee.createChannel({
      id: 'live-match-v3',
      name: 'المباريات المباشرة',
      description: 'إشعارات ثابتة تتحدث تلقائياً مع الوقت والنتيجة',
      importance: AndroidImportance.DEFAULT,
      sound: undefined,
      vibration: false,
    });
  } else {
    liveChannelId = 'live-match-v3';
  }
  return liveChannelId;
}

async function ensureEventChannel(): Promise<string> {
  if (eventChannelId) return eventChannelId;
  if (Platform.OS === 'android') {
    eventChannelId = await notifee.createChannel({
      id: 'match-events-v3',
      name: 'أحداث المباريات',
      description: 'أهداف، بطاقات حمراء، بداية ونهاية المباراة',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  } else {
    eventChannelId = 'match-events-v3';
  }
  return eventChannelId;
}

// ─── Display notification ────────────────────────────────────────
async function displayLiveNotification(data: LiveMatchNotificationData, minute: number): Promise<void> {
  const channelId = await ensureLiveChannel();
  const notificationId = `live-${data.matchId}`;
  const homeScore = data.homeScore ?? '0';
  const awayScore = data.awayScore ?? '0';
  const statusLine = getStatusLine(data.type, minute, data.status);
  const homeLogoUrl = resolveLogoUrl(data.homeTeamLogo);

  if (Platform.OS === 'android') {
    // Build rich inbox lines
    const inboxLines: string[] = [
      `<b>${statusLine}</b>`,
    ];

    if (data.homePossession && data.awayPossession &&
        data.homePossession !== '0' && data.awayPossession !== '0' &&
        data.homePossession !== '' && data.awayPossession !== '') {
      inboxLines.push(`📊  استحواذ:  <b>${data.homePossession}%</b>  —  <b>${data.awayPossession}%</b>`);
    }

    if (data.competitionName) {
      inboxLines.push(`🏆  ${data.competitionName}`);
    }

    await notifee.displayNotification({
      id: notificationId,
      title: `<b>${data.homeTeamName}</b>  <b>${homeScore}</b> - <b>${awayScore}</b>  <b>${data.awayTeamName}</b>`,
      body: statusLine,
      subtitle: data.competitionName || undefined,
      data: { matchId: data.matchId, type: 'live_match' },
      android: {
        channelId,
        ongoing: true,
        autoCancel: false,
        onlyAlertOnce: true,
        color: '#10B981',
        colorized: true,
        category: AndroidCategory.PROGRESS,
        pressAction: { id: 'default' },
        timestamp: Date.now(),
        showTimestamp: true,
        ...(homeLogoUrl ? { largeIcon: homeLogoUrl } : {}),
        style: {
          type: AndroidStyle.INBOX,
          lines: inboxLines,
        },
      },
    });
  } else {
    const bodyParts = [statusLine];
    if (data.homePossession && data.awayPossession &&
        data.homePossession !== '0' && data.awayPossession !== '0') {
      bodyParts.push(`📊 استحواذ: ${data.homePossession}% — ${data.awayPossession}%`);
    }
    if (data.competitionName) bodyParts.push(`🏆 ${data.competitionName}`);

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: `${data.homeTeamName}  ${homeScore} - ${awayScore}  ${data.awayTeamName}`,
        body: bodyParts.join('\n'),
        data: { matchId: data.matchId, type: 'live_match' },
        sound: undefined,
      },
      trigger: null,
    });
  }

  activeNotifications.set(data.matchId, notificationId);
}

// ─── Timer: auto-updates the minute every 30 seconds ─────────────
function startMatchTimer(matchId: string): void {
  const state = matchTimers.get(matchId);
  if (!state) return;

  // Clear existing timer
  if (state.timer) clearInterval(state.timer);

  state.timer = setInterval(() => {
    const s = matchTimers.get(matchId);
    if (!s) return;

    // Don't tick during halftime/penalties/finished
    const st = s.data.status;
    if (st === 'halftime' || st === 'extra_time_halftime' || st === 'penalties' || st === 'finished') return;

    const newMinute = computeLocalMinute(s.data);
    if (newMinute !== s.lastMinute) {
      s.lastMinute = newMinute;
      // Update notification silently with new minute
      displayLiveNotification({ ...s.data, type: 'live_update' }, newMinute).catch(() => {});
    }
  }, 30000); // Every 30 seconds
}

function stopMatchTimer(matchId: string): void {
  const state = matchTimers.get(matchId);
  if (state?.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  matchTimers.delete(matchId);
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Create or update a persistent notification for a live match.
 * Also starts a local timer to auto-update the minute.
 */
export async function showOrUpdateLiveNotification(data: LiveMatchNotificationData): Promise<void> {
  try {
    const minute = computeLocalMinute(data);

    // Update stored state (merge new data into existing)
    const existing = matchTimers.get(data.matchId);
    const merged: LiveMatchNotificationData = existing
      ? { ...existing.data, ...data, type: data.type || existing.data.type }
      : data;

    // Keep timestamps if they were received before but not in this update
    if (!merged.liveStartedAt && existing?.data.liveStartedAt) {
      merged.liveStartedAt = existing.data.liveStartedAt;
    }
    if (!merged.secondHalfStartedAt && existing?.data.secondHalfStartedAt) {
      merged.secondHalfStartedAt = existing.data.secondHalfStartedAt;
    }

    matchTimers.set(data.matchId, {
      data: merged,
      timer: existing?.timer || null,
      lastMinute: minute,
    });

    // Display the notification
    await displayLiveNotification(merged, minute);

    // Start/restart the local timer
    startMatchTimer(data.matchId);
  } catch (error) {
    console.error('Error showing live notification:', error);
  }
}

/**
 * Cancel the persistent notification for a match and stop its timer
 */
export async function cancelLiveNotification(matchId: string): Promise<void> {
  try {
    stopMatchTimer(matchId);
    const notificationId = activeNotifications.get(matchId);
    if (!notificationId) return;

    if (Platform.OS === 'android') {
      await notifee.cancelNotification(notificationId);
    } else {
      await Notifications.dismissNotificationAsync(notificationId);
    }
    activeNotifications.delete(matchId);
  } catch (error) {
    console.error('Error canceling live notification:', error);
  }
}

/**
 * Show a final "match ended" notification and remove the persistent one
 */
export async function showMatchEndedNotification(data: LiveMatchNotificationData): Promise<void> {
  try {
    await cancelLiveNotification(data.matchId);

    const homeScore = data.homeScore ?? '0';
    const awayScore = data.awayScore ?? '0';

    if (Platform.OS === 'android') {
      const channelId = await ensureEventChannel();
      const bodyLines = [
        `<b>${data.homeTeamName}</b>  ${homeScore} - ${awayScore}  <b>${data.awayTeamName}</b>`,
      ];
      if (data.competitionName) bodyLines.push(`🏆  ${data.competitionName}`);

      await notifee.displayNotification({
        title: '<b>🏁  انتهت المباراة</b>',
        body: bodyLines[0],
        data: { matchId: data.matchId, type: 'match_result' },
        android: {
          channelId,
          pressAction: { id: 'default' },
          autoCancel: true,
          color: '#8B5CF6',
          style: {
            type: AndroidStyle.INBOX,
            lines: bodyLines,
          },
        },
      });
    } else {
      const bodyParts = [`${data.homeTeamName}  ${homeScore} - ${awayScore}  ${data.awayTeamName}`];
      if (data.competitionName) bodyParts.push(`🏆 ${data.competitionName}`);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏁 انتهت المباراة',
          body: bodyParts.join('\n'),
          data: { matchId: data.matchId, type: 'match_result' },
          sound: 'default',
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Error showing match ended notification:', error);
  }
}

/**
 * Cancel all persistent live notifications and timers
 */
export async function cancelAllLiveNotifications(): Promise<void> {
  for (const [matchId] of activeNotifications) {
    await cancelLiveNotification(matchId);
  }
}

/**
 * Check if a match has an active persistent notification
 */
export function hasActiveNotification(matchId: string): boolean {
  return activeNotifications.has(matchId);
}

/**
 * Handle incoming FCM data for persistent notification
 */
export async function handleLiveMatchFCMData(data: Record<string, any>): Promise<void> {
  if (!data.matchId || !data.homeTeamName || !data.awayTeamName) return;

  const type = (data.type as string) || 'live_update';
  const isMatchEnd = type === 'match_end' || type === 'end_match';
  const status = data.status as string | undefined;
  const isFinished = status === 'finished';

  const notifData: LiveMatchNotificationData = {
    matchId: data.matchId as string,
    type,
    homeTeamName: data.homeTeamName as string,
    awayTeamName: data.awayTeamName as string,
    homeTeamLogo: data.homeTeamLogo as string | undefined,
    awayTeamLogo: data.awayTeamLogo as string | undefined,
    homeScore: data.homeScore as string | undefined,
    awayScore: data.awayScore as string | undefined,
    minute: data.minute as string | undefined,
    homePossession: data.homePossession as string | undefined,
    awayPossession: data.awayPossession as string | undefined,
    competitionName: data.competitionName as string | undefined,
    status,
    liveStartedAt: data.liveStartedAt as string | undefined,
    secondHalfStartedAt: data.secondHalfStartedAt as string | undefined,
  };

  if (isMatchEnd || isFinished) {
    await showMatchEndedNotification(notifData);
  } else {
    await showOrUpdateLiveNotification(notifData);
  }
}
