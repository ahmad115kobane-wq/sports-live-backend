import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SPACING, RADIUS, SHADOWS } from '@/constants/Theme';
import { useRTL } from '@/contexts/RTLContext';
import { LANGUAGES, LanguageCode } from '@/i18n';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { language, changeLanguage, t, isRTL } = useRTL();

  const handleSelectLanguage = async (langCode: LanguageCode) => {
    if (langCode !== language) {
      await changeLanguage(langCode);
    }
    onClose();
  };

  const languageList = Object.values(LANGUAGES);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              ...SHADOWS.lg,
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('settings.selectLanguage')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.languageList}>
            {languageList.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  {
                    backgroundColor:
                      language === lang.code
                        ? colors.primary + '20'
                        : 'transparent',
                    borderColor:
                      language === lang.code ? colors.primary : colors.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
                onPress={() => handleSelectLanguage(lang.code as LanguageCode)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={[styles.langInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text
                    style={[
                      styles.langName,
                      {
                        color:
                          language === lang.code ? colors.primary : colors.text,
                      },
                    ]}
                  >
                    {lang.nativeName}
                  </Text>
                  <Text style={[styles.langSubtext, { color: colors.textSecondary }]}>
                    {lang.name}
                  </Text>
                </View>
                {language === lang.code && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                    style={isRTL ? { marginRight: 'auto' } : { marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {isRTL
                ? 'سيتم إعادة تشغيل التطبيق عند تغيير اتجاه اللغة'
                : 'App will restart when language direction changes'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  languageList: {
    padding: SPACING.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    marginBottom: SPACING.sm,
  },
  flag: {
    fontSize: 32,
    marginHorizontal: SPACING.md,
  },
  langInfo: {
    flex: 1,
  },
  langName: {
    fontSize: 16,
    fontWeight: '600',
  },
  langSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default LanguageSelector;
