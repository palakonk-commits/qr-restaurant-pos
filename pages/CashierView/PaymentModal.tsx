
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
                
                <div className="pt-4 border-t dark:border-gray-600">
                    <h4 className="font-semibold mb-2">{t('paymentMethod')}</h4>
                    <div className="flex space-x-2">
                        {paymentMethods.map(({ method, label }) => (
                            <button
                                key={method}
                                onClick={() => setSelectedMethod(method)}
                                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                                    selectedMethod === method 
                                        ? 'bg-blue-500 border-blue-500 text-white' 
                                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
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
