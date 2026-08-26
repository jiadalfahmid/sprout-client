// hooks/useTranslation.ts

import { useAppContext } from '../context/AppContext';
import { translations } from '../i18n/translations';

// A simple key traversal function to handle nested keys like 'home.financialSnapshot.title'
const getNestedTranslation = (lang: string, key: string) => {
    return key.split('.').reduce((obj, k) => {
        return obj && obj[k];
    }, translations as any)?.[lang];
}

export const useTranslation = () => {
  const { language } = useAppContext();

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    let translation = getNestedTranslation(language, key);
    
    // Fallback to English if translation for the current language is not found
    if (!translation) {
      translation = getNestedTranslation('en', key);
    }

    // If still not found, return the key itself as a last resort
    if (!translation) {
      return key;
    }

    // Handle replacements (e.g., t('key', { name: 'John' }))
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            const regex = new RegExp(`{${rKey}}`, 'g');
            translation = translation.replace(regex, String(replacements[rKey]));
        });
    }

    return translation;
  };

  return { t, language };
};
