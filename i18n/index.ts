import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';

import ar from './locales/ar.json';
import en from './locales/en.json';
import ku from './locales/ku.json';

// Flag constants
const FLAG_IRAQ = String.fromCodePoint(0x1F1EE, 0x1F1F6);
const FLAG_GB = String.fromCodePoint(0x1F1EC, 0x1F1E7);
const FLAG_KURDISTAN = String.fromCodePoint(0x2600, 0xFE0F);

export const LANGUAGES = {
  ar: {
    code: 'ar',
    name: 'العربية',
    nativeName: 'العربية',
    isRTL: true,
    flag: FLAG_IRAQ,
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    isRTL: false,
    flag: FLAG_GB,
  },
  ku: {
    code: 'ku',
    name: 'Kurdish',
    nativeName: 'کوردی',
    isRTL: true,
    flag: FLAG_KURDISTAN,
  },
};

export type LanguageCode = keyof typeof LANGUAGES;

const LANGUAGE_STORAGE_KEY = '@sports_live_language';

// Resources for i18next
const resources = {
  ar: { translation: ar },
  en: { translation: en },
  ku: { translation: ku },
};

// Get stored language or default to Arabic (synchronous for web)
export const getStoredLanguage = async (): Promise<LanguageCode> => {
  try {
    // Use localStorage for web
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const storedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLang && storedLang in LANGUAGES) {
          return storedLang as LanguageCode;
        }
      }
    } else {
      // Use AsyncStorage for native platforms
      const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLang && storedLang in LANGUAGES) {
        return storedLang as LanguageCode;
      }
    }
  } catch (error) {
    console.log('Error getting stored language:', error);
  }
  return 'ar'; // Default to Arabic
};

// Save language preference
export const saveLanguage = async (langCode: LanguageCode): Promise<void> => {
  try {
    // Use localStorage for web
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
      }
    } else {
      // Use AsyncStorage for native platforms
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
    }
  } catch (error) {
    console.log('Error saving language:', error);
  }
};

// Check if language is RTL
export const isRTL = (langCode: LanguageCode): boolean => {
  return LANGUAGES[langCode]?.isRTL ?? false;
};

// Get current language info
export const getCurrentLanguage = (): typeof LANGUAGES[LanguageCode] => {
  const currentLang = i18n.language as LanguageCode;
  return LANGUAGES[currentLang] || LANGUAGES.ar;
};

// Change language and update RTL
export const changeLanguage = async (langCode: LanguageCode): Promise<void> => {
  const isLanguageRTL = isRTL(langCode);
  
  // Update i18n
  await i18n.changeLanguage(langCode);
  
  // Save preference
  await saveLanguage(langCode);
  
  // Update RTL setting if needed
  if (I18nManager.isRTL !== isLanguageRTL) {
    I18nManager.allowRTL(isLanguageRTL);
    I18nManager.forceRTL(isLanguageRTL);
    // Note: App needs to be restarted for RTL changes to take effect
    return;
  }
};

// Initialize i18n
const initI18n = async () => {
  const storedLanguage = await getStoredLanguage();
  const isLanguageRTL = isRTL(storedLanguage);
  
  // Set RTL
  I18nManager.allowRTL(isLanguageRTL);
  I18nManager.forceRTL(isLanguageRTL);

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: storedLanguage,
      fallbackLng: 'ar',
      compatibilityJSON: 'v4',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });

  return i18n;
};

// Initialize immediately
initI18n();

export default i18n;
