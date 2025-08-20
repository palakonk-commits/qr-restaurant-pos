
import React from 'react';
import { useAppContext } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import Button from './common/Button';

const Header: React.FC = () => {
  const { currentUser, logout, t, getLocalized } = useAppContext();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{t('appName')}</h1>
      <div className="flex items-center space-x-4">
        {currentUser && (
          <div className='text-right'>
            <span className="text-gray-800 dark:text-gray-200 font-semibold">{currentUser.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 block">{t(currentUser.role)}</span>
          </div>
        )}
        <LanguageSwitcher />
        {currentUser && (
          <Button onClick={logout} variant="secondary">{t('logout')}</Button>
        )}
      </div>
    </header>
  );
};

export default Header;
