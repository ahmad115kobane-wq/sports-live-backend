import { User, Match } from '@prisma/client';
import { notificationTemplates, getUserLanguage } from '../utils/notification-templates';
import { sendFCMNotification, sendFCMMulticastNotification } from './firebase.service';
import prisma from '../utils/prisma';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

/**
 * الحصول على الفرق المفضلة من preferences
 */
function getFavoriteTeams(user: User): string[] {
  if (!user.preferences) return [];
  
  try {
    const prefs = JSON.parse(user.preferences);
    return prefs.favoriteTeams || [];
  } catch {
    return [];
  }
}

/**
 * الحصول على جميع المستخدمين المهتمين بمباراة معينة
 * يشمل: 1) من لديهم فرق المباراة في preferences.favoriteTeams
 *        2) من أضافوا المباراة نفسها للمفضلة في جدول Favorite
 */
async function getInterestedUsers(match: Match): Promise<User[]> {
  // 1) جلب كل المستخدمين الذين لديهم push token
  const allUsersWithToken = await prisma.user.findMany({
    where: { pushToken: { not: null } },
  });

  // 2) فلترة من لديهم الفريق في preferences
  const teamInterestedUsers = allUsersWithToken.filter(user => {
    const favoriteTeams = getFavoriteTeams(user);
    return favoriteTeams.includes(match.homeTeamId) || favoriteTeams.includes(match.awayTeamId);
  });

  // 3) جلب المستخدمين الذين أضافوا المباراة للمفضلة من جدول Favorite
  const matchFavorites = await prisma.favorite.findMany({
    where: { matchId: match.id },
    select: { userId: true },
  });
  const matchFavUserIds = new Set(matchFavorites.map(f => f.userId));

  // 4) إضافة مستخدمي المفضلة الذين لديهم push token ولم يكونوا في القائمة
  const teamUserIds = new Set(teamInterestedUsers.map(u => u.id));
  const additionalUsers = allUsersWithToken.filter(
    user => matchFavUserIds.has(user.id) && !teamUserIds.has(user.id)
  );

  const combined = [...teamInterestedUsers, ...additionalUsers];
  
  // 5) إزالة التكرار بناءً على pushToken لتجنب إرسال عدة إشعارات لنفس الجهاز
  const seenTokens = new Set<string>();
  const uniqueUsers = combined.filter(user => {
    if (!user.pushToken || seenTokens.has(user.pushToken)) {
      return false;
    }
    seenTokens.add(user.pushToken);
    return true;
  });

  console.log(`👥 Interested users for match ${match.id}: ${teamInterestedUsers.length} (teams) + ${additionalUsers.length} (match fav) = ${combined.length} total, ${uniqueUsers.length} unique tokens`);
  return uniqueUsers;
}

/**
 * إرسال إشعار Push لعدة مستخدمين
 */
export async function sendPushNotification(
  pushTokens: string[],
  payload: NotificationPayload
): Promise<void> {
  if (pushTokens.length === 0) {
    console.log('⚠️ No push tokens to send notifications');
    return;
  }

  const validTokens = pushTokens.filter(token => token && token.trim().length > 0);
  
  if (validTokens.length === 0) {
    console.log('⚠️ No valid push tokens after filtering');
    return;
  }

  try {
    const result = await sendFCMMulticastNotification({
      tokens: validTokens,
      title: payload.title,
      body: payload.body,
      data: payload.data ? convertDataToStrings(payload.data) : undefined,
      imageUrl: payload.imageUrl,
    });

    console.log(`✅ Sent ${result.successCount} notifications, ${result.failureCount} failed`);

    if (result.invalidTokens.length > 0) {
      await prisma.user.updateMany({
        where: {
          pushToken: {
            in: result.invalidTokens,
          },
        },
        data: {
          pushToken: null,
        },
      });
      console.log(`🗑️ Removed ${result.invalidTokens.length} invalid tokens`);
    }
  } catch (error) {
    console.error('❌ Error sending push notifications:', error);
    throw error;
  }
}

function convertDataToStrings(data: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    result[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return result;
}

/**
 * بناء بيانات إضافية غنية للإشعار (شعارات الفرق، الاستحواذ، الوقت، المسابقة)
 */
async function buildEnrichedData(
  match: Match,
  homeTeam: { id: string; name: string; logoUrl?: string | null },
  awayTeam: { id: string; name: string; logoUrl?: string | null },
  extra: Record<string, string> = {}
): Promise<Record<string, string>> {
  // Fetch match stats for possession
  let homePossession = '';
  let awayPossession = '';
  try {
    const stats = await prisma.matchStats.findUnique({ where: { matchId: match.id } });
    if (stats) {
      homePossession = (stats.homePossession ?? '').toString();
      awayPossession = (stats.awayPossession ?? '').toString();
    }
  } catch {}

  // Fetch competition name
  let competitionName = '';
  try {
    if (match.competitionId) {
      const comp = await prisma.competition.findUnique({ where: { id: match.competitionId }, select: { name: true } });
      competitionName = comp?.name || '';
    }
  } catch {}

  return {
    matchId: match.id,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeTeamLogo: homeTeam.logoUrl || '',
    awayTeamLogo: awayTeam.logoUrl || '',
    homeScore: (match.homeScore ?? 0).toString(),
    awayScore: (match.awayScore ?? 0).toString(),
    minute: (match.currentMinute ?? '').toString(),
    homePossession,
    awayPossession,
    competitionName,
    ...extra,
  };
}

/**
 * إرسال إشعار بداية المباراة
 */
export async function sendMatchStartNotification(match: Match): Promise<void> {
  try {
    const interestedUsers = await getInterestedUsers(match);

    if (interestedUsers.length === 0) {
      console.log('⚠️ No users to notify for match start');
      return;
    }

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: match.homeTeamId } }),
      prisma.team.findUnique({ where: { id: match.awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      console.error('❌ Teams not found for match');
      return;
    }

    const startEnrichedData = await buildEnrichedData(match, homeTeam, awayTeam, { type: 'match_start' });

    for (const user of interestedUsers) {
      const lang = getUserLanguage(user);
      const template = notificationTemplates.matchStart(homeTeam.name, awayTeam.name)[lang];

      const pushToken = user.pushToken;
      if (!pushToken) continue;

      await sendFCMNotification({
        token: pushToken,
        title: template.title,
        body: template.body,
        data: startEnrichedData,
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'match_start',
          title: template.title,
          body: template.body,
          matchId: match.id,
          isRead: false,
        },
      });
    }

    console.log(`✅ Sent match start notifications to ${interestedUsers.length} users`);
  } catch (error) {
    console.error('❌ Error sending match start notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار قبل بداية المباراة بـ 15 دقيقة
 */
export async function sendPreMatchNotification(match: Match): Promise<void> {
  try {
    const interestedUsers = await getInterestedUsers(match);

    if (interestedUsers.length === 0) {
      console.log('⚠️ No users to notify for pre-match');
      return;
    }

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: match.homeTeamId } }),
      prisma.team.findUnique({ where: { id: match.awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      console.error('❌ Teams not found for match');
      return;
    }

    const preMatchEnrichedData = await buildEnrichedData(match, homeTeam, awayTeam, { type: 'pre_match' });

    for (const user of interestedUsers) {
      const lang = getUserLanguage(user);
      const template = notificationTemplates.preMatch(homeTeam.name, awayTeam.name)[lang];

      const pushToken = user.pushToken;
      if (!pushToken) continue;

      await sendFCMNotification({
        token: pushToken,
        title: template.title,
        body: template.body,
        data: preMatchEnrichedData,
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'pre_match',
          title: template.title,
          body: template.body,
          matchId: match.id,
          isRead: false,
        },
      });
    }

    console.log(`✅ Sent pre-match notifications to ${interestedUsers.length} users`);
  } catch (error) {
    console.error('❌ Error sending pre-match notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار هدف
 */
export async function sendGoalNotification(
  match: Match,
  teamId: string,
  playerName: string,
  minute: number
): Promise<void> {
  try {
    const interestedUsers = await getInterestedUsers(match);

    if (interestedUsers.length === 0) {
      console.log('⚠️ No users to notify for goal');
      return;
    }

    const [goalTeam, homeTeamGoal, awayTeamGoal] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId } }),
      prisma.team.findUnique({ where: { id: match.homeTeamId } }),
      prisma.team.findUnique({ where: { id: match.awayTeamId } }),
    ]);
    if (!goalTeam) {
      console.error('❌ Team not found');
      return;
    }

    const enrichedData = await buildEnrichedData(
      match,
      homeTeamGoal || { id: match.homeTeamId, name: '' },
      awayTeamGoal || { id: match.awayTeamId, name: '' },
      { type: 'goal', teamId, playerName, minute: minute.toString() }
    );

    for (const user of interestedUsers) {
      const lang = getUserLanguage(user);
      const score = `${match.homeScore}-${match.awayScore}`;
      const template = notificationTemplates.goal(goalTeam.name, playerName, minute, score)[lang];

      const pushToken = user.pushToken;
      if (!pushToken) continue;

      await sendFCMNotification({
        token: pushToken,
        title: template.title,
        body: template.body,
        data: enrichedData,
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'goal',
          title: template.title,
          body: template.body,
          matchId: match.id,
          isRead: false,
        },
      });
    }

    console.log(`✅ Sent goal notifications to ${interestedUsers.length} users`);
  } catch (error) {
    console.error('❌ Error sending goal notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار بطاقة حمراء
 */
export async function sendRedCardNotification(
  match: Match,
  teamId: string,
  playerName: string,
  minute: number
): Promise<void> {
  try {
    const interestedUsers = await getInterestedUsers(match);

    if (interestedUsers.length === 0) {
      console.log('⚠️ No users to notify for red card');
      return;
    }

    const [rcTeam, homeTeamRC, awayTeamRC] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId } }),
      prisma.team.findUnique({ where: { id: match.homeTeamId } }),
      prisma.team.findUnique({ where: { id: match.awayTeamId } }),
    ]);
    if (!rcTeam) {
      console.error('❌ Team not found');
      return;
    }

    const enrichedData = await buildEnrichedData(
      match,
      homeTeamRC || { id: match.homeTeamId, name: '' },
      awayTeamRC || { id: match.awayTeamId, name: '' },
      { type: 'red_card', teamId, playerName, minute: minute.toString() }
    );

    for (const user of interestedUsers) {
      const lang = getUserLanguage(user);
      const template = notificationTemplates.redCard(rcTeam.name, playerName, minute)[lang];

      const pushToken = user.pushToken;
      if (!pushToken) continue;

      await sendFCMNotification({
        token: pushToken,
        title: template.title,
        body: template.body,
        data: enrichedData,
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'red_card',
          title: template.title,
          body: template.body,
          matchId: match.id,
          isRead: false,
        },
      });
    }

    console.log(`✅ Sent red card notifications to ${interestedUsers.length} users`);
  } catch (error) {
    console.error('❌ Error sending red card notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار ركلة جزاء
 */
export async function sendPenaltyNotification(
  match: Match,
  teamId: string,
  minute: number
): Promise<void> {
  try {
    const interestedUsers = await getInterestedUsers(match);

    if (interestedUsers.length === 0) {
      console.log('⚠️ No users to notify for penalty');
      return;
    }

    const [penTeam, homeTeamPen, awayTeamPen] = await Promise.all([
      prisma.team.findUnique({ where: { id: teamId } }),
      prisma.team.findUnique({ where: { id: match.homeTeamId } }),
      prisma.team.findUnique({ where: { id: match.awayTeamId } }),
    ]);
    if (!penTeam) {
      console.error('❌ Team not found');
      return;
    }

    const enrichedData = await buildEnrichedData(
      match,
      homeTeamPen || { id: match.homeTeamId, name: '' },
      awayTeamPen || { id: match.awayTeamId, name: '' },
      { type: 'penalty', teamId, minute: minute.toString() }
    );

    for (const user of interestedUsers) {
      const lang = getUserLanguage(user);
      const template = notificationTemplates.penalty(penTeam.name, minute)[lang];

      const pushToken = user.pushToken;
      if (!pushToken) continue;

      await sendFCMNotification({
        token: pushToken,
        title: template.title,
        body: template.body,
        data: enrichedData,
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'penalty',
          title: template.title,
          body: template.body,
          matchId: match.id,
          isRead: false,
        },
      });
    }

    console.log(`✅ Sent penalty notifications to ${interestedUsers.length} users`);
  } catch (error) {
    console.error('❌ Error sending penalty notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار نهاية الشوط الأول
 */
export async function sendHalftimeNotification(match: Match): Promise<void> {
  try {
    const interestedUsers = await getInterestedUsers(match);

    if (interestedUsers.length === 0) {
      console.log('⚠️ No users to notify for halftime');
      return;
    }

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: match.homeTeamId } }),
      prisma.team.findUnique({ where: { id: match.awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      console.error('❌ Teams not found for match');
      return;
    }

    const halftimeEnrichedData = await buildEnrichedData(match, homeTeam, awayTeam, { type: 'end_half' });

    for (const user of interestedUsers) {
      const lang = getUserLanguage(user);
      const score = `${match.homeScore}-${match.awayScore}`;
      const template = notificationTemplates.halftime(homeTeam.name, awayTeam.name, score)[lang];

      const pushToken = user.pushToken;
      if (!pushToken) continue;

      await sendFCMNotification({
        token: pushToken,
        title: template.title,
        body: template.body,
        data: halftimeEnrichedData,
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'end_half',
          title: template.title,
          body: template.body,
          matchId: match.id,
          isRead: false,
        },
      });
    }

    console.log(`✅ Sent halftime notifications to ${interestedUsers.length} users`);
  } catch (error) {
    console.error('❌ Error sending halftime notification:', error);
    throw error;
  }
}

/**
 * إرسال إشعار نهاية المباراة
 */
export async function sendMatchEndNotification(match: Match): Promise<void> {
  try {
    const interestedUsers = await getInterestedUsers(match);

    if (interestedUsers.length === 0) {
      console.log('⚠️ No users to notify for match end');
      return;
    }

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { id: match.homeTeamId } }),
      prisma.team.findUnique({ where: { id: match.awayTeamId } }),
    ]);

    if (!homeTeam || !awayTeam) {
      console.error('❌ Teams not found for match');
      return;
    }

    const matchEndEnrichedData = await buildEnrichedData(match, homeTeam, awayTeam, { type: 'match_end' });

    for (const user of interestedUsers) {
      const lang = getUserLanguage(user);
      const score = `${match.homeScore}-${match.awayScore}`;
      const template = notificationTemplates.matchEnd(homeTeam.name, awayTeam.name, score)[lang];

      const pushToken = user.pushToken;
      if (!pushToken) continue;

      await sendFCMNotification({
        token: pushToken,
        title: template.title,
        body: template.body,
        data: matchEndEnrichedData,
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'match_end',
          title: template.title,
          body: template.body,
          matchId: match.id,
          isRead: false,
        },
      });
    }

    console.log(`✅ Sent match end notifications to ${interestedUsers.length} users`);
  } catch (error) {
    console.error('❌ Error sending match end notification:', error);
    throw error;
  }
}

/**
 * فحص وإرسال إشعارات المباريات التي ستبدأ خلال 15 دقيقة
 * يتحقق من عدم إرسال إشعار مكرر لنفس المباراة
 */
export async function sendPreMatchNotifications(): Promise<void> {
  try {
    const now = new Date();
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);

    const matches = await prisma.match.findMany({
      where: {
        status: 'scheduled',
        startTime: {
          gte: now,
          lte: fifteenMinutesLater,
        },
      },
    });

    if (matches.length === 0) return;

    // فحص أي مباريات تم إرسال إشعار pre_match لها مسبقاً
    const alreadyNotified = await prisma.notification.findMany({
      where: {
        type: 'pre_match',
        matchId: { in: matches.map(m => m.id) },
      },
      select: { matchId: true },
      distinct: ['matchId'],
    });

    const notifiedMatchIds = new Set(alreadyNotified.map(n => n.matchId).filter(Boolean));
    const newMatches = matches.filter(m => !notifiedMatchIds.has(m.id));

    console.log(`🔍 Found ${matches.length} matches in 15min window, ${newMatches.length} need notifications (${notifiedMatchIds.size} already sent)`);

    for (const match of newMatches) {
      await sendPreMatchNotification(match);
    }
  } catch (error) {
    console.error('❌ Error in sendPreMatchNotifications:', error);
    throw error;
  }
}

/**
 * إرسال تحديثات دورية للمباريات المباشرة (FCM data-only) لتحديث الإشعارات الثابتة
 * يتم استدعاؤها كل دقيقتين من الـ scheduler
 */
export async function sendLiveMatchUpdates(): Promise<void> {
  try {
    // Get all live matches
    const liveMatches = await prisma.match.findMany({
      where: {
        status: { in: ['live', 'halftime', 'extra_time', 'extra_time_halftime', 'penalties'] },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
      },
    });

    if (liveMatches.length === 0) return;

    console.log(`📡 Sending live updates for ${liveMatches.length} matches`);

    for (const match of liveMatches) {
      try {
        const interestedUsers = await getInterestedUsers(match);
        if (interestedUsers.length === 0) continue;

        // Build enriched data for live update
        const enrichedData = await buildEnrichedData(
          match,
          match.homeTeam,
          match.awayTeam,
          { type: 'live_update', status: match.status }
        );

        // Send data-only FCM (no notification payload = silent update)
        for (const user of interestedUsers) {
          if (!user.pushToken) continue;

          try {
            await sendFCMNotification({
              token: user.pushToken,
              title: `${match.homeTeam.name} ${match.homeScore}-${match.awayScore} ${match.awayTeam.name}`,
              body: `⏱ ${match.currentMinute || ''}'`,
              data: enrichedData,
            });
          } catch (tokenError: any) {
            // Remove invalid tokens silently
            if (
              tokenError?.code === 'messaging/registration-token-not-registered' ||
              tokenError?.code === 'messaging/invalid-registration-token'
            ) {
              await prisma.user.update({
                where: { id: user.id },
                data: { pushToken: null },
              }).catch(() => {});
            }
          }
        }
      } catch (matchError) {
        console.error(`❌ Error sending live update for match ${match.id}:`, matchError);
      }
    }
  } catch (error) {
    console.error('❌ Error in sendLiveMatchUpdates:', error);
  }
}

export default {
  sendPushNotification,
  sendMatchStartNotification,
  sendPreMatchNotification,
  sendGoalNotification,
  sendRedCardNotification,
  sendPenaltyNotification,
  sendHalftimeNotification,
  sendMatchEndNotification,
  sendPreMatchNotifications,
  sendLiveMatchUpdates,
};


/**
 * إرسال إشعار بناءً على نوع الحدث
 */
export async function sendMatchEventNotification(
  matchId: string,
  eventType: string,
  eventData: any
): Promise<void> {
  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      console.error('❌ Match not found');
      return;
    }

    const playerName = eventData.playerName || 'لاعب';

    switch (eventType) {
      case 'goal':
        if (eventData.teamId && eventData.minute) {
          await sendGoalNotification(match, eventData.teamId, playerName, eventData.minute);
        } else {
          console.log(`⚠️ Missing data for goal notification: teamId=${eventData.teamId}, minute=${eventData.minute}`);
        }
        break;
      
      case 'red_card':
        if (eventData.teamId && eventData.minute) {
          await sendRedCardNotification(match, eventData.teamId, playerName, eventData.minute);
        } else {
          console.log(`⚠️ Missing data for red_card notification: teamId=${eventData.teamId}, minute=${eventData.minute}`);
        }
        break;
      
      case 'penalty':
        if (eventData.teamId && eventData.minute) {
          await sendPenaltyNotification(match, eventData.teamId, eventData.minute);
        } else {
          console.log(`⚠️ Missing data for penalty notification: teamId=${eventData.teamId}, minute=${eventData.minute}`);
        }
        break;

      case 'start_half':
        await sendMatchStartNotification(match);
        break;

      case 'end_half':
        await sendHalftimeNotification(match);
        break;

      case 'match_start':
        await sendMatchStartNotification(match);
        break;
      
      case 'match_end':
      case 'end_match':
        await sendMatchEndNotification(match);
        break;
      
      default:
        console.log(`⚠️ No notification handler for event type: ${eventType}`);
    }
  } catch (error) {
    console.error('❌ Error in sendMatchEventNotification:', error);
  }
}
