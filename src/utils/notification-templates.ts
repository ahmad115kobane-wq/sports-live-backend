interface NotificationTemplate {
  ar: { title: string; body: string };
  en: { title: string; body: string };
}

export const notificationTemplates = {
  preMatch: (homeTeam: string, awayTeam: string): NotificationTemplate => ({
    ar: {
      title: 'تذكير بالمباراة',
      body: `${homeTeam} ضد ${awayTeam} - تبدأ خلال 15 دقيقة`,
    },
    en: {
      title: 'Match Reminder',
      body: `${homeTeam} vs ${awayTeam} - Starting in 15 minutes`,
    },
  }),

  matchStart: (homeTeam: string, awayTeam: string): NotificationTemplate => ({
    ar: {
      title: 'المباراة بدأت',
      body: `${homeTeam} ضد ${awayTeam} - مباشر الآن`,
    },
    en: {
      title: 'Match Started',
      body: `${homeTeam} vs ${awayTeam} - LIVE NOW`,
    },
  }),

  goal: (team: string, player: string, minute: number, score: string): NotificationTemplate => ({
    ar: {
      title: `هدف ${team}!`,
      body: `${minute}' - ${player} يسجل! (${score})`,
    },
    en: {
      title: `GOAL ${team}!`,
      body: `${minute}' - ${player} scores! (${score})`,
    },
  }),

  redCard: (team: string, player: string, minute: number): NotificationTemplate => ({
    ar: {
      title: `بطاقة حمراء ${team}`,
      body: `${minute}' - ${player} طُرد من المباراة`,
    },
    en: {
      title: `RED CARD ${team}`,
      body: `${minute}' - ${player} sent off`,
    },
  }),

  penalty: (team: string, minute: number): NotificationTemplate => ({
    ar: {
      title: `ركلة جزاء ${team}`,
      body: `${minute}' - ركلة جزاء لصالح ${team}`,
    },
    en: {
      title: `PENALTY ${team}`,
      body: `${minute}' - Penalty awarded to ${team}`,
    },
  }),

  halftime: (homeTeam: string, awayTeam: string, score: string): NotificationTemplate => ({
    ar: {
      title: 'نهاية الشوط الأول',
      body: `${homeTeam} ${score} ${awayTeam}`,
    },
    en: {
      title: 'Half Time',
      body: `${homeTeam} ${score} ${awayTeam}`,
    },
  }),

  matchEnd: (homeTeam: string, awayTeam: string, score: string): NotificationTemplate => ({
    ar: {
      title: 'انتهت المباراة',
      body: `${homeTeam} ${score} ${awayTeam}`,
    },
    en: {
      title: 'Full Time',
      body: `${homeTeam} ${score} ${awayTeam}`,
    },
  }),
};

export function getUserLanguage(user: any): 'ar' | 'en' {
  try {
    if (user && user.preferences) {
      const prefs = typeof user.preferences === 'string' ? JSON.parse(user.preferences) : user.preferences;
      if (prefs && prefs.language) {
        return prefs.language === 'ar' ? 'ar' : 'en';
      }
    }
  } catch (error) {
    console.error('Error parsing user language:', error);
  }
  return 'ar'; // default to Arabic
}
