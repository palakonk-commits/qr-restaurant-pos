
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6">
            <h1 className="text-3xl font-bold mb-4">{t('managerDashboard')}</h1>
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 sm:px-6 py-3 font-semibold text-center transition-colors text-sm sm:text-base border-b-2
                            ${activeTab === tab.id 
                                ? 'border-sky-500 text-sky-600 dark:text-sky-400' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
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