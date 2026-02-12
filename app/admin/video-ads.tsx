import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { videoAdApi } from '@/services/api';

export default function VideoAdsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL } = useRTL();

  const [title, setTitle] = useState('');
  const [clickUrl, setClickUrl] = useState('');
  const [mandatorySeconds, setMandatorySeconds] = useState('5');
  const [isActive, setIsActive] = useState(true);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إلى إذن الوصول للمعرض');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('خطأ', 'فشل اختيار الفيديو');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('خطأ', 'يجب إدخال عنوان الإعلان');
      return;
    }

    if (!videoUri) {
      Alert.alert('خطأ', 'يجب اختيار ملف الفيديو');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('mandatorySeconds', mandatorySeconds);
      formData.append('isActive', String(isActive));
      if (clickUrl) formData.append('clickUrl', clickUrl);
      
      // Add video file
      const filename = videoUri.split('/').pop() || 'video.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : 'video/mp4';
      
      formData.append('video', {
        uri: videoUri,
        name: filename,
        type,
      } as any);

      await videoAdApi.adminCreate(formData);
      
      Alert.alert('نجاح', 'تم إنشاء الإعلان بنجاح', [
        { text: 'حسناً', onPress: () => router.back() }
      ]);
      
      // Reset form
      setTitle('');
      setClickUrl('');
      setMandatorySeconds('5');
      setIsActive(true);
      setVideoUri(null);
    } catch (error) {
      console.error('Error creating video ad:', error);
      Alert.alert('خطأ', 'فشل إنشاء الإعلان');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'إعلان فيديو',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>عنوان الإعلان *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="أدخل عنوان الإعلان"
            placeholderTextColor={colors.textTertiary}
            textAlign="right"
          />
        </View>

        {/* Video Picker */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>ملف الفيديو *</Text>
          <TouchableOpacity
            style={[styles.videoPicker, { backgroundColor: colors.surface, borderColor: videoUri ? colors.accent : colors.border }]}
            onPress={pickVideo}
            activeOpacity={0.7}
          >
            <View style={styles.videoPickerInner}>
              <Ionicons name="videocam" size={24} color={videoUri ? colors.accent : colors.textTertiary} />
              <Text style={[styles.videoPickerText, { color: videoUri ? colors.text : colors.textTertiary }]}>
                {videoUri ? 'تم اختيار الفيديو ✓' : 'اختر ملف الفيديو'}
              </Text>
            </View>
            <Ionicons name="folder-open" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Click URL */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>رابط عند النقر (اختياري)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={clickUrl}
            onChangeText={setClickUrl}
            placeholder="https://example.com"
            placeholderTextColor={colors.textTertiary}
            textAlign="right"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Mandatory Seconds */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>الوقت الإجباري (ثانية)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={mandatorySeconds}
            onChangeText={setMandatorySeconds}
            placeholder="5"
            placeholderTextColor={colors.textTertiary}
            textAlign="right"
            keyboardType="numeric"
          />
        </View>

        {/* Active Toggle */}
        <TouchableOpacity
          style={[styles.toggle, { backgroundColor: colors.surface, borderColor: isActive ? colors.accent : colors.border }]}
          onPress={() => setIsActive(!isActive)}
          activeOpacity={0.7}
        >
          <View style={styles.toggleInfo}>
            <Ionicons name="checkmark-circle" size={22} color={isActive ? colors.success : colors.textTertiary} />
            <Text style={[styles.toggleTitle, { color: colors.text }]}>تفعيل الإعلان</Text>
          </View>
          <View style={[styles.toggleSwitch, { backgroundColor: isActive ? colors.accent : colors.border }]}>
            <View style={[styles.toggleDot, isActive && styles.toggleDotActive]} />
          </View>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, uploading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={uploading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
                <Text style={styles.submitText}>رفع الإعلان</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  input: {
    height: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
  },
  videoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    paddingHorizontal: SPACING.md,
  },
  videoPickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  videoPickerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  submitButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
