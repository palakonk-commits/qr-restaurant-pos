
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { User } from '../types';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import LanguageSwitcher from '../components/LanguageSwitcher';

const PinInput: React.FC<{ onPinComplete: (pin: string) => void; onCancel: () => void }> = ({ onPinComplete, onCancel }) => {
    const [pin, setPin] = useState('');
    const { t } = useAppContext();

    const handlePinClick = (num: string) => {
        if (pin.length < 4) {
            setPin(pin + num);
        }
    };
    const handleBackspace = () => {
        setPin(pin.slice(0, -1));
    };
    const handleSubmit = () => {
        onPinComplete(pin);
        setPin('');
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex space-x-4 my-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 border-2 rounded-full flex items-center justify-center dark:border-slate-500">
                        {i < pin.length && <div className="w-5 h-5 bg-sky-500 rounded-full"></div>}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                    <button key={i+1} onClick={() => handlePinClick((i+1).toString())} className="text-2xl w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">{i+1}</button>
                ))}
                 <button onClick={handleBackspace} className="text-2xl w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L18 12M3 12l6.414-6.414a2 2 0 012.828 0L18 12" /></svg>
                 </button>
                <button onClick={() => handlePinClick('0')} className="text-2xl w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">0</button>
                <button onClick={handleSubmit} className="text-2xl w-20 h-20 rounded-2xl bg-sky-500 text-white hover:bg-sky-600 transition-colors flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
            </div>
            <div className="mt-6 w-full">
              <Button variant="secondary" onClick={onCancel} className="w-full">{t('cancel')}</Button>
            </div>
        </div>
    );
};


const LoginScreen: React.FC = () => {
  const { users, login, t } = useAppContext();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setError('');
  };

  const handlePinSubmit = (pin: string) => {
    if (selectedUser) {
      const success = login(selectedUser.id, pin);
      if (!success) {
        setError('Invalid PIN. Please try again.');
      } else {
        setSelectedUser(null); // Close modal on success
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4">
        <div className="absolute top-4 right-4">
            <LanguageSwitcher />
        </div>
      <h1 className="text-4xl font-bold mb-4 text-sky-600">{t('appName')}</h1>
      <h2 className="text-2xl mb-8 text-slate-600 dark:text-slate-300">{t('selectUser')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {users.map(user => (
          <div
            key={user.id}
            onClick={() => handleUserSelect(user)}
            className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-xl hover:scale-105 transition-all cursor-pointer text-center border-2 border-transparent hover:border-sky-400"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-300 text-4xl font-bold mb-4">
              {user.name.charAt(0)}
            </div>
            <p className="font-semibold text-xl">{user.name}</p>
            <p className="text-slate-500 dark:text-slate-400">{t(user.role)}</p>
          </div>
        ))}
      </div>
      
      <Modal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        title={`${t('enterPin')} for ${selectedUser?.name}`}
      >
        <div>
            {error && <p className="text-rose-500 text-center mb-4">{error}</p>}
            <PinInput 
                onPinComplete={handlePinSubmit}
                onCancel={() => setSelectedUser(null)}
            />
        </div>
      </Modal>
    </div>
  );
};

export default LoginScreen;