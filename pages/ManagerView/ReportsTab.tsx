
import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { OrderStatus } from '../../types';
import Button from '../../components/common/Button';

const ReportsTab: React.FC<{ isReadOnly?: boolean }> = ({ isReadOnly = false }) => {
    const { orders, t, getLocalized } = useAppContext();

    const paidOrders = useMemo(() => orders.filter(o => o.status !== OrderStatus.Unpaid && o.status !== OrderStatus.Cancelled), [orders]);

    const salesSummary = useMemo(() => {
        const totalRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = paidOrders.length;
        return { totalRevenue, totalOrders };
    }, [paidOrders]);

    const topSellingItems = useMemo(() => {
        const itemCounts: { [key: string]: { name: { en: string; th: string }, count: number } } = {};
        paidOrders.forEach(order => {
            order.items.forEach(item => {
                if (!itemCounts[item.menuItem.id]) {
                    itemCounts[item.menuItem.id] = { name: item.menuItem.name, count: 0 };
                }
                itemCounts[item.menuItem.id].count += item.quantity;
            });
        });
        return Object.values(itemCounts).sort((a, b) => b.count - a.count).slice(0, 5);
    }, [paidOrders]);
    
    const exportToCSV = () => {
        const headers = ['OrderID', 'Queue', 'Date', 'Status', 'Total', 'Item Name', 'Quantity', 'Item Price'];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
        
        orders.forEach(order => {
            order.items.forEach(item => {
                const row = [
                    order.id,
                    order.queueNumber,
                    new Date(order.createdAt).toISOString(),
                    order.status,
                    order.total.toFixed(2),
                    getLocalized(item.menuItem.name).replace(/,/g, ''), // remove commas
                    item.quantity,
                    item.totalPrice.toFixed(2)
                ].join(',');
                csvContent += row + "\n";
            });
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "sales_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="p-0 sm:p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{t('reports')}</h2>
                {!isReadOnly && <Button onClick={exportToCSV}>{t('exportToCSV')}</Button>}
            </div>
            
            {/* Sales Summary */}
            <div>
                <h3 className="text-lg font-semibold mb-2">{t('salesSummary')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('totalRevenue')}</p>
                        <p className="text-3xl font-bold">{salesSummary.totalRevenue.toFixed(2)}</p>
                    </div>
                     <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('totalOrders')}</p>
                        <p className="text-3xl font-bold">{salesSummary.totalOrders}</p>
                    </div>
                </div>
            </div>

            {/* Top Selling Items */}
            <div>
                 <h3 className="text-lg font-semibold mb-2">{t('topSellingItems')}</h3>
                 <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
                     {topSellingItems.length > 0 ? (
                        <ul className="space-y-3">
                            {topSellingItems.map(item => (
                                <li key={getLocalized(item.name)} className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-600 last:border-0 last:pb-0">
                                    <span>{getLocalized(item.name)}</span>
                                    <span className="font-bold bg-slate-200 dark:bg-slate-600 text-sm px-2 py-1 rounded-md">{item.count}</span>
                                </li>
                            ))}
                        </ul>
                     ) : (
                        <p className="text-slate-500 text-center py-4">No sales data yet.</p>
                     )}
                 </div>
            </div>
        </div>
    );
};

export default ReportsTab;