
import React from 'react';
import { useAppContext } from '../context/AppContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useAppContext();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
    >
      {language === 'en' ? t('th') : t('en')}
    </button>
  );
};

export default LanguageSwitcher;