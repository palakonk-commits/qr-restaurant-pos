
import React from 'react';
import { useAppContext } from '../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import Button from './common/Button';

const Header: React.FC = () => {
  const { currentUser, logout, t, getLocalized } = useAppContext();

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
      <h1 className="text-2xl font-bold text-sky-600 dark:text-sky-400">{t('appName')}</h1>
      <div className="flex items-center space-x-4">
        {currentUser && (
          <div className='text-right'>
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentUser.name}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 block">{t(currentUser.role)}</span>
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