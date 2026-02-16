import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface LiveMatchBannerData {
  matchId: string;
  type: string; // goal, match_start, match_end, halftime, red_card, penalty, pre_match
  title: string;
  body: string;
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
}

interface LiveMatchBannerContextType {
  bannerData: LiveMatchBannerData | null;
  isVisible: boolean;
  showBanner: (data: LiveMatchBannerData) => void;
  hideBanner: () => void;
}

const LiveMatchBannerContext = createContext<LiveMatchBannerContextType>({
  bannerData: null,
  isVisible: false,
  showBanner: () => {},
  hideBanner: () => {},
});

export function LiveMatchBannerProvider({ children }: { children: React.ReactNode }) {
  const [bannerData, setBannerData] = useState<LiveMatchBannerData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = useCallback((data: LiveMatchBannerData) => {
    // Clear any existing auto-hide timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setBannerData(data);
    setIsVisible(true);

    // Auto-hide after 6 seconds
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setBannerData(null), 400); // Wait for animation
    }, 6000);
  }, []);

  const hideBanner = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsVisible(false);
    setTimeout(() => setBannerData(null), 400);
  }, []);

  return (
    <LiveMatchBannerContext.Provider value={{ bannerData, isVisible, showBanner, hideBanner }}>
      {children}
    </LiveMatchBannerContext.Provider>
  );
}

export function useLiveMatchBanner() {
  return useContext(LiveMatchBannerContext);
}
