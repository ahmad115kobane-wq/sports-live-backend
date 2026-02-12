import React, { useState, useEffect, useRef } from 'react';
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

interface VideoAdData {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  mandatorySeconds: number;
  clickUrl: string | null;
}

// Fullscreen video player — only mounts when ad URL is ready (stable ref)
function VideoAdPlayer({ ad, onDismiss }: { ad: VideoAdData; onDismiss: () => void }) {
  const [videoReady, setVideoReady] = useState(false);
  const [countdown, setCountdown] = useState(ad.mandatorySeconds);
  const [canSkip, setCanSkip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const player = useVideoPlayer(ad.videoUrl, (p) => {
    p.loop = false;
    p.muted = false;
  });

  // Timeout: if video doesn't load in 15s, dismiss
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!videoReady) dismissRef.current();
    }, 15000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const statusSub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setVideoReady(true);
        player.play();
      } else if (payload.status === 'error') {
        dismissRef.current();
      }
    });

    const endSub = player.addListener('playToEnd', () => {
      setCanSkip(true);
    });

    return () => {
      statusSub.remove();
      endSub.remove();
    };
  }, [player]);

  // Countdown starts only when video is playing
  useEffect(() => {
    if (!videoReady) return;
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
  }, [videoReady]);

  const handleSkip = () => {
    if (!canSkip) return;
    if (timerRef.current) clearInterval(timerRef.current);
    try { player.pause(); } catch {}
    dismissRef.current();
  };

  return (
    <View style={styles.fullscreen}>
      <StatusBar hidden />

      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
      />

      {/* Loading overlay */}
      {!videoReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>جاري تحميل الإعلان...</Text>
        </View>
      )}

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
        ) : videoReady ? (
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>تخطي بعد {countdown}</Text>
          </View>
        ) : null}
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
 * Fullscreen mandatory video ad overlay.
 * Fetches one random ad on mount, shows fullscreen, skip only after mandatory seconds.
 */
export default function VideoAdOverlay() {
  const [ad, setAd] = useState<VideoAdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Wait 1 second after home page mounts, then fetch ad
    const delay = setTimeout(async () => {
      try {
        const res = await videoAdApi.getRandom();
        if (res.data?.data && res.data.data.videoUrl) {
          setAd(res.data.data);
          setReady(true);
        }
      } catch {
        // no ad
      } finally {
        setLoading(false);
      }
    }, 1000);
    return () => clearTimeout(delay);
  }, []);

  const showModal = !dismissed && !loading && ready && !!ad;

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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 12,
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
  },
});
