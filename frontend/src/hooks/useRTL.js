import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useRTL = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const updateDirection = (lng) => {
      const dir = i18n.dir(lng);
      document.documentElement.setAttribute('dir', dir);
      document.body.setAttribute('dir', dir);
      
      if (dir === 'rtl') {
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.classList.remove('rtl');
      }
    };

    updateDirection(i18n.language);

    const handleLanguageChanged = (lng) => {
      updateDirection(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return {
    dir: i18n.dir(i18n.language),
    isRTL: i18n.dir(i18n.language) === 'rtl',
  };
};

export default useRTL;
