
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import MenuManagementTab from './MenuManagementTab';
import ReportsTab from './ReportsTab';
import SettingsTab from './SettingsTab';
import AuditLogTab from './AuditLogTab';

const ManagerView: React.FC = () => {
    const { t } = useAppContext();
    const [activeTab, setActiveTab] = useState('menu');
    
    const tabs = [
        { id: 'menu', label: t('menuManagement'), component: <MenuManagementTab /> },
        { id: 'reports', label: t('reports'), component: <ReportsTab /> },
        { id: 'settings', label: t('settings'), component: <SettingsTab /> },
        { id: 'audit', label: t('auditLog'), component: <AuditLogTab /> },
    ];
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-4">{t('managerDashboard')}</h1>
            <div className="flex border-b dark:border-gray-700 mb-4">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-lg font-semibold transition-colors ${
                            activeTab === tab.id 
                                ? 'border-b-4 border-blue-500 text-blue-600 dark:text-blue-400' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div>
                {tabs.find(tab => tab.id === activeTab)?.component}
            </div>
        </div>
    );
};

export default ManagerView;
