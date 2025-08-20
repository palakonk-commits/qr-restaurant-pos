
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
      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
    >
      {language === 'en' ? t('th') : t('en')}
    </button>
  );
};

export default LanguageSwitcher;
