import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { useAppContext } from '../../context/AppContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  const { t } = useAppContext();
  
  const handleConfirm = () => {
    onConfirm();
    onClose(); // Automatically close on confirm
  };

  const footerContent = (
    <div className="flex justify-end space-x-2">
      <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
      <Button variant="danger" onClick={handleConfirm}>{t('confirm')}</Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footerContent}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;