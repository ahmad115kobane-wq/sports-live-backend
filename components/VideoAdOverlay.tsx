import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { videoAdApi } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH - 24) * 9 / 16; // 16:9 aspect ratio with padding

interface VideoAdData {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  mandatorySeconds: number;
  clickUrl: string | null;
}

// Child component: only mounts when we have a valid ad URL (prevents shared object release)
function VideoAdPlayer({ ad, onDismiss }: { ad: VideoAdData; onDismiss: () => void }) {
  const [videoReady, setVideoReady] = useState(false);
  const [countdown, setCountdown] = useState(ad.mandatorySeconds);
  const [canSkip, setCanSkip] = useState(false);
  const [ended, setEnded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const player = useVideoPlayer(ad.videoUrl, (p) => {
    p.loop = false;
    p.muted = false;
  });

  // Timeout: if video doesn't load in 10s, dismiss
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!videoReady) dismissRef.current();
    }, 10000);
    return () => clearTimeout(timeout);
  }, []); // empty deps — runs once on mount

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
      setEnded(true);
      setCanSkip(true);
    });

    return () => {
      statusSub.remove();
      endSub.remove();
    };
  }, [player]); // only depends on player (stable)

  useEffect(() => {
    if (videoReady && countdown > 0) {
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
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [videoReady]); // only start once when video is ready

  const handleDismiss = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try { player.pause(); } catch {}
    dismissRef.current();
  };

  return (
    <View style={styles.card}>
      {/* Video container */}
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="contain"
        />

        {!videoReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.loadingText}>جاري تحميل الإعلان...</Text>
          </View>
        )}

        {/* Ad badge */}
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>إعلان</Text>
        </View>

        {/* Skip / Countdown */}
        {canSkip ? (
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        ) : videoReady ? (
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        ) : null}

        {/* Ended overlay */}
        {ended && ad.clickUrl && (
          <TouchableOpacity
            onPress={() => Linking.openURL(ad.clickUrl!).catch(() => {})}
            style={styles.replayOverlay}
            activeOpacity={0.8}
          >
            <Ionicons name="open-outline" size={20} color="#fff" />
            <Text style={styles.replayText}>معرفة المزيد</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom bar: title + CTA */}
      <View style={styles.bottomBar}>
        <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
        {ad.clickUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(ad.clickUrl!).catch(() => {})}
            style={styles.ctaButton}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaText}>المزيد</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </TouchableOpacity>
        ) : canSkip ? (
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissLink} activeOpacity={0.7}>
            <Text style={styles.dismissText}>إغلاق</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Inline video ad component — embeds in the home page ScrollView.
 * Fetches one random ad on mount, shows it once, then disappears on dismiss.
 */
export default function VideoAdOverlay() {
  const [ad, setAd] = useState<VideoAdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        const res = await videoAdApi.getRandom();
        if (res.data?.data && res.data.data.videoUrl) {
          setAd(res.data.data);
        }
      } catch {
        // silently fail — no ad to show
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Nothing to show
  if (dismissed || (!loading && !ad)) return null;

  // Still loading
  if (loading) return null;

  return (
    <VideoAdPlayer ad={ad!} onDismiss={() => setDismissed(true)} />
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  videoContainer: {
    width: '100%',
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 8,
  },
  adBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,180,0,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  replayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 6,
  },
  replayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#111',
  },
  adTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ctaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dismissText: {
    color: '#888',
    fontSize: 12,
  },
});
