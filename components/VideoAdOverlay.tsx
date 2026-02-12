import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { videoAdApi } from '@/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoAdData {
  id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  mandatorySeconds: number;
  clickUrl: string | null;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function VideoAdOverlay({ visible, onClose }: Props) {
  const [ad, setAd] = useState<VideoAdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useVideoPlayer(ad?.videoUrl || '', (p) => {
    p.loop = false;
    p.muted = false;
  });

  const fetchAd = useCallback(async () => {
    try {
      const res = await videoAdApi.getRandom();
      if (res.data?.data) {
        setAd(res.data.data);
        setCountdown(res.data.data.mandatorySeconds);
        setCanSkip(false);
        setVideoReady(false);
      } else {
        onClose();
      }
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setAd(null);
      setCanSkip(false);
      setVideoReady(false);
      fetchAd();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, fetchAd]);

  // Listen to player status changes
  useEffect(() => {
    if (!player || !ad) return;

    const statusSub = player.addListener('statusChange', (payload) => {
      if (payload.status === 'readyToPlay') {
        setVideoReady(true);
        player.play();
      }
    });

    const endSub = player.addListener('playToEnd', () => {
      onClose();
    });

    return () => {
      statusSub.remove();
      endSub.remove();
    };
  }, [player, ad, onClose]);

  // Start countdown when video is ready
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
  }, [videoReady, countdown]);

  const handleAdClick = () => {
    if (ad?.clickUrl) {
      Linking.openURL(ad.clickUrl).catch(() => {});
    }
  };

  const handleSkip = () => {
    if (canSkip) {
      if (timerRef.current) clearInterval(timerRef.current);
      try { player.pause(); } catch {}
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={canSkip ? handleSkip : undefined}
    >
      <View style={styles.container}>
        <StatusBar hidden />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : ad ? (
          <>
            <VideoView
              player={player}
              style={styles.video}
              nativeControls={false}
              contentFit="contain"
            />

            {!videoReady && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>جاري تحميل الإعلان...</Text>
              </View>
            )}

            {/* Ad badge */}
            <View style={styles.adBadge}>
              <Text style={styles.adBadgeText}>إعلان</Text>
            </View>

            {/* Skip / Countdown button */}
            <View style={styles.skipContainer}>
              {canSkip ? (
                <TouchableOpacity
                  onPress={handleSkip}
                  style={styles.skipButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                  <Text style={styles.skipText}>تخطي</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.countdownBadge}>
                  <Text style={styles.countdownText}>
                    {countdown > 0 ? `تخطي بعد ${countdown}` : '...'}
                  </Text>
                </View>
              )}
            </View>

            {/* Click URL indicator */}
            {ad.clickUrl && (
              <TouchableOpacity
                onPress={handleAdClick}
                style={styles.clickIndicator}
                activeOpacity={0.8}
              >
                <Ionicons name="open-outline" size={14} color="#fff" />
                <Text style={styles.clickText}>معرفة المزيد</Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 12,
  },
  adBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  skipContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
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
  clickIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59,130,246,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  clickText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
