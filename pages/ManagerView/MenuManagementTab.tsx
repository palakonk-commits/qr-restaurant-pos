import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MenuItem, MenuCategory } from '../../types';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';

// Simplified Modal Form for Add/Edit
const MenuItemForm: React.FC<{ item?: MenuItem; onSave: (item: any) => void; onClose: () => void; }> = ({ item, onSave, onClose }) => {
    const { t, menuCategories, getLocalized } = useAppContext();
    const [nameEn, setNameEn] = useState(item?.name.en || '');
    const [nameTh, setNameTh] = useState(item?.name.th || '');
    const [price, setPrice] = useState(item?.price || 0);
    const [category, setCategory] = useState(item?.category || menuCategories[0]?.id || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const savedItem = {
            ...item,
            name: { en: nameEn, th: nameTh },
            price: Number(price),
            category,
        };
        onSave(savedItem);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('itemName')} (EN)</label>
                    <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('itemName')} (TH)</label>
                    <input type="text" value={nameTh} onChange={e => setNameTh(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('price')}</label>
                    <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('category')}</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
                        {menuCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{getLocalized(cat.name)}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                <Button type="submit">{t('save')}</Button>
            </div>
        </form>
    );
};


const MenuManagementTab: React.FC = () => {
    const { menuItems, menuCategories, getLocalized, t, addMenuItem, updateMenuItem, deleteMenuItem } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
    const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

    const handleOpenModal = (item?: MenuItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(undefined);
    };

    const handleSave = (itemData: any) => {
        if (itemData.id) {
            updateMenuItem(itemData);
        } else {
            addMenuItem({ ...itemData, isOutOfStock: false });
        }
        handleCloseModal();
    };
    
    const handleDeleteRequest = (item: MenuItem) => {
        setItemToDelete(item);
    }
    
    const confirmDelete = () => {
        if (itemToDelete) {
            deleteMenuItem(itemToDelete.id);
            setItemToDelete(null);
        }
    }
    
    const handleStockToggle = (item: MenuItem) => {
        updateMenuItem({ ...item, isOutOfStock: !item.isOutOfStock });
    }

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('menuManagement')}</h2>
                <Button onClick={() => handleOpenModal()}>{t('addItem')}</Button>
            </div>

            <div className="space-y-4">
                {menuCategories.map(category => (
                    <div key={category.id}>
                        <h3 className="text-lg font-semibold border-b pb-1 mb-2 dark:border-gray-600">{getLocalized(category.name)}</h3>
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {menuItems.filter(item => item.category === category.id).map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{getLocalized(item.name)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{item.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                             <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" checked={item.isOutOfStock} onChange={() => handleStockToggle(item)} />
                                                    <div className={`block w-14 h-8 rounded-full ${item.isOutOfStock ? 'bg-gray-600' : 'bg-green-500'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${item.isOutOfStock ? 'transform translate-x-6' : ''}`}></div>
                                                </div>
                                                <div className="ml-3 text-gray-700 dark:text-gray-300 font-medium">{item.isOutOfStock ? t('outOfStock') : 'In Stock'}</div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <Button variant="secondary" onClick={() => handleOpenModal(item)}>{t('edit')}</Button>
                                            <Button variant="danger" onClick={() => handleDeleteRequest(item)}>{t('delete')}</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingItem ? t('edit') : t('addItem')}>
                    <MenuItemForm item={editingItem} onSave={handleSave} onClose={handleCloseModal} />
                </Modal>
            )}

            {itemToDelete && (
                <ConfirmationModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDelete}
                    title={t('confirmDeleteItemTitle')}
                >
                    <p>{t('confirmDeleteItemMessage')}</p>
                </ConfirmationModal>
            )}
        </div>
    );
};

export default MenuManagementTab;