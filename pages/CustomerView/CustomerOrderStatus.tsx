
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Order, OrderStatus } from '../../types';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const StatusTimeline: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const { t } = useAppContext();
    const statuses = [OrderStatus.Paid, OrderStatus.Preparing, OrderStatus.Ready, OrderStatus.Served];
    const currentIndex = statuses.indexOf(status);

    const getStatusClass = (index: number) => {
        if (index < currentIndex) return 'bg-teal-500 border-teal-500'; // Completed
        if (index === currentIndex) return 'bg-sky-500 border-sky-500 animate-pulse'; // Current
        return 'bg-slate-300 dark:bg-slate-600 border-slate-300 dark:border-slate-600'; // Upcoming
    };

    return (
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto my-8">
            {statuses.map((s, i) => (
                <React.Fragment key={s}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${getStatusClass(i)}`}>
                            {i < currentIndex && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <p className={`mt-2 font-semibold text-sm w-20 ${i <= currentIndex ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{t(s)}</p>
                    </div>
                    {i < statuses.length - 1 && <div className={`flex-1 h-1.5 mx-2 rounded-full transition-colors duration-500 ${i < currentIndex ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>}
                </React.Fragment>
            ))}
        </div>
    );
};

const CustomerOrderStatus: React.FC = () => {
    const { orderId } = useParams();
    const { orders, t, getLocalized } = useAppContext();
    const [order, setOrder] = useState<Order | undefined>(undefined);

    useEffect(() => {
        const foundOrder = orders.find(o => o.id === orderId);
        setOrder(foundOrder);
    }, [orders, orderId]);

    if (!order) {
        return <div className="p-8 text-center text-rose-500">Order not found.</div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-white dark:from-sky-950 dark:via-slate-900 dark:to-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4">
             <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <div className="w-full max-w-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                <h1 className="text-3xl font-bold mb-2">{t('yourOrder')}</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-4">{t('payAtCounterMessage')}</p>
                
                <div className="my-8">
                    <p className="text-lg text-slate-600 dark:text-slate-300">{t('queueNumber')}</p>
                    <p className="text-8xl font-bold text-sky-500 my-2">{order.queueNumber}</p>
                </div>

                <div className="bg-slate-100/80 dark:bg-slate-700/50 rounded-lg p-6">
                    <p className="text-lg text-slate-600 dark:text-slate-300">{t('orderStatus')}</p>
                    <p className="text-4xl font-bold my-2">{t(order.status)}</p>
                    
                    {order.status !== OrderStatus.Unpaid && order.status !== OrderStatus.Cancelled &&
                        <StatusTimeline status={order.status} />
                    }
                     {order.status === OrderStatus.Cancelled &&
                        <p className="mt-4 text-rose-500">This order has been cancelled.</p>
                    }
                </div>
            </div>
        </div>
    );
}

export default CustomerOrderStatus;