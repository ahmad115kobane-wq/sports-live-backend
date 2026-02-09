import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager, Platform, Alert } from 'react-native';
import i18n, { 
  LANGUAGES, 
  LanguageCode, 
  getStoredLanguage, 
  changeLanguage as i18nChangeLanguage,
  isRTL,
  getCurrentLanguage 
} from '@/i18n';

interface RTLContextType {
  isRTL: boolean;
  language: LanguageCode;
  languageInfo: typeof LANGUAGES[LanguageCode];
  changeLanguage: (code: LanguageCode) => Promise<void>;
  t: typeof i18n.t;
  direction: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  flexDirection: 'row' | 'row-reverse';
}

const RTLContext = createContext<RTLContextType | undefined>(undefined);

interface RTLProviderProps {
  children: ReactNode;
}

export const RTLProvider: React.FC<RTLProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('ar');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initLanguage = async () => {
      const storedLang = await getStoredLanguage();
      setLanguage(storedLang);
      
      // Ensure RTL is set correctly on startup
      const shouldBeRTL = isRTL(storedLang);
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.allowRTL(shouldBeRTL);
        I18nManager.forceRTL(shouldBeRTL);
      }
      
      setIsReady(true);
    };
    
    initLanguage();
  }, []);

  const handleChangeLanguage = async (code: LanguageCode) => {
    const wasRTL = I18nManager.isRTL;
    const willBeRTL = isRTL(code);
    
    await i18nChangeLanguage(code);
    setLanguage(code);
    
    // If RTL direction changed, we need to reload the app
    if (wasRTL !== willBeRTL) {
      I18nManager.allowRTL(willBeRTL);
      I18nManager.forceRTL(willBeRTL);
      
      // Inform user to restart app for RTL changes
      Alert.alert(
        code === 'ar' ? 'إعادة التشغيل مطلوبة' : code === 'ku' ? 'پێویستە ئەپ ڕیستارت بکرێت' : 'Restart Required',
        code === 'ar' ? 'يرجى إعادة تشغيل التطبيق لتطبيق تغييرات اللغة.' : code === 'ku' ? 'تکایە ئەپەکە ڕیستارت بکە بۆ جێبەجێکردنی گۆڕانکارییەکانی زمان.' : 'Please restart the app to apply language direction changes.',
        [{ text: code === 'ar' ? 'حسناً' : code === 'ku' ? 'باشە' : 'OK' }]
      );
    }
  };

  const currentIsRTL = isRTL(language);

  // When language is RTL (Arabic/Kurdish), isRTL=true means content should flow right-to-left
  // When language is LTR (English), isRTL=false means content should flow left-to-right
  const value: RTLContextType = {
    isRTL: !currentIsRTL, // Inverted because the app default is Arabic RTL
    language,
    languageInfo: LANGUAGES[language],
    changeLanguage: handleChangeLanguage,
    t: i18n.t.bind(i18n),
    direction: currentIsRTL ? 'rtl' : 'ltr',
    textAlign: !currentIsRTL ? 'right' : 'left',
    flexDirection: !currentIsRTL ? 'row-reverse' : 'row',
  };

  if (!isReady) {
    return null; // Or a loading component
  }

  return (
    <RTLContext.Provider value={value}>
      {children}
    </RTLContext.Provider>
  );
};

export const useRTL = (): RTLContextType => {
  const context = useContext(RTLContext);
  if (!context) {
    throw new Error('useRTL must be used within an RTLProvider');
  }
  return context;
};

// Hook for getting directional styles
export const useDirectionalStyles = () => {
  const { isRTL, direction, textAlign, flexDirection } = useRTL();
  
  return {
    isRTL,
    direction,
    textAlign,
    flexDirection,
    // Helper for margin/padding
    marginStart: isRTL ? 'marginRight' : 'marginLeft',
    marginEnd: isRTL ? 'marginLeft' : 'marginRight',
    paddingStart: isRTL ? 'paddingRight' : 'paddingLeft',
    paddingEnd: isRTL ? 'paddingLeft' : 'paddingRight',
    // Helper for absolute positioning
    start: isRTL ? 'right' : 'left',
    end: isRTL ? 'left' : 'right',
    // Transform for icons
    iconTransform: isRTL ? [{ scaleX: -1 }] : [],
  };
};

export default RTLContext;
