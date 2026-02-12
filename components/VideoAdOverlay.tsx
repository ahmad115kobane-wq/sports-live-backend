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
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAd = useCallback(async () => {
    try {
      const res = await videoAdApi.getRandom();
      if (res.data?.data) {
        setAd(res.data.data);
        setCountdown(res.data.data.mandatorySeconds);
        setCanSkip(false);
      } else {
        // No active ads
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
      fetchAd();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, fetchAd]);

  // Start countdown when video starts playing
  useEffect(() => {
    if (isPlaying && countdown > 0) {
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
  }, [isPlaying, countdown]);

  const handlePlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.isPlaying && !isPlaying) {
        setIsPlaying(true);
      }
      // Auto-close when video finishes
      if (status.didJustFinish) {
        onClose();
      }
    }
  };

  const handleAdClick = () => {
    if (ad?.clickUrl) {
      Linking.openURL(ad.clickUrl).catch(() => {});
    }
  };

  const handleSkip = () => {
    if (canSkip) {
      if (timerRef.current) clearInterval(timerRef.current);
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
            {/* Video Player */}
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={handleAdClick}
              style={styles.videoContainer}
            >
              <Video
                ref={videoRef}
                source={{ uri: ad.videoUrl }}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatus}
                volume={1.0}
              />
            </TouchableOpacity>

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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
