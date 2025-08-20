
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
    const [selectedOptions, setSelectedOptions] = useState<{ [optionTitle: string]: MenuOptionItem }>({});
    const [notes, setNotes] = useState('');

    const handleOptionChange = (option: MenuOption, optionItem: MenuOptionItem) => {
        setSelectedOptions(prev => ({
            ...prev,
            [getLocalized(option.title)]: optionItem
        }));
    };
    
    const calculateTotalPrice = () => {
        const basePrice = item.price;
        const optionsPrice = Object.values(selectedOptions).reduce((acc, opt) => acc + opt.price, 0);
        return (basePrice + optionsPrice) * quantity;
    };

    const handleAddToCart = () => {
        const isAllRequiredSelected = item.options?.every(opt => !opt.required || selectedOptions[getLocalized(opt.title)]) ?? true;
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
                        <h4 className="font-semibold text-lg">{getLocalized(option.title)} <span className="text-sm text-gray-500">{option.required ? `(${t('required')})` : `(${t('optional')})`}</span></h4>
                        <div className="space-y-2 mt-1">
                            {option.items.map(optItem => (
                                <label key={getLocalized(optItem.name)} className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-gray-700">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name={getLocalized(option.title)}
                                            checked={selectedOptions[getLocalized(option.title)]?.name.en === optItem.name.en}
                                            onChange={() => handleOptionChange(option, optItem)}
                                            className="form-radio h-5 w-5 text-blue-600"
                                        />
                                        <span className="ml-3 text-gray-800 dark:text-gray-200">{getLocalized(optItem.name)}</span>
                                    </div>
                                    {optItem.price > 0 && <span className="text-gray-600 dark:text-gray-400">+ {optItem.price.toFixed(2)}</span>}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <div>
                    <label htmlFor="notes" className="font-semibold text-lg">{t('specialInstructions')}</label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 font-bold text-lg">-</button>
                    <span className="text-xl font-bold">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 font-bold text-lg">+</button>
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
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden relative ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl transition-shadow'}`}
        >
            {isDisabled && <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-xl font-bold z-10">Out of Stock</div>}
            <img src={`https://picsum.photos/seed/${item.id}/400/200`} alt={getLocalized(item.name)} className="w-full h-32 object-cover" />
            <div className="p-4">
                <h3 className="font-bold text-lg">{getLocalized(item.name)}</h3>
                <p className="text-blue-600 dark:text-blue-400 font-semibold mt-1">{item.price.toFixed(2)} {getLocalized(settings.currency)}</p>
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
        return <div className="p-4 text-center text-gray-500">{t('cartIsEmpty')}</div>;
    }

    return (
        <div className="p-4 space-y-3">
            {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-start border-b pb-2 dark:border-gray-700">
                    <div>
                        <p className="font-semibold">{item.quantity} x {getLocalized(item.menuItem.name)}</p>
                        <div className="pl-4 text-sm text-gray-500 dark:text-gray-400">
                            {Object.values(item.selectedOptions).map(opt => <p key={getLocalized(opt.name)}>+ {getLocalized(opt.name)}</p>)}
                            {item.notes && <p className='italic'>"{item.notes}"</p>}
                        </div>
                    </div>
                     <div className='text-right'>
                        <p className="font-semibold">{item.totalPrice.toFixed(2)}</p>
                        <button onClick={() => onRemoveItem(index)} className="text-red-500 text-xs hover:underline">Remove</button>
                    </div>
                </div>
            ))}
            <div className="mt-4 pt-4 border-t-2 border-dashed dark:border-gray-600 space-y-1">
                <div className="flex justify-between"><span>{t('subtotal')}:</span><span>{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>{t('vat')}:</span><span>{vat.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>{t('serviceCharge')}:</span><span>{serviceCharge.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-xl pt-2"><span>{t('grandTotal')}:</span><span>{total.toFixed(2)}</span></div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 text-center font-semibold">
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
    const { menuItems, menuCategories, getQrSession, createOrderFromCart, t, getLocalized } = useAppContext();
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.DineIn);

    useEffect(() => {
        const session = getQrSession(qrId!);
        if (session && session.status === 'active') {
            setIsValidSession(true);
        } else {
            setIsValidSession(false);
        }
    }, [qrId, getQrSession]);

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
        const order = createOrderFromCart(qrId!, cart, serviceType);
        if (order) {
            navigate(`/order/${order.id}`);
        } else {
            alert('Failed to create order. Session might be invalid.');
            setIsValidSession(false);
        }
    };
    
    if (isValidSession === null) return <div className="text-center p-10">{t('loading')}</div>;
    if (!isValidSession) return <div className="text-center p-10 text-red-500">Error: Invalid or expired QR code.</div>;

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
             <header className="md:hidden p-4 bg-white dark:bg-gray-800 shadow-md flex justify-between items-center">
                 <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">{t('menu')}</h1>
                 <LanguageSwitcher />
             </header>

            {/* Menu Section */}
            <div className="w-full md:w-2/3 overflow-y-auto p-4">
                <div className="hidden md:flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold">{t('welcome')}</h1>
                    <LanguageSwitcher />
                </div>
                
                 <div className='mb-4'>
                    <h3 className="font-semibold mb-2">{t('serviceType')}</h3>
                    <div className="flex space-x-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                        {[ServiceType.DineIn, ServiceType.TakeAway, ServiceType.PickUp].map(type => (
                            <button key={type} onClick={() => setServiceType(type)} className={`flex-1 py-2 text-center rounded-md transition-colors ${serviceType === type ? 'bg-white dark:bg-gray-800 shadow' : 'hover:bg-gray-300 dark:hover:bg-gray-600'}`}>{t(type)}</button>
                        ))}
                    </div>
                </div>

                {categorizedMenu.map(category => (
                    <div key={category.id} className="mb-8">
                        <h2 className="text-2xl font-bold border-b-2 border-blue-500 pb-2 mb-4">{getLocalized(category.name)}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.items.map(item => (
                                <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Cart Section */}
            <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 shadow-lg flex flex-col h-1/2 md:h-full">
                 <h2 className="text-2xl font-bold p-4 border-b dark:border-gray-700">{t('yourCart')}</h2>
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
