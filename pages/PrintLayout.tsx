
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAppContext } from '../context/AppContext';
import { getAbsoluteUrlWithState } from '../utils/qr';

const PrintLayout: React.FC<{ printType: 'qr' | 'receipt' }> = ({ printType }) => {
    const { sessionId, orderId } = useParams();
    const context = useAppContext();
    const { getQrSession, orders, settings, getLocalized, tables, menuItems, menuCategories } = context;

    useEffect(() => {
        setTimeout(() => {
            window.print();
            window.onafterprint = () => window.close();
        }, 500); // Delay to ensure content is rendered
    }, []);


    const renderContent = () => {
        if (printType === 'qr' && sessionId) {
            const session = getQrSession(sessionId);
            const table = session?.tableId ? tables.find(t => t.id === session.tableId) : null;
            if (!session) return <div>Invalid Session ID</div>;
            
            const qrUrl = getAbsoluteUrlWithState(`/#/menu/${session.id}?`, menuItems, menuCategories, settings);

            return (
                <div className="text-center">
                    <h1 className="text-lg font-bold">QR Restaurant POS</h1>
                    <p className="text-xs">--------------------------------</p>
                    <p className="text-sm font-semibold">Welcome!</p>
                    <p className="text-sm">Please scan to order</p>
                    {table && <p className="text-2xl font-bold my-2">Table: {table.name}</p>}
                    <div className="my-2 inline-block bg-white p-2 border">
                        <QRCode value={qrUrl} size={150} />
                    </div>
                    <p className="text-xs font-mono break-all">{session.id}</p>
                    <p className="text-xs mt-2">{new Date(session.createdAt).toLocaleString()}</p>
                </div>
            );
        }

        if (printType === 'receipt' && orderId) {
            const order = orders.find(o => o.id === orderId);
            if (!order) return <div>Order not found</div>;

            return (
                <div>
                    <div className="text-center mb-2">
                        <h1 className="text-lg font-bold">RECEIPT</h1>
                        <p className="text-xs">QR Restaurant POS</p>
                        <p className="text-xs">Date: {new Date(order.paidAt || order.createdAt).toLocaleString()}</p>
                    </div>
                    <p className="text-xs">--------------------------------</p>
                    <div className="text-center font-bold">
                        <p>Queue #{order.queueNumber}</p>
                    </div>
                    <p className="text-xs">--------------------------------</p>
                    <table className="w-full text-xs">
                        <thead>
                            <tr>
                                <th className="text-left">QTY</th>
                                <th className="text-left">ITEM</th>
                                <th className="text-right">PRICE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map(item => (
                                <React.Fragment key={item.id}>
                                    <tr>
                                        <td>{item.quantity}</td>
                                        <td>{getLocalized(item.menuItem.name)}</td>
                                        <td className="text-right">{item.menuItem.price.toFixed(2)}</td>
                                    </tr>
                                    {Object.values(item.selectedOptions).flat().map(opt => (
                                        <tr key={getLocalized(opt.name)}>
                                            <td></td>
                                            <td className='pl-2'>+ {getLocalized(opt.name)}</td>
                                            <td className="text-right">{opt.price > 0 ? opt.price.toFixed(2) : ''}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-xs">--------------------------------</p>
                    <table className="w-full text-xs">
                        <tbody>
                            <tr><td>Subtotal:</td><td className="text-right">{order.subtotal.toFixed(2)}</td></tr>
                            <tr><td>VAT ({(settings.vatRate * 100).toFixed(0)}%):</td><td className="text-right">{order.vat.toFixed(2)}</td></tr>
                            <tr><td>Service Charge:</td><td className="text-right">{order.serviceCharge.toFixed(2)}</td></tr>
                            <tr className="font-bold"><td>TOTAL:</td><td className="text-right">{order.total.toFixed(2)}</td></tr>
                        </tbody>
                    </table>
                    <p className="text-xs">--------------------------------</p>
                    <div className="text-center mt-2">
                        <p className="font-bold">Thank You!</p>
                    </div>
                </div>
            )
        }
        return <div>Nothing to print.</div>;
    };

    return (
        <div className="bg-white text-black font-mono" style={{ width: '280px', padding: '10px' }}>
            {renderContent()}
        </div>
    );
};

export default PrintLayout;