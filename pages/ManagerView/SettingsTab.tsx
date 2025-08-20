import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../../components/common/Button';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const SettingsTab: React.FC = () => {
    const { settings, updateSettings, t, clearAllData } = useAppContext();
    const [vat, setVat] = useState(settings.vatRate * 100);
    const [serviceCharge, setServiceCharge] = useState(settings.serviceChargeRate * 100);
    const [expiry, setExpiry] = useState(settings.qrCodeExpiryMinutes);
    const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

    useEffect(() => {
        setVat(settings.vatRate * 100);
        setServiceCharge(settings.serviceChargeRate * 100);
        setExpiry(settings.qrCodeExpiryMinutes);
    }, [settings]);

    const handleSave = () => {
        updateSettings({
            vatRate: vat / 100,
            serviceChargeRate: serviceCharge / 100,
            qrCodeExpiryMinutes: expiry,
        });
        alert('Settings saved!');
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-8">
            <div>
                <h2 className="text-xl font-bold mb-4">{t('systemSettings')}</h2>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('vatRate')}</label>
                        <input type="number" value={vat} onChange={e => setVat(parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('serviceChargeRate')}</label>
                        <input type="number" value={serviceCharge} onChange={e => setServiceCharge(parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('qrCodeExpiry')}</label>
                        <input type="number" value={expiry} onChange={e => setExpiry(parseInt(e.target.value, 10))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                    </div>
                    <div className="text-right">
                        <Button onClick={handleSave}>{t('save')}</Button>
                    </div>
                </div>
            </div>

            <div className="border-t pt-6 dark:border-gray-600">
                <h2 className="text-xl font-bold mb-4 text-red-600">{t('dataManagement')}</h2>
                 <div className="p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
                     <p className="text-red-700 dark:text-red-300 mb-4">
                        Permanently delete all orders, tables, and settings. This cannot be undone.
                     </p>
                     <Button variant="danger" onClick={() => setIsClearDataModalOpen(true)}>
                        {t('clearAllData')}
                     </Button>
                </div>
            </div>
            
            <ConfirmationModal
                isOpen={isClearDataModalOpen}
                onClose={() => setIsClearDataModalOpen(false)}
                onConfirm={clearAllData}
                title={t('confirmClearDataTitle')}
            >
                <p>{t('confirmClearDataMessage')}</p>
            </ConfirmationModal>
        </div>
    );
};

export default SettingsTab;