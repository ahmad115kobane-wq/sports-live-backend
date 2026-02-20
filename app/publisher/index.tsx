import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
  RefreshControl,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS, TYPOGRAPHY, FONTS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { useAlert } from '@/contexts/AlertContext';
import { newsApi } from '@/services/api';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { SOCKET_URL } from '@/constants/config';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  isPublished: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const MAX_NEWS_IMAGES = 9;
const MAX_UPLOAD_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB (matches backend multer limit)
const MAX_UPLOAD_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export default function PublisherScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { t, isRTL, flexDirection } = useRTL();
  const { alert } = useAlert();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // New article form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Video state
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Edit article state
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editVideo, setEditVideo] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadMyArticles();
  }, []);

  const loadMyArticles = async () => {
    try {
      setLoading(true);
      const response = await newsApi.getMyArticles();
      setArticles(response.data?.data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const pickImages = async (mode: 'create' | 'edit') => {
    const currentImages = mode === 'create' ? selectedImages : editImages;

    if (currentImages.length >= MAX_NEWS_IMAGES) {
      alert(
        t('common.error'),
        t('news.imagesLimitReached', { count: MAX_NEWS_IMAGES })
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_NEWS_IMAGES - currentImages.length,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const picked: string[] = [];
      let rejectedCount = 0;

      for (const asset of result.assets) {
        const assetUri = asset.uri;
        let size = asset.fileSize;

        if (size == null) {
          try {
            const info = await FileSystem.getInfoAsync(assetUri);
            size = info.exists ? (info as any).size : undefined;
          } catch {
            size = undefined;
          }
        }

        if (typeof size === 'number' && size > MAX_UPLOAD_IMAGE_SIZE_BYTES) {
          rejectedCount += 1;
          continue;
        }

        picked.push(assetUri);
      }

      if (rejectedCount > 0) {
        alert(
          t('common.error'),
          `بعض الصور أكبر من 5MB وتم تجاهلها (${rejectedCount})`
        );
      }

      if (picked.length === 0) return;

      const merged = [...currentImages, ...picked].slice(0, MAX_NEWS_IMAGES);
      if (mode === 'create') {
        setSelectedImages(merged);
      } else {
        setEditImages(merged);
      }
    }
  };

  const removePickedImage = (mode: 'create' | 'edit', index: number) => {
    if (mode === 'create') {
      setSelectedImages((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert(
        t('common.error'),
        t('news.fillRequired'),
      );
      return;
    }

    try {
      setPublishing(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());

      // Add video if selected
      if (selectedVideo) {
        const vFilename = selectedVideo.split('/').pop() || 'video.mp4';
        const vMatch = /\.([\w]+)$/.exec(vFilename);
        const vType = vMatch ? `video/${vMatch[1]}` : 'video/mp4';
        formData.append('video', {
          uri: selectedVideo,
          name: vFilename,
          type: vType,
        } as any);
      }

      console.log('📱 Selected images count:', selectedImages.length);
      console.log('📱 Image URIs:', selectedImages);

      for (const imageUri of selectedImages.slice(0, MAX_NEWS_IMAGES)) {
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        console.log('📱 Adding image to FormData:', { uri: imageUri, filename, type });
        formData.append('images', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      console.log('📱 FormData entries before sending:');
      // Note: React Native FormData doesn't expose _parts, but we can log the structure
      console.log('📱 FormData structure:', formData);

      await newsApi.create(formData);
      Vibration.vibrate(20);
      alert(t('common.success'), t('news.published'));
      setTitle('');
      setContent('');
      setSelectedImages([]);
      setSelectedVideo(null);
      setShowForm(false);
      loadMyArticles();
    } catch (error) {
      console.error('Publish error:', error);
      if (axios.isAxiosError(error) && !error.response) {
        alert(t('common.error'), 'فشل الاتصال بالخادم. تحقق من الإنترنت أو قلّل عدد/حجم الصور.');
      } else {
        alert(t('common.error'), t('news.publishFailed'));
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setEditTitle(article.title);
    setEditContent(article.content);
    setEditImages([]);
    setEditVideo(null);
    setShowForm(false);
  };

  const pickVideo = async (mode: 'create' | 'edit') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      let size = asset.fileSize;

      if (size == null) {
        try {
          const info = await FileSystem.getInfoAsync(asset.uri);
          size = info.exists ? (info as any).size : undefined;
        } catch {
          size = undefined;
        }
      }

      if (typeof size === 'number' && size > MAX_UPLOAD_VIDEO_SIZE_BYTES) {
        alert(t('common.error'), 'حجم الفيديو أكبر من 100MB');
        return;
      }

      if (mode === 'create') {
        setSelectedVideo(asset.uri);
      } else {
        setEditVideo(asset.uri);
      }
    }
  };

  const handleUpdate = async () => {
    if (!editingArticle || !editTitle.trim() || !editContent.trim()) {
      alert(t('common.error'), t('news.fillRequired'));
      return;
    }
    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('content', editContent.trim());

      for (const imageUri of editImages.slice(0, MAX_NEWS_IMAGES)) {
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', { uri: imageUri, name: filename, type } as any);
      }

      // Add video if selected for edit
      if (editVideo) {
        const vFilename = editVideo.split('/').pop() || 'video.mp4';
        const vMatch = /\.([\w]+)$/.exec(vFilename);
        const vType = vMatch ? `video/${vMatch[1]}` : 'video/mp4';
        formData.append('video', {
          uri: editVideo,
          name: vFilename,
          type: vType,
        } as any);
      }

      await newsApi.update(editingArticle.id, formData);
      Vibration.vibrate(20);
      alert(t('common.success'), t('news.updated') || 'تم تحديث المقال');
      setEditingArticle(null);
      loadMyArticles();
    } catch (error) {
      console.error('Update error:', error);
      if (axios.isAxiosError(error) && !error.response) {
        alert(t('common.error'), 'فشل الاتصال بالخادم. تحقق من الإنترنت أو قلّل عدد/حجم الصور.');
      } else {
        alert(t('common.error'), t('news.updateFailed') || 'فشل تحديث المقال');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = (article: NewsArticle) => {
    alert(
      t('news.deleteArticle'),
      t('news.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await newsApi.delete(article.id);
              setArticles(prev => prev.filter(a => a.id !== article.id));
              Vibration.vibrate(15);
            } catch (error) {
              alert(t('common.error'), t('news.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${SOCKET_URL}${imageUrl}`;
  };

  const getArticleImages = (article: NewsArticle): string[] => {
    const normalized = (Array.isArray(article.imageUrls) ? article.imageUrls : [])
      .map((img) => getImageUrl(img))
      .filter((img): img is string => !!img);

    const legacy = getImageUrl(article.imageUrl);
    if (legacy && !normalized.includes(legacy)) {
      normalized.unshift(legacy);
    }

    return normalized.slice(0, MAX_NEWS_IMAGES);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-IQ' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={[styles.headerContent, { flexDirection }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text 
              style={styles.headerTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('news.publisherPanel')}
            </Text>
            <Text 
              style={styles.headerSubtitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {articles.length} {t('news.articlesCount')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons name={showForm ? 'close' : 'add'} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMyArticles(); }} />
        }
      >
        {/* New Article Form */}
        {showForm && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              {t('news.newArticle')}
            </Text>

            {/* Title Input */}
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={t('news.titlePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              textAlign={isRTL ? 'right' : 'left'}
            />

            {/* Content Input */}
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={t('news.contentPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              textAlign={isRTL ? 'right' : 'left'}
            />

            {/* Image Picker */}
            <TouchableOpacity
              style={[styles.imagePickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => pickImages('create')}
            >
              {selectedImages.length > 0 ? (
                <View style={styles.selectedImagesWrap}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectedImagesRow}
                  >
                    {selectedImages.map((uri, index) => (
                      <View key={`${uri}-${index}`} style={styles.selectedImageItem}>
                        <Image source={{ uri }} style={styles.selectedImageThumb} />
                        <TouchableOpacity
                          style={styles.selectedImageRemove}
                          onPress={() => removePickedImage('create', index)}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  <Text style={[styles.imageCountText, { color: colors.textSecondary }]}> 
                    {selectedImages.length}/{MAX_NEWS_IMAGES}
                  </Text>
                </View>
              ) : (
                <View style={styles.imagePickerContent}>
                  <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
                  <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}> 
                    {t('news.addImage')}
                  </Text>
                  <Text style={[styles.imageHintText, { color: colors.textTertiary }]}> 
                    {t('news.maxImagesHint', { count: MAX_NEWS_IMAGES })}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {selectedImages.length > 0 && (
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setSelectedImages([])}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>
                  {t('news.removeImage')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Video Picker */}
            <TouchableOpacity
              style={[styles.imagePickerBtn, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: SPACING.sm }]}
              onPress={() => pickVideo('create')}
            >
              {selectedVideo ? (
                <View style={{ padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Ionicons name="videocam" size={24} color="#8B5CF6" />
                  <Text style={{ color: colors.text, flex: 1, fontFamily: FONTS.medium, fontSize: 13 }} numberOfLines={1}>
                    تم اختيار فيديو
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedVideo(null)}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerContent}>
                  <Ionicons name="videocam-outline" size={32} color={colors.textTertiary} />
                  <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>إضافة فيديو</Text>
                  <Text style={[styles.imageHintText, { color: colors.textTertiary }]}>حد أقصى 100MB</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Publish Button */}
            <TouchableOpacity
              style={[styles.publishBtn, publishing && { opacity: 0.6 }]}
              onPress={handlePublish}
              disabled={publishing}
            >
              {publishing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.publishBtnText}>{t('news.publish')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Article Form */}
        {editingArticle && (
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
              <Text style={[styles.formTitle, { color: colors.text, marginBottom: 0 }]}>
                {t('news.editArticle') || 'تعديل المقال'}
              </Text>
              <TouchableOpacity onPress={() => setEditingArticle(null)}>
                <Ionicons name="close-circle" size={28} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={t('news.titlePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={editTitle}
              onChangeText={setEditTitle}
              textAlign={isRTL ? 'right' : 'left'}
            />

            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder={t('news.contentPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              textAlign={isRTL ? 'right' : 'left'}
            />

            <TouchableOpacity
              style={[styles.imagePickerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => pickImages('edit')}
            >
              {editImages.length > 0 ? (
                <View style={styles.selectedImagesWrap}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectedImagesRow}
                  >
                    {editImages.map((uri, index) => (
                      <View key={`${uri}-${index}`} style={styles.selectedImageItem}>
                        <Image source={{ uri }} style={styles.selectedImageThumb} />
                        <TouchableOpacity
                          style={styles.selectedImageRemove}
                          onPress={() => removePickedImage('edit', index)}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  <Text style={[styles.imageCountText, { color: colors.textSecondary }]}> 
                    {editImages.length}/{MAX_NEWS_IMAGES}
                  </Text>
                </View>
              ) : getArticleImages(editingArticle).length > 0 ? (
                <View style={styles.selectedImagesWrap}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectedImagesRow}
                  >
                    {getArticleImages(editingArticle).map((uri, index) => (
                      <View key={`${uri}-${index}`} style={styles.selectedImageItem}>
                        <Image source={{ uri }} style={styles.selectedImageThumb} />
                      </View>
                    ))}
                  </ScrollView>
                  <Text style={[styles.imageCountText, { color: colors.textSecondary }]}> 
                    {t('news.addMoreImages')}
                  </Text>
                </View>
              ) : (
                <View style={styles.imagePickerContent}>
                  <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
                  <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}> 
                    {t('news.changeImage') || 'تغيير الصورة'}
                  </Text>
                  <Text style={[styles.imageHintText, { color: colors.textTertiary }]}> 
                    {t('news.maxImagesHint', { count: MAX_NEWS_IMAGES })}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Video Picker for Edit */}
            <TouchableOpacity
              style={[styles.imagePickerBtn, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: SPACING.sm }]}
              onPress={() => pickVideo('edit')}
            >
              {editVideo ? (
                <View style={{ padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Ionicons name="videocam" size={24} color="#8B5CF6" />
                  <Text style={{ color: colors.text, flex: 1, fontFamily: FONTS.medium, fontSize: 13 }} numberOfLines={1}>
                    تم اختيار فيديو جديد
                  </Text>
                  <TouchableOpacity onPress={() => setEditVideo(null)}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : editingArticle?.videoUrl ? (
                <View style={{ padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Ionicons name="videocam" size={24} color="#10B981" />
                  <Text style={{ color: colors.textSecondary, flex: 1, fontFamily: FONTS.medium, fontSize: 13 }} numberOfLines={1}>
                    يوجد فيديو مرفق - اضغط لتغييره
                  </Text>
                </View>
              ) : (
                <View style={styles.imagePickerContent}>
                  <Ionicons name="videocam-outline" size={32} color={colors.textTertiary} />
                  <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>إضافة فيديو</Text>
                  <Text style={[styles.imageHintText, { color: colors.textTertiary }]}>حد أقصى 100MB</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.publishBtn, updating && { opacity: 0.6 }]}
              onPress={handleUpdate}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.publishBtnText}>{t('news.update') || 'تحديث المقال'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* My Articles */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : articles.length > 0 ? (
          articles.map((article) => {
            const articleImages = getArticleImages(article);
            const imgUrl = articleImages[0];
            return (
              <View
                key={article.id}
                style={[styles.articleCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                {imgUrl && (
                  <View>
                    <Image source={{ uri: imgUrl }} style={styles.articleImage} resizeMode="cover" />
                    {articleImages.length > 1 && (
                      <View style={styles.articleImageCountBadge}>
                        <Ionicons name="images-outline" size={12} color="#fff" />
                        <Text style={styles.articleImageCountText}>{articleImages.length}</Text>
                      </View>
                    )}
                  </View>
                )}
                <View style={styles.articleBody}>
                  <Text style={[styles.articleTitle, { color: colors.text }]}>{article.title}</Text>
                  <Text style={[styles.articleContent, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                    {article.content}
                  </Text>
                  <View style={[styles.articleFooter, { flexDirection }]}>
                    <Text style={[styles.articleDate, { color: colors.textTertiary }]}>
                      {formatDate(article.createdAt)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleEdit(article)}
                      >
                        <Ionicons name="create-outline" size={18} color="#8B5CF6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(article)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('news.noArticles')}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.titleLarge,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.labelMedium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  formCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  formTitle: {
    ...TYPOGRAPHY.titleLarge,
    fontWeight: '800',
    marginBottom: SPACING.lg,
    letterSpacing: -0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: 16,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: 16,
    minHeight: 130,
    marginBottom: SPACING.md,
    fontFamily: FONTS.regular,
  },
  imagePickerBtn: {
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  imagePickerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  imagePickerText: {
    ...TYPOGRAPHY.bodyMedium,
  },
  imageHintText: {
    ...TYPOGRAPHY.labelSmall,
    marginTop: 2,
  },
  selectedImagesWrap: {
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  selectedImagesRow: {
    gap: SPACING.sm,
  },
  selectedImageItem: {
    width: 92,
    height: 92,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImageThumb: {
    width: '100%',
    height: '100%',
  },
  selectedImageRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCountText: {
    ...TYPOGRAPHY.labelSmall,
    fontFamily: FONTS.medium,
  },
  previewImage: {
    width: '100%',
    height: 180,
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#8B5CF6',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    ...SHADOWS.sm,
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontFamily: FONTS.extraBold,
  },
  loadingContainer: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  articleCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  articleImage: {
    width: '100%',
    height: 180,
  },
  articleImageCountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
  },
  articleImageCountText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  articleBody: {
    padding: SPACING.lg,
  },
  articleTitle: {
    ...TYPOGRAPHY.titleMedium,
    fontWeight: '800',
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  articleContent: {
    ...TYPOGRAPHY.bodyMedium,
    marginBottom: SPACING.md,
    lineHeight: 22,
    opacity: 0.7,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleDate: {
    ...TYPOGRAPHY.labelSmall,
    opacity: 0.5,
  },
  deleteBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  editBtn: {
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyText: {
    ...TYPOGRAPHY.bodyMedium,
    marginTop: SPACING.lg,
    opacity: 0.6,
  },
});
