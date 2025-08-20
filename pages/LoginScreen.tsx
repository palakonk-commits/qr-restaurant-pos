
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
            <div className="flex space-x-2 my-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 border-2 rounded-full flex items-center justify-center dark:border-gray-500">
                        {i < pin.length && <div className="w-4 h-4 bg-blue-500 rounded-full"></div>}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                    <button key={i+1} onClick={() => handlePinClick((i+1).toString())} className="text-2xl w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">{i+1}</button>
                ))}
                 <button onClick={handleBackspace} className="text-2xl w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">{'<'}</button>
                <button onClick={() => handlePinClick('0')} className="text-2xl w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">0</button>
                <button onClick={handleSubmit} className="text-2xl w-16 h-16 rounded-full bg-blue-500 text-white hover:bg-blue-600">{'>'}</button>
            </div>
            <Button variant="secondary" onClick={onCancel} className="mt-4">{t('cancel')}</Button>
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="absolute top-4 right-4">
            <LanguageSwitcher />
        </div>
      <h1 className="text-4xl font-bold mb-8">{t('appName')}</h1>
      <h2 className="text-2xl mb-6">{t('selectUser')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {users.map(user => (
          <div
            key={user.id}
            onClick={() => handleUserSelect(user)}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-transform cursor-pointer text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold mb-4">
              {user.name.charAt(0)}
            </div>
            <p className="font-semibold text-lg">{user.name}</p>
            <p className="text-gray-500 dark:text-gray-400">{t(user.role)}</p>
          </div>
        ))}
      </div>
      
      <Modal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        title={`${t('enterPin')} for ${selectedUser?.name}`}
      >
        <div>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
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
