import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus, Table, TableStatus } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import QRCode from "react-qr-code";
import OrderDetails from './OrderDetails';
import PaymentModal from './PaymentModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-lg font-semibold border-b-4 transition-colors ${
                active ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
            {children}
        </button>
    );
};

const NewQRTab: React.FC = () => {
    const { createQrSession, t, tables, addTable, removeTable, getQrSession, cancelQrSession, forceClearTable } = useAppContext();
    const [activeQr, setActiveQr] = useState<{ sessionId: string; tableId: string } | null>(null);
    const [isEditingFloorPlan, setIsEditingFloorPlan] = useState(false);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: React.ReactNode;
        onConfirm: () => void;
    } | null>(null);


    const handleTableSelect = (table: Table) => {
        if (isEditingFloorPlan) return;
        
        if (table.status === TableStatus.Available) {
            const session = createQrSession(table.id);
            setActiveQr({ sessionId: session.id, tableId: table.id });
        } else {
            setConfirmation({
                isOpen: true,
                title: t('confirmClearTableTitle'),
                message: <p>{t('confirmClearTableMessage')}</p>,
                onConfirm: () => forceClearTable(table.id)
            });
        }
    };
    
    const handleRemoveTable = (e: React.MouseEvent, table: Table) => {
        e.stopPropagation(); // Prevent card click
        setConfirmation({
            isOpen: true,
            title: t('confirmRemoveTableTitle'),
            message: <p>{t('confirmRemoveTableMessage')}</p>,
            onConfirm: () => removeTable(table.id)
        });
    };

    const handleCloseQrModal = () => {
        if (activeQr) {
            const session = getQrSession(activeQr.sessionId);
            if (session && session.status === 'active' && !session.orderId) {
                cancelQrSession(session.id);
            }
        }
        setActiveQr(null);
    };

    const handlePrint = () => {
        if (!activeQr) return;
        const url = `#/print/qr/${activeQr.sessionId}`;
        window.open(url, '_blank', 'width=302,height=500'); // Approx width for thermal printer slip
    };

    // Correctly build the QR Code URL to be environment-agnostic
    const getAbsoluteUrl = (hashPath: string) => {
        const { origin, pathname } = window.location;
        // This ensures a clean base URL, removing any potential `index.html` or query strings
        // that exist in sandboxed environments like Google Studio.
        const cleanPath = pathname.replace(/index\.html$/, '');
        const baseUrl = `${origin}${cleanPath}`;
        return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${hashPath}`;
    };
    
    const qrUrl = activeQr ? getAbsoluteUrl(`/#/menu/${activeQr.sessionId}`) : '';
    const selectedTable = activeQr ? tables.find(t => t.id === activeQr.tableId) : null;

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t('floorPlan')}</h2>
                 <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => setIsEditingFloorPlan(p => !p)}>
                        {isEditingFloorPlan ? t('doneManaging') : t('editFloorPlan')}
                    </Button>
                    <Button onClick={addTable}>{t('addTable')}</Button>
                 </div>
            </div>
           
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                {tables.map(table => {
                    const isAvailable = table.status === TableStatus.Available;
                    return (
                        <div 
                            key={table.id}
                            onClick={() => handleTableSelect(table)}
                            className={`relative p-2 w-full aspect-square flex flex-col items-center justify-center rounded-lg border-2 font-bold text-xl transition-all duration-200 transform
                                ${isEditingFloorPlan ? 'cursor-default' : 'cursor-pointer hover:scale-105 hover:shadow-lg'}
                                ${isAvailable
                                    ? 'bg-green-100 dark:bg-gray-800 border-green-400 text-green-800 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-gray-800 border-red-400 text-red-800 dark:text-red-300'
                                }
                            `}
                        >
                            <span className="text-3xl">{table.name}</span>
                            <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${isAvailable ? 'bg-green-200 dark:bg-green-900/50' : 'bg-red-200 dark:bg-red-900/50'}`}>
                                {isAvailable ? 'Available' : 'Occupied'}
                            </span>
                             {isEditingFloorPlan && isAvailable && (
                                <button 
                                    onClick={(e) => handleRemoveTable(e, table)}
                                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-lg hover:bg-red-700 shadow-lg transition-transform hover:scale-110"
                                    aria-label={`Remove table ${table.name}`}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            <Modal isOpen={!!activeQr} onClose={handleCloseQrModal} title={`QR Code for Table ${selectedTable?.name || ''}`}>
                <div className="flex flex-col items-center p-4">
                    <p className="text-center mb-4 text-lg">Scan this QR code to order.</p>
                    <div className="bg-white p-4 rounded-lg shadow-inner">
                        {qrUrl && <QRCode value={qrUrl} size={256} />}
                    </div>
                    <p className="mt-4 font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{activeQr?.sessionId}</p>
                    <div className="mt-6 flex space-x-4">
                        <Button onClick={handlePrint}>Print Slip</Button>
                        <Button variant="secondary" onClick={handleCloseQrModal}>{t('close')}</Button>
                    </div>
                </div>
            </Modal>
            
            {confirmation && (
                <ConfirmationModal
                    isOpen={confirmation.isOpen}
                    onClose={() => setConfirmation(null)}
                    onConfirm={confirmation.onConfirm}
                    title={confirmation.title}
                >
                    {confirmation.message}
                </ConfirmationModal>
            )}
        </div>
    );
};


const OrderList: React.FC<{ orders: Order[], onOrderSelect: (order: Order) => void }> = ({ orders, onOrderSelect }) => {
    const { getLocalized, t } = useAppContext();
    if (orders.length === 0) {
        return <div className="text-center p-8 text-gray-500">{`No orders in this category.`}</div>
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {orders.map(order => (
                <div key={order.id} onClick={() => onOrderSelect(order)} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-center border-b pb-2 mb-2 dark:border-gray-700">
                        <h3 className="font-bold text-lg">{t('order')} #{order.queueNumber}</h3>
                        <span className="text-sm font-semibold px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">{t(order.status)}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{order.items.length} items</p>
                    <p className="text-lg font-bold mt-2 text-right text-blue-600 dark:text-blue-400">{order.total.toFixed(2)}</p>
                </div>
            ))}
        </div>
    )
}

const CashierView: React.FC = () => {
  const { orders, t } = useAppContext();
  const [activeTab, setActiveTab] = useState<'newQR' | 'unpaid' | 'inProgress' | 'completed'>('newQR');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const unpaidOrders = orders.filter(o => o.status === OrderStatus.Unpaid);
  const inProgressOrders = orders.filter(o => [OrderStatus.Paid, OrderStatus.Preparing, OrderStatus.Ready].includes(o.status));
  const completedOrders = orders.filter(o => [OrderStatus.Served, OrderStatus.Cancelled].includes(o.status)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  }

  const handlePay = () => {
    if(selectedOrder?.status === OrderStatus.Unpaid) {
        setIsPaymentModalOpen(true);
    }
  }

  const handlePrintReceipt = () => {
      if(!selectedOrder) return;
      const url = `#/print/receipt/${selectedOrder.id}`;
      window.open(url, '_blank', 'width=302,height=800');
  }

  const closeModals = () => {
      setSelectedOrder(null);
      setIsPaymentModalOpen(false);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <TabButton active={activeTab === 'newQR'} onClick={() => setActiveTab('newQR')}>{t('newQR')}</TabButton>
        <TabButton active={activeTab === 'unpaid'} onClick={() => setActiveTab('unpaid')}>{t('unpaid')} <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">{unpaidOrders.length}</span></TabButton>
        <TabButton active={activeTab === 'inProgress'} onClick={() => setActiveTab('inProgress')}>{t('inProgress')}</TabButton>
        <TabButton active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>{t('completed')}</TabButton>
      </div>

      <div className="flex-grow overflow-y-auto">
        {activeTab === 'newQR' && <NewQRTab />}
        {activeTab === 'unpaid' && <OrderList orders={unpaidOrders} onOrderSelect={handleOrderSelect} />}
        {activeTab === 'inProgress' && <OrderList orders={inProgressOrders} onOrderSelect={handleOrderSelect} />}
        {activeTab === 'completed' && <OrderList orders={completedOrders} onOrderSelect={handleOrderSelect} />}
      </div>

       <Modal isOpen={!!selectedOrder && !isPaymentModalOpen} onClose={closeModals} title={`${t('order')} #${selectedOrder?.queueNumber}`}>
          {selectedOrder && <OrderDetails order={selectedOrder} />}
           <div className="mt-4 flex justify-end space-x-2">
               {selectedOrder?.status === OrderStatus.Unpaid && (
                   <Button onClick={handlePay}>{t('pay')}</Button>
               )}
               {selectedOrder && [OrderStatus.Served, OrderStatus.Paid, OrderStatus.Ready, OrderStatus.Preparing].includes(selectedOrder.status) && (
                   <Button onClick={handlePrintReceipt} variant='primary'>{t('printReceipt')}</Button>
               )}
               <Button variant="secondary" onClick={closeModals}>{t('close')}</Button>
           </div>
       </Modal>
       {selectedOrder && (
            <PaymentModal 
                order={selectedOrder}
                isOpen={isPaymentModalOpen}
                onClose={closeModals}
            />
       )}
    </div>
  );
};

export default CashierView;