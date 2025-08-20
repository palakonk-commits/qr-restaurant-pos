
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
        if (index < currentIndex) return 'bg-green-500 border-green-500'; // Completed
        if (index === currentIndex) return 'bg-blue-500 border-blue-500 animate-pulse'; // Current
        return 'bg-gray-300 dark:bg-gray-600 border-gray-300 dark:border-gray-600'; // Upcoming
    };

    return (
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto my-8">
            {statuses.map((s, i) => (
                <React.Fragment key={s}>
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${getStatusClass(i)}`}>
                            {i < currentIndex && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <p className={`mt-2 font-semibold text-sm text-center ${i <= currentIndex ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>{t(s)}</p>
                    </div>
                    {i < statuses.length - 1 && <div className={`flex-1 h-1 mx-2 transition-colors duration-500 ${i < currentIndex ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>}
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
        return <div className="p-8 text-center text-red-500">Order not found.</div>
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center p-4">
             <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>
            <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
                <h1 className="text-3xl font-bold mb-2">{t('yourOrder')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{t('payAtCounterMessage')}</p>
                
                <div className="my-8">
                    <p className="text-lg text-gray-600 dark:text-gray-300">{t('queueNumber')}</p>
                    <p className="text-8xl font-bold text-blue-600 dark:text-blue-400 my-2">{order.queueNumber}</p>
                </div>

                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
                    <p className="text-lg text-gray-600 dark:text-gray-300">{t('orderStatus')}</p>
                    <p className="text-4xl font-bold my-2">{t(order.status)}</p>
                    
                    {order.status !== OrderStatus.Unpaid && order.status !== OrderStatus.Cancelled &&
                        <StatusTimeline status={order.status} />
                    }
                     {order.status === OrderStatus.Cancelled &&
                        <p className="mt-4 text-red-500">This order has been cancelled.</p>
                    }
                </div>
            </div>
        </div>
    );
}

export default CustomerOrderStatus;
