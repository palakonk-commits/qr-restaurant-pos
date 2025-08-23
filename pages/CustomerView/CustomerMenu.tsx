import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { MenuItem, MenuCategory, ServiceType, CartItem, MenuOption, MenuOptionItem } from '../../types';
import Button from '../../components/common/Button';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Modal from '../../components/common/Modal';

// --- Item Selection Modal ---
interface ItemSelectionModalProps {
    item: MenuItem;
    onAddToCart: (cartItem: CartItem) => void;
    onClose: () => void;
}
const ItemSelectionModal: React.FC<ItemSelectionModalProps> = ({ item, onAddToCart, onClose }) => {
    const { t, getLocalized } = useAppContext();
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<{ [optionTitle: string]: MenuOptionItem[] }>({});
    const [notes, setNotes] = useState('');

    // Pre-select first option for required options
    useEffect(() => {
        const initialSelections: { [optionTitle: string]: MenuOptionItem[] } = {};
        item.options?.forEach(option => {
            if (option.required && option.items.length > 0) {
                initialSelections[getLocalized(option.title)] = [option.items[0]];
            }
        });
        setSelectedOptions(initialSelections);
    }, [item, getLocalized]);

    const handleOptionChange = (option: MenuOption, optionItem: MenuOptionItem) => {
        const title = getLocalized(option.title);
        setSelectedOptions(prev => {
            if (option.required) {
                return { ...prev, [title]: [optionItem] };
            }
            
            // Handle checkboxes for non-required options
            const currentSelection = prev[title] || [];
            const isSelected = currentSelection.some(i => getLocalized(i.name) === getLocalized(optionItem.name));

            if (isSelected) {
                return { ...prev, [title]: currentSelection.filter(i => getLocalized(i.name) !== getLocalized(optionItem.name)) };
            } else {
                return { ...prev, [title]: [...currentSelection, optionItem] };
            }
        });
    };
    
    const calculateTotalPrice = () => {
        const basePrice = item.price;
        const optionsPrice = Object.values(selectedOptions).flat().reduce((acc, opt) => acc + opt.price, 0);
        return (basePrice + optionsPrice) * quantity;
    };

    const handleAddToCart = () => {
        const isAllRequiredSelected = item.options?.every(opt => {
            if (!opt.required) return true;
            const selection = selectedOptions[getLocalized(opt.title)];
            return selection && selection.length > 0;
        }) ?? true;

        if (!isAllRequiredSelected) {
            alert('Please select all required options.');
            return;
        }

        const cartItem: CartItem = {
            menuItem: item,
            quantity,
            selectedOptions,
            notes,
            totalPrice: calculateTotalPrice()
        };
        onAddToCart(cartItem);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={getLocalized(item.name)}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {item.options?.map(option => (
                    <div key={getLocalized(option.title)}>
                        <h4 className="font-semibold text-lg">{getLocalized(option.title)} <span className="text-sm text-slate-500">{option.required ? `(${t('required')})` : `(${t('optional')})`}</span></h4>
                        <div className="space-y-2 mt-1">
                            {option.items.map(optItem => (
                                <label key={getLocalized(optItem.name)} className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700 cursor-pointer has-[:checked]:bg-sky-100 has-[:checked]:dark:bg-sky-900/50 has-[:checked]:ring-2 has-[:checked]:ring-sky-500 transition-all">
                                    <div className="flex items-center">
                                        <input
                                            type={option.required ? "radio" : "checkbox"}
                                            name={getLocalized(option.title)}
                                            checked={selectedOptions[getLocalized(option.title)]?.some(i => getLocalized(i.name) === getLocalized(optItem.name))}
                                            onChange={() => handleOptionChange(option, optItem)}
                                            className={option.required ? "form-radio h-5 w-5 text-sky-600 bg-white dark:bg-slate-600 border-slate-300 focus:ring-sky-500" : "form-checkbox h-5 w-5 text-sky-600 bg-white dark:bg-slate-600 border-slate-300 rounded focus:ring-sky-500"}
                                        />
                                        <span className="ml-3 text-slate-800 dark:text-slate-200">{getLocalized(optItem.name)}</span>
                                    </div>
                                    {optItem.price > 0 && <span className="text-slate-600 dark:text-slate-400">+ {optItem.price.toFixed(2)}</span>}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <div>
                    <label htmlFor="notes" className="font-semibold text-lg">{t('specialInstructions')}</label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-sky-500 focus:border-sky-500"></textarea>
                </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 font-bold text-xl hover:bg-slate-300 transition-colors">-</button>
                    <span className="text-xl font-bold w-10 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 font-bold text-xl hover:bg-slate-300 transition-colors">+</button>
                </div>
                <Button onClick={handleAddToCart} className="text-lg">
                    {t('addToCart')} - {calculateTotalPrice().toFixed(2)}
                </Button>
            </div>
        </Modal>
    );
};

// --- Menu Item Card ---
const MenuItemCard: React.FC<{ item: MenuItem; onSelect: (item: MenuItem) => void }> = ({ item, onSelect }) => {
    const { getLocalized, settings } = useAppContext();
    const isDisabled = item.isOutOfStock;

    return (
        <div 
            onClick={() => !isDisabled && onSelect(item)} 
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden relative transition-all duration-200 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl hover:scale-[1.02]'}`}
        >
            {isDisabled && <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-xl font-bold z-10">{getLocalized({ en: 'Out of Stock', th: 'ของหมด'})}</div>}
            <img src={`https://picsum.photos/seed/${item.id}/400/200`} alt={getLocalized(item.name)} className="w-full h-32 object-cover" />
            <div className="p-4">
                <h3 className="font-bold text-lg">{getLocalized(item.name)}</h3>
                <p className="text-sky-600 dark:text-sky-400 font-semibold mt-1">{item.price.toFixed(2)} {getLocalized(settings.currency)}</p>
            </div>
        </div>
    );
};

// --- Cart View ---
const CartView: React.FC<{ 
    cart: CartItem[], 
    serviceType: ServiceType, 
    onConfirm: () => void,
    onRemoveItem: (index: number) => void,
}> = ({ cart, serviceType, onConfirm, onRemoveItem }) => {
    const { t, getLocalized, settings } = useAppContext();
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const vat = subtotal * settings.vatRate;
    const serviceCharge = subtotal * settings.serviceChargeRate;
    const total = subtotal + vat + serviceCharge;

    if (cart.length === 0) {
        return <div className="p-4 text-center text-slate-500">{t('cartIsEmpty')}</div>;
    }

    return (
        <div className="p-4 space-y-3">
            {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-start border-b pb-2 border-slate-200 dark:border-slate-700">
                    <div>
                        <p className="font-semibold">{item.quantity} x {getLocalized(item.menuItem.name)}</p>
                        <div className="pl-4 text-sm text-slate-500 dark:text-slate-400">
                            {Object.values(item.selectedOptions).flat().map(opt => <p key={getLocalized(opt.name)}>+ {getLocalized(opt.name)}</p>)}
                            {item.notes && <p className='italic'>"{item.notes}"</p>}
                        </div>
                    </div>
                     <div className='text-right'>
                        <p className="font-semibold">{item.totalPrice.toFixed(2)}</p>
                        <button onClick={() => onRemoveItem(index)} className="text-rose-500 text-xs hover:underline">Remove</button>
                    </div>
                </div>
            ))}
            <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-600 space-y-1">
                <div className="flex justify-between"><span>{t('subtotal')}:</span><span>{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>{t('vat')}:</span><span>{vat.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>{t('serviceCharge')}:</span><span>{serviceCharge.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-xl pt-2"><span>{t('grandTotal')}:</span><span>{total.toFixed(2)}</span></div>
            </div>
            <div className="mt-4 p-3 bg-sky-100 dark:bg-sky-900/50 border-l-4 border-sky-500 text-sky-800 dark:text-sky-200 text-center font-semibold">
                {t('payAtCounterMessage')}
            </div>
            <Button onClick={onConfirm} className="w-full mt-4 text-lg py-3">{t('confirmOrder')}</Button>
        </div>
    );
};

// --- Main Component ---
const CustomerMenu: React.FC = () => {
    const { qrId } = useParams();
    const navigate = useNavigate();
    const { menuItems, menuCategories, createOrderFromCart, t, getLocalized } = useAppContext();
    const [isValidSession, setIsValidSession] = useState<boolean>(true);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DineIn);

    // The session is now validated only when the order is confirmed.
    // This prevents the premature "Invalid QR" error and allows customers to view the menu.

    const categorizedMenu = useMemo(() => {
        return menuCategories.map(category => ({
            ...category,
            items: menuItems.filter(item => item.category === category.id)
        })).filter(cat => cat.items.length > 0);
    }, [menuItems, menuCategories]);

    const handleAddToCart = (cartItem: CartItem) => {
        setCart(prev => [...prev, cartItem]);
        setSelectedItem(null);
    };
    
    const handleRemoveFromCart = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirmOrder = () => {
        if (cart.length === 0) return;
        if (!qrId) {
            alert('Error: Missing QR session ID.');
            setIsValidSession(false);
            return;
        }
        const order = createOrderFromCart(qrId, cart, serviceType);
        if (order) {
            navigate(`/order/${order.id}`);
        } else {
            alert('Failed to create order. Session might be invalid or expired.');
            setIsValidSession(false);
        }
    };
    
    if (!isValidSession) return <div className="text-center p-10 text-rose-500">Error: Invalid or expired QR code. Please ask staff for a new one.</div>;

    return (
        <div className="flex flex-col md:flex-row h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
             <header className="md:hidden p-4 bg-white dark:bg-slate-800 shadow-md flex justify-between items-center">
                 <h1 className="text-xl font-bold text-sky-600 dark:text-sky-400">{t('menu')}</h1>
                 <LanguageSwitcher />
             </header>

            {/* Menu Section */}
            <div className="w-full md:w-2/3 overflow-y-auto p-4 md:p-6">
                <div className="hidden md:flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">{t('welcome')}</h1>
                    <LanguageSwitcher />
                </div>
                
                 <div className='mb-6'>
                    <h3 className="font-semibold mb-2">{t('serviceType')}</h3>
                    <div className="flex space-x-2 rounded-xl bg-slate-200 dark:bg-slate-700 p-1">
                        {[ServiceType.DineIn, ServiceType.TakeAway, ServiceType.PickUp].map(type => (
                            <button key={type} onClick={() => setServiceType(type)} className={`flex-1 py-2 font-semibold text-center rounded-lg transition-all ${serviceType === type ? 'bg-white dark:bg-slate-800 shadow text-sky-600' : 'hover:bg-white/50 dark:hover:bg-slate-600/50 text-slate-600 dark:text-slate-300'}`}>{t(type)}</button>
                        ))}
                    </div>
                </div>

                {categorizedMenu.map(category => (
                    <div key={category.id} className="mb-8">
                        <h2 className="text-2xl font-bold border-b-2 border-sky-500 pb-2 mb-4">{getLocalized(category.name)}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {category.items.map(item => (
                                <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Cart Section */}
            <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 shadow-lg flex flex-col h-1/2 md:h-full">
                 <h2 className="text-2xl font-bold p-4 border-b dark:border-slate-700">{t('yourCart')}</h2>
                 <div className="flex-grow overflow-y-auto">
                    <CartView cart={cart} serviceType={serviceType} onConfirm={handleConfirmOrder} onRemoveItem={handleRemoveFromCart} />
                 </div>
            </div>

            {selectedItem && (
                <ItemSelectionModal item={selectedItem} onAddToCart={handleAddToCart} onClose={() => setSelectedItem(null)} />
            )}
        </div>
    );
};

export default CustomerMenu;