
import React, { useState } from 'react';
import { Order, PaymentMethod } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import OrderDetails from './OrderDetails';

interface PaymentModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, isOpen, onClose }) => {
    const { markOrderAsPaid, t } = useAppContext();
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

    const handlePayment = () => {
        if (selectedMethod) {
            markOrderAsPaid(order.id, selectedMethod);
            alert(t('orderPaidSuccess'));
            onClose();
        }
    };

    const paymentMethods: { method: PaymentMethod; label: string }[] = [
        { method: PaymentMethod.Cash, label: t('cash') },
        { method: PaymentMethod.Card, label: t('card') },
        { method: PaymentMethod.Transfer, label: t('transfer') },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('payment')} for Order #${order.queueNumber}`}>
            <div className="space-y-4">
                <OrderDetails order={order} />
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                    <h4 className="font-semibold mb-2">{t('paymentMethod')}</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {paymentMethods.map(({ method, label }) => (
                            <button
                                key={method}
                                onClick={() => setSelectedMethod(method)}
                                className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                                    selectedMethod === method 
                                        ? 'bg-sky-600 border-sky-600 text-white scale-105 shadow-lg' 
                                        : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 hover:border-slate-400'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
             <div className="mt-6 flex justify-end space-x-2">
                <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                <Button onClick={handlePayment} disabled={!selectedMethod}>{t('markAsPaid')}</Button>
            </div>
        </Modal>
    );
};

export default PaymentModal;