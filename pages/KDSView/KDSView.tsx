
import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus, OrderItem } from '../../types';
import Button from '../../components/common/Button';

const OrderItemTicket: React.FC<{ item: OrderItem }> = ({ item }) => {
    const { getLocalized } = useAppContext();
    return (
        <div className="py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
            <p className="font-bold">{item.quantity}x {getLocalized(item.menuItem.name)}</p>
            <div className="pl-4 text-sm text-slate-600 dark:text-slate-400">
                {Object.values(item.selectedOptions).flat().map(opt => (
                    <p key={getLocalized(opt.name)}>+ {getLocalized(opt.name)}</p>
                ))}
                {item.notes && <p className="italic text-rose-500">Notes: {item.notes}</p>}
            </div>
        </div>
    );
};

const OrderTicket: React.FC<{ order: Order }> = ({ order }) => {
    const { updateOrderStatus, t, getLocalized } = useAppContext();
    const timeSinceOrderPlaced = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
    
    const getBackgroundColor = () => {
        if (timeSinceOrderPlaced > 10) return 'bg-rose-50 dark:bg-rose-900/40 border-rose-400'; // Over 10 mins
        if (timeSinceOrderPlaced > 5) return 'bg-amber-50 dark:bg-amber-900/40 border-amber-400'; // Over 5 mins
        return 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600';
    };

    const handleNextStep = () => {
        if (order.status === OrderStatus.Unpaid || order.status === OrderStatus.Paid) {
            updateOrderStatus(order.id, OrderStatus.Preparing);
        } else if (order.status === OrderStatus.Preparing) {
            updateOrderStatus(order.id, OrderStatus.Ready);
        } else if (order.status === OrderStatus.Ready) {
            updateOrderStatus(order.id, OrderStatus.Served);
        }
    };
    
    const nextStepText = () => {
        if (order.status === OrderStatus.Unpaid || order.status === OrderStatus.Paid) return t('startCooking');
        if (order.status === OrderStatus.Preparing) return t('markAsReady');
        if (order.status === OrderStatus.Ready) return t('markAsServed');
        return '';
    };

    return (
        <div className={`rounded-xl shadow-md border-2 flex flex-col h-full ${getBackgroundColor()}`}>
            <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <div className="flex items-center mb-1">
                        <h3 className="font-extrabold text-2xl">#{order.queueNumber}</h3>
                        {order.status === OrderStatus.Unpaid && (
                            <span className="ml-2 text-xs font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 px-2 py-1 rounded-full">{t('unpaid')}</span>
                        )}
                    </div>
                    <p className="text-sm font-semibold">{t(order.serviceType)}</p>
                </div>
                <div className="text-xl font-bold text-right">{timeSinceOrderPlaced} min</div>
            </div>
            <div className="p-4 space-y-2 flex-grow overflow-y-auto">
                {order.items.map(item => (
                    <OrderItemTicket key={item.id} item={item} />
                ))}
            </div>
            {nextStepText() && (
                 <div className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-b-lg">
                    <Button onClick={handleNextStep} className="w-full py-3 text-lg">
                        {nextStepText()}
                    </Button>
                </div>
            )}
        </div>
    );
};

const KDSView: React.FC = () => {
    const { orders, t } = useAppContext();

    const activeOrders = useMemo(() => {
        return orders
            .filter(o => [OrderStatus.Unpaid, OrderStatus.Paid, OrderStatus.Preparing, OrderStatus.Ready].includes(o.status))
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [orders]);
    
    return (
        <div className="p-0 sm:p-4 h-full">
            <h1 className="text-3xl font-bold mb-4 text-center">{t('kitchenDisplaySystem')}</h1>
             {activeOrders.length === 0 ? (
                <div className="flex items-center justify-center h-full text-2xl text-slate-500">
                    No active orders.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {activeOrders.map(order => (
                        <OrderTicket key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default KDSView;
