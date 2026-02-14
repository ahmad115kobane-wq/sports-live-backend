import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { videoAdApi } from '@/services/api';
import { FONTS } from '@/constants/Theme';

interface VideoAdData {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  mandatorySeconds: number;
  clickUrl: string | null;
}

// ─── Fullscreen video player (mounts only when video is preloaded) ───
function VideoAdPlayer({ ad, onDismiss }: { ad: VideoAdData; onDismiss: () => void }) {
  const [countdown, setCountdown] = useState(ad.mandatorySeconds);
  const [canSkip, setCanSkip] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  // Stable video URL ref — useVideoPlayer needs a stable string
  const videoUrlRef = useRef(ad.videoUrl);

  const player = useVideoPlayer(videoUrlRef.current, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  // Safety timeout: dismiss after 30s regardless
  useEffect(() => {
    const timeout = setTimeout(() => {
      dismissRef.current();
    }, 30000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const statusSub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay' && !playing) {
        setPlaying(true);
        player.play();
      } else if (payload.status === 'error') {
        dismissRef.current();
      }
    });

    const endSub = player.addListener('playToEnd', () => {
      setCanSkip(true);
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      statusSub.remove();
      endSub.remove();
    };
  }, [player]);

  // Countdown starts immediately (video is already preloaded)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSkip = useCallback(() => {
    if (!canSkip) return;
    if (timerRef.current) clearInterval(timerRef.current);
    try { player.pause(); } catch {}
    dismissRef.current();
  }, [canSkip, player]);

  return (
    <View style={styles.fullscreen}>
      <StatusBar hidden />

      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
      />

      {/* Ad badge — top left */}
      <View style={styles.adBadge}>
        <Text style={styles.adBadgeText}>إعلان</Text>
      </View>

      {/* Top right: countdown or skip button */}
      <View style={styles.topRight}>
        {canSkip ? (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color="#fff" />
            <Text style={styles.skipText}>تخطي الإعلان</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>تخطي بعد {countdown}</Text>
          </View>
        )}
      </View>

      {/* Bottom CTA link */}
      {ad.clickUrl && (
        <TouchableOpacity
          onPress={() => Linking.openURL(ad.clickUrl!).catch(() => {})}
          style={styles.ctaButton}
          activeOpacity={0.8}
        >
          <Ionicons name="open-outline" size={16} color="#fff" />
          <Text style={styles.ctaText}>معرفة المزيد</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Global fullscreen mandatory video ad overlay.
 * - Fetches one random active ad after auth
 * - Preloads video in background (HEAD request to warm cache)
 * - Shows fullscreen modal on TOP of entire app (rendered in _layout.tsx)
 * - Cannot be dismissed until mandatory seconds pass
 */
export default function VideoAdOverlay({ isAuthenticated }: { isAuthenticated?: boolean }) {
  const [ad, setAd] = useState<VideoAdData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [preloaded, setPreloaded] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current || !isAuthenticated) return;
    fetchedRef.current = true;

    // Delay 2s after app start, then fetch random ad + preload
    const delay = setTimeout(async () => {
      try {
        const res = await videoAdApi.getRandom();
        const adData = res.data?.data;
        if (!adData || !adData.videoUrl) return;

        setAd(adData);

        // Preload: fetch first bytes of video to warm CDN cache & device
        try {
          await fetch(adData.videoUrl, { method: 'HEAD' });
        } catch {}

        // Small extra delay to let video cache settle
        setTimeout(() => setPreloaded(true), 500);
      } catch {
        // no ad available
      }
    }, 2000);
    return () => clearTimeout(delay);
  }, [isAuthenticated]);

  const showModal = !dismissed && preloaded && !!ad;

  if (!showModal) return null;

  return (
    <Modal
      visible
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={() => {}} // block Android back button
    >
      <VideoAdPlayer ad={ad!} onDismiss={() => setDismissed(true)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  adBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 16,
    backgroundColor: 'rgba(255,180,0,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FONTS.bold,
  },
  topRight: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 16,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  countdownBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countdownText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  ctaButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59,130,246,0.85)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});
