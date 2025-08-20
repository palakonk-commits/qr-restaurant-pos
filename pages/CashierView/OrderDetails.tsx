
import React from 'react';
import { Order } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface OrderDetailsProps {
  order: Order;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  const { getLocalized, t, settings } = useAppContext();

  return (
    <div className="text-slate-800 dark:text-slate-200">
      <div className="space-y-2">
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between items-start py-2 border-b border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold">{item.quantity} x {getLocalized(item.menuItem.name)}</p>
              <div className="pl-4 text-sm text-slate-500 dark:text-slate-400">
                {Object.entries(item.selectedOptions).map(([key, value]) => (
                    <p key={key}>+ {getLocalized(value.name)}</p>
                ))}
                {item.notes && <p className="italic">Notes: {item.notes}</p>}
              </div>
            </div>
            <p className="font-semibold">{(item.totalPrice).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-600 space-y-1 text-right">
        <div className="flex justify-between"><span>{t('subtotal')}:</span><span>{order.subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{t('vat')} ({(settings.vatRate * 100).toFixed(0)}%):</span><span>{order.vat.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>{t('serviceCharge')} ({(settings.serviceChargeRate * 100).toFixed(0)}%):</span><span>{order.serviceCharge.toFixed(2)}</span></div>
        {order.discount > 0 && <div className="flex justify-between text-green-600"><span>{t('discount')}:</span><span>-{order.discount.toFixed(2)}</span></div>}
        <div className="flex justify-between font-bold text-xl pt-2"><span>{t('grandTotal')}:</span><span>{order.total.toFixed(2)} {getLocalized(settings.currency)}</span></div>
      </div>
    </div>
  );
};

export default OrderDetails;