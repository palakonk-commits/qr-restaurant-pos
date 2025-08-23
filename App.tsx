
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import LoginScreen from './pages/LoginScreen';
import CashierView from './pages/CashierView/CashierView';
import KDSView from './pages/KDSView/KDSView';
import ManagerView from './pages/ManagerView/ManagerView';
import AuditorView from './pages/AuditorView/AuditorView';
import CustomerMenu from './pages/CustomerView/CustomerMenu';
import { UserRole } from './types';
import Header from './components/Header';
import CustomerOrderStatus from './pages/CustomerView/CustomerOrderStatus';
import PrintLayout from './pages/PrintLayout';


const AppRoutes = () => {
  const { currentUser } = useAppContext();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/menu/:qrId" element={<CustomerMenu />} />
        <Route path="/order/:orderId" element={<CustomerOrderStatus />} />
        <Route path="/print/qr/:sessionId" element={<PrintLayout printType="qr" />} />
        <Route path="/print/receipt/:orderId" element={<PrintLayout printType="receipt" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-auto bg-slate-100 dark:bg-slate-900">
        <Routes>
          <Route path="/menu/:qrId" element={<CustomerMenu />} />
          <Route path="/order/:orderId" element={<CustomerOrderStatus />} />
          
          {currentUser.role === UserRole.Cashier && <Route path="/" element={<CashierView />} />}
          {currentUser.role === UserRole.Kitchen && <Route path="/" element={<KDSView />} />}
          {currentUser.role === UserRole.Manager && <Route path="/" element={<ManagerView />} />}
          {currentUser.role === UserRole.Auditor && <Route path="/" element={<AuditorView />} />}
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};


function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}

export default App;