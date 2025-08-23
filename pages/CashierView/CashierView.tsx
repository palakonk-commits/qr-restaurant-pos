
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus, Table, TableStatus } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import QRCode from "react-qr-code";
import OrderDetails from './OrderDetails';
import PaymentModal from './PaymentModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { getAbsoluteUrlWithState } from '../../utils/qr';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 sm:px-6 py-3 font-semibold text-center transition-colors text-sm sm:text-base border-b-2
                ${active 
                    ? 'border-sky-500 text-sky-600 dark:text-sky-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
        >
            {children}
        </button>
    );
};

const NewQRTab: React.FC = () => {
    const context = useAppContext();
    const { createQrSession, t, tables, addTable, removeTable, getQrSession, cancelQrSession, forceClearTable, menuItems, menuCategories, settings } = context;
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
    
    let qrUrl = '';
    if (activeQr) {
        qrUrl = getAbsoluteUrlWithState(`/#/menu/${activeQr.sessionId}?`, menuItems, menuCategories, settings);
    }

    const selectedTable = activeQr ? tables.find(t => t.id === activeQr.tableId) : null;

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{t('floorPlan')}</h2>
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
                            className={`relative p-2 w-full aspect-square flex flex-col items-center justify-center rounded-xl font-bold text-xl transition-all duration-200 transform bg-white dark:bg-slate-800 shadow-sm border-t-8
                                ${isEditingFloorPlan ? 'cursor-default' : 'cursor-pointer hover:scale-105 hover:shadow-lg'}
                                ${isAvailable
                                    ? 'border-teal-400'
                                    : 'border-rose-400'
                                }
                            `}
                        >
                            <span className="text-4xl text-slate-700 dark:text-slate-200">{table.name}</span>
                            <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${isAvailable ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200'}`}>
                                {isAvailable ? 'Available' : 'Occupied'}
                            </span>
                             {isEditingFloorPlan && isAvailable && (
                                <button 
                                    onClick={(e) => handleRemoveTable(e, table)}
                                    className="absolute -top-4 -right-4 bg-rose-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-black text-lg hover:bg-rose-700 shadow-lg transition-transform hover:scale-110"
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
                    <p className="mt-4 font-mono text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{activeQr?.sessionId}</p>
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


const OrderList: React.FC<{ 
    orders: Order[], 
    onOrderSelect: (order: Order) => void,
    onPayClick: (order: Order) => void,
    onCancelClick: (order: Order) => void,
    showActions: boolean 
}> = ({ orders, onOrderSelect, onPayClick, onCancelClick, showActions }) => {
    const { getLocalized, t } = useAppContext();
    if (orders.length === 0) {
        return <div className="text-center p-8 text-slate-500">{`No orders in this category.`}</div>
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {orders.map(order => (
                <div key={order.id} className="bg-white dark:bg-slate-800 rounded-xl shadow p-4 flex flex-col transition-all border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-sky-400 dark:hover:border-sky-600">
                    <div onClick={() => onOrderSelect(order)} className="cursor-pointer flex-grow">
                        <div className="flex justify-between items-center border-b pb-2 mb-2 border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t('order')} #{order.queueNumber}</h3>
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-full">{t(order.status)}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{order.items.length} items</p>
                        <p className="text-xl font-bold mt-2 text-right text-sky-600 dark:text-sky-400">{order.total.toFixed(2)}</p>
                    </div>
                     {showActions && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between space-x-2">
                            <Button variant="danger" className="w-full" onClick={() => onCancelClick(order)}>{t('cancel')}</Button>
                            <Button variant="primary" className="w-full" onClick={() => onPayClick(order)}>{t('pay')}</Button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

const CashierView: React.FC = () => {
  const { orders, t, cancelOrder } = useAppContext();
  const [activeTab, setActiveTab] = useState<'newQR' | 'unpaid' | 'inProgress' | 'completed'>('unpaid');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const unpaidOrders = orders.filter(o => o.status === OrderStatus.Unpaid);
  const inProgressOrders = orders.filter(o => [OrderStatus.Paid, OrderStatus.Preparing, OrderStatus.Ready].includes(o.status));
  const completedOrders = orders.filter(o => [OrderStatus.Served, OrderStatus.Cancelled].includes(o.status)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
  }

  const handlePayClick = (order: Order) => {
    if(order.status === OrderStatus.Unpaid) {
        setSelectedOrder(order);
        setIsPaymentModalOpen(true);
    }
  };
  
  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
  };

  const confirmOrderCancellation = () => {
    if (orderToCancel) {
        cancelOrder(orderToCancel.id, "Cancelled by cashier");
        setOrderToCancel(null);
    }
  };

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
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg">
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <TabButton active={activeTab === 'newQR'} onClick={() => setActiveTab('newQR')}>{t('newQR')}</TabButton>
        <TabButton active={activeTab === 'unpaid'} onClick={() => setActiveTab('unpaid')}>
            {t('unpaid')} <span className="ml-2 bg-rose-500 text-white text-xs font-bold rounded-full px-2 py-1">{unpaidOrders.length}</span>
        </TabButton>
        <TabButton active={activeTab === 'inProgress'} onClick={() => setActiveTab('inProgress')}>{t('inProgress')}</TabButton>
        <TabButton active={activeTab === 'completed'} onClick={() => setActiveTab('completed')}>{t('completed')}</TabButton>
      </div>

      <div className="flex-grow overflow-y-auto bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
        {activeTab === 'newQR' && <NewQRTab />}
        {activeTab === 'unpaid' && <OrderList orders={unpaidOrders} onOrderSelect={handleOrderSelect} onPayClick={handlePayClick} onCancelClick={handleCancelClick} showActions={true} />}
        {activeTab === 'inProgress' && <OrderList orders={inProgressOrders} onOrderSelect={handleOrderSelect} onPayClick={()=>{}} onCancelClick={()=>{}} showActions={false} />}
        {activeTab === 'completed' && <OrderList orders={completedOrders} onOrderSelect={handleOrderSelect} onPayClick={()=>{}} onCancelClick={()=>{}} showActions={false} />}
      </div>

       <Modal isOpen={!!selectedOrder && !isPaymentModalOpen} onClose={closeModals} title={`${t('order')} #${selectedOrder?.queueNumber}`}>
          {selectedOrder && <OrderDetails order={selectedOrder} />}
           <div className="mt-4 flex justify-end space-x-2">
               {selectedOrder?.status === OrderStatus.Unpaid && (
                   <Button onClick={() => handlePayClick(selectedOrder)}>{t('pay')}</Button>
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
       {orderToCancel && (
            <ConfirmationModal
                isOpen={!!orderToCancel}
                onClose={() => setOrderToCancel(null)}
                onConfirm={confirmOrderCancellation}
                title={t('confirmCancelOrderTitle')}
            >
                <p>{t('confirmCancelOrderMessage')}</p>
            </ConfirmationModal>
        )}
    </div>
  );
};

export default CashierView;