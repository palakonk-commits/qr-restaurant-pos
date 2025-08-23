
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, UserRole, MenuItem, MenuCategory, Order, OrderStatus, QrSession, AuditLog, Settings, ServiceType, CartItem, PaymentMethod, Table, TableStatus, AppState, MenuOption } from '../types';
import { useLocalization } from '../hooks/useLocalization';
import { decodeQrState } from '../utils/qr';


// --- MOCK/INITIAL DATA ---
const MOCK_USERS: User[] = [
  { id: 'user-1', name: 'Anna', role: UserRole.Cashier, pin: '1111' },
  { id: 'user-2', name: 'Bob', role: UserRole.Kitchen, pin: '2222' },
  { id: 'user-3', name: 'Carla', role: UserRole.Manager, pin: '3333' },
  { id: 'user-4', name: 'David', role: UserRole.Auditor, pin: '4444' },
];

const MOCK_CATEGORIES: MenuCategory[] = [
    { id: 'cat-1', name: { en: 'Main Courses', th: 'อาหารจานหลัก' } },
    { id: 'cat-2', name: { en: 'Appetizers', th: 'ของทานเล่น' } },
    { id: 'cat-3', name: { en: 'Drinks', th: 'เครื่องดื่ม' } },
];

const MOCK_MENU: MenuItem[] = [
  { id: 'menu-1', name: { en: 'Pad Thai', th: 'ผัดไทย' }, category: 'cat-1', price: 120, isOutOfStock: false, isSpicy: true, options: [
    { title: { en: 'Protein', th: 'เนื้อสัตว์' }, required: true, items: [
      { name: { en: 'Shrimp', th: 'กุ้ง' }, price: 20 },
      { name: { en: 'Chicken', th: 'ไก่' }, price: 0 },
      { name: { en: 'Tofu', th: 'เต้าหู้' }, price: 0 },
    ]},
    { title: { en: 'Extra', th: 'พิเศษ' }, required: false, items: [
        { name: { en: 'Extra Egg', th: 'เพิ่มไข่' }, price: 10 },
        { name: { en: 'Extra Peanuts', th: 'เพิ่มถั่ว' }, price: 5 },
    ]}
  ]},
  { id: 'menu-2', name: { en: 'Green Curry', th: 'แกงเขียวหวาน' }, category: 'cat-1', price: 150, isOutOfStock: false, isSpicy: true },
  { id: 'menu-3', name: { en: 'Spring Rolls', th: 'ปอเปี๊ยะทอด' }, category: 'cat-2', price: 80, isOutOfStock: false },
  { id: 'menu-4', name: { en: 'Thai Iced Tea', th: 'ชาไทย' }, category: 'cat-3', price: 50, isOutOfStock: true },
  { id: 'menu-5', name: { en: 'Mango Sticky Rice', th: 'ข้าวเหนียวมะม่วง' }, category: 'cat-1', price: 100, isOutOfStock: false, isVegan: true },
];

const MOCK_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
    id: `table-${i + 1}`,
    name: `T${i + 1}`,
    status: TableStatus.Available,
}));

const getInitialState = (): AppState => {
    // 1. Check for state in URL (for customer QR scans)
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const stateFromUrl = urlParams.get('state');

    const defaultStateForCustomer: AppState = {
        currentUser: null,
        users: [], // Customer doesn't need user list
        menuItems: [],
        menuCategories: [],
        orders: [],
        qrSessions: [],
        auditLogs: [],
        tables: [], // Customer doesn't need table list
        settings: {
            vatRate: 0.07,
            serviceChargeRate: 0.10,
            qrCodeExpiryMinutes: 15,
            currency: { en: 'THB', th: 'บาท' },
        },
        lastQueueNumber: 0,
    };

    if (stateFromUrl) {
        const decoded = decodeQrState(stateFromUrl);
        if (decoded) {
            console.log("Minimal state successfully loaded from URL for customer view.");
            // Build a valid AppState for the customer using minimal decoded data
            // We cast the leaner types to the full types. This is safe because the customer
            // view only accesses the properties present in the leaner types.
            return { 
                ...defaultStateForCustomer,
                menuItems: decoded.menuItems as MenuItem[],
                menuCategories: decoded.menuCategories,
                settings: { ...defaultStateForCustomer.settings, ...decoded.settings },
            };
        }
    }
    
    // Fallback to default state for main app
     const defaultState: AppState = {
        currentUser: null,
        users: MOCK_USERS,
        menuItems: MOCK_MENU,
        menuCategories: MOCK_CATEGORIES,
        orders: [],
        qrSessions: [],
        auditLogs: [],
        tables: MOCK_TABLES,
        settings: {
            vatRate: 0.07,
            serviceChargeRate: 0.10,
            qrCodeExpiryMinutes: 15,
            currency: { en: 'THB', th: 'บาท' },
        },
        lastQueueNumber: 0,
    };
    try {
        const savedState = localStorage.getItem('pos_app_state');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            // Dates are stored as strings, need to convert them back
            parsed.orders = parsed.orders.map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt), paidAt: o.paidAt ? new Date(o.paidAt) : undefined }));
            parsed.qrSessions = parsed.qrSessions.map((s: QrSession) => ({ ...s, createdAt: new Date(s.createdAt) }));
            parsed.auditLogs = parsed.auditLogs.map((l: AuditLog) => ({...l, timestamp: new Date(l.timestamp) }));
            return { ...defaultState, ...parsed, currentUser: null }; // Always start logged out
        }
        return defaultState;
    } catch (error) {
        console.error("Could not load state from localStorage", error);
        return defaultState;
    }
};

// --- CONTEXT DEFINITION ---
interface AppContextType extends AppState {
    language: 'en' | 'th';
    setLanguage: (lang: 'en' | 'th') => void;
    t: (key: string) => string;
    getLocalized: (obj: { en: string; th: string } | undefined) => string;
    login: (userId: string, pin: string) => boolean;
    logout: () => void;
    createQrSession: (tableId: string) => QrSession;
    getQrSession: (id: string) => QrSession | undefined;
    cancelQrSession: (sessionId: string) => void;
    createOrderFromCart: (qrId: string, cart: CartItem[], serviceType: ServiceType) => { id: string } | null;
    markOrderAsPaid: (orderId: string, paymentMethod: PaymentMethod) => void;
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    cancelOrder: (orderId: string, reason: string) => void;
    addTable: () => void;
    removeTable: (tableId: string) => void;
    forceClearTable: (tableId: string) => void;
    addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
    updateMenuItem: (item: MenuItem) => void;
    deleteMenuItem: (itemId: string) => void;
    updateSettings: (newSettings: Partial<Settings>) => void;
    clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(getInitialState);
    const { language, setLanguage, t, getLocalized } = useLocalization();
    
    // Check if the current instance is a customer view from a shared state URL.
    // If so, don't persist to localStorage to avoid overwriting the cashier's state.
    const isSharedState = new URLSearchParams(window.location.hash.split('?')[1]).has('state');


    // Persist state to localStorage on every change, UNLESS it's a customer view.
    useEffect(() => {
        if (isSharedState) return;
        try {
            const stateToSave = { ...state, currentUser: null }; // Don't persist logged-in user
            localStorage.setItem('pos_app_state', JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Could not save state to localStorage", error);
        }
    }, [state, isSharedState]);
    
    const calculateTotals = useCallback((cart: CartItem[], settings: Settings) => {
        const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
        const vat = subtotal * settings.vatRate;
        const serviceCharge = subtotal * settings.serviceChargeRate;
        const total = subtotal + vat + serviceCharge;
        return { subtotal, vat, serviceCharge, total };
    }, []);

    const addAuditLog = useCallback((action: string, details: string, user: User) => {
        const newLog: AuditLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            userId: user.id,
            userName: user.name,
            action,
            details,
        };
        setState(prevState => ({ ...prevState, auditLogs: [newLog, ...prevState.auditLogs]}));
    }, []);

    const processOrderRequests = useCallback(() => {
        const requestsRaw = localStorage.getItem('pos_order_requests');
        if (!requestsRaw) return;
        
        const requests = JSON.parse(requestsRaw);
        if (!Array.isArray(requests) || requests.length === 0) return;

        setState(prevState => {
            if (!prevState.currentUser) return prevState;

            let newState = { ...prevState };
            let updated = false;

            requests.forEach((req: any) => {
                if (!req.qrId || !req.orderId || !req.cart || newState.orders.some(o => o.id === req.orderId)) return;

                const session = newState.qrSessions.find(s => s.id === req.qrId);
                if (!session || session.status !== 'active') {
                    console.warn(`Order request for invalid/used session ${req.qrId} ignored.`);
                    return;
                }
                
                // Re-hydrate cart items with full menu item data from the main state
                // This prevents data pollution from the lean menu items sent by the customer
                const validatedCartItems: CartItem[] = req.cart.map((cartItem: any) => {
                    const fullMenuItem = newState.menuItems.find(m => m.id === cartItem.menuItem.id);
                    if (!fullMenuItem) {
                        console.warn(`Invalid menu item ID ${cartItem.menuItem.id} in order request.`);
                        return null; // Item might have been deleted since QR was generated
                    }
                    return {
                        ...cartItem,
                        menuItem: fullMenuItem, // Replace lean item with full item
                    };
                }).filter((item: CartItem | null): item is CartItem => item !== null);

                if (validatedCartItems.length === 0 && req.cart.length > 0) {
                     console.warn(`Order request ${req.orderId} ignored as it contained no valid items.`);
                     return;
                }

                const newQueueNumber = newState.lastQueueNumber + 1;
                const { subtotal, vat, serviceCharge, total } = calculateTotals(validatedCartItems, newState.settings);
                const newOrder: Order = {
                    id: req.orderId,
                    qrSessionId: req.qrId,
                    queueNumber: newQueueNumber,
                    items: validatedCartItems.map((item: CartItem) => ({...item, id: `item-${Math.random()}`})),
                    serviceType: req.serviceType,
                    status: OrderStatus.Unpaid,
                    subtotal, vat, serviceCharge, discount: 0, total,
                    createdAt: new Date(req.requestedAt),
                    createdBy: 'Customer',
                };
                
                newState.lastQueueNumber = newQueueNumber;
                newState.orders = [...newState.orders, newOrder];
                newState.qrSessions = newState.qrSessions.map(s => s.id === req.qrId ? { ...s, status: 'used', orderId: newOrder.id } : s);
                if (session.tableId) {
                    newState.tables = newState.tables.map(t => t.id === session.tableId ? { ...t, status: TableStatus.Occupied } : t);
                }
                
                addAuditLog('Order', `New order #${newQueueNumber} created by customer.`, prevState.currentUser);
                updated = true;
            });

            if (updated) {
                localStorage.removeItem('pos_order_requests');
                return newState;
            }

            return prevState;
        });
    }, [addAuditLog, calculateTotals]);

    // Listen for changes in localStorage from other tabs
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'pos_app_state' && event.newValue) {
                try {
                    const parsed = JSON.parse(event.newValue);
                    parsed.orders = parsed.orders.map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt), paidAt: o.paidAt ? new Date(o.paidAt) : undefined }));
                    parsed.qrSessions = parsed.qrSessions.map((s: QrSession) => ({ ...s, createdAt: new Date(s.createdAt) }));
                    parsed.auditLogs = parsed.auditLogs.map((l: AuditLog) => ({...l, timestamp: new Date(l.timestamp) }));
                    setState(prevState => ({...parsed, currentUser: prevState.currentUser }));
                } catch (e) {
                    console.error("Failed to parse state from storage event", e);
                }
            }
            if (event.key === 'pos_order_requests' && !isSharedState) {
                processOrderRequests();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        if (!isSharedState) {
          processOrderRequests();
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [isSharedState, processOrderRequests]);

    // Robust Polling for customer devices to ensure state synchronization
    useEffect(() => {
        if (!isSharedState) return;

        const POLLING_INTERVAL = 2500;
        let lastKnownState = '';

        const poller = setInterval(() => {
            try {
                const savedStateRaw = localStorage.getItem('pos_app_state');

                if (savedStateRaw && savedStateRaw !== lastKnownState) {
                    lastKnownState = savedStateRaw;
                    
                    const parsed = JSON.parse(savedStateRaw);
                    const parsedOrders = parsed.orders.map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt), paidAt: o.paidAt ? new Date(o.paidAt) : undefined }));

                    setState(prevState => {
                        // Only update if the orders array has actually changed
                        if (JSON.stringify(prevState.orders) !== JSON.stringify(parsedOrders)) {
                            return { ...prevState, orders: parsedOrders };
                        }
                        return prevState;
                    });
                }
            } catch (e) {
                console.error("Polling error in AppContext:", e);
            }
        }, POLLING_INTERVAL);

        return () => clearInterval(poller);
    }, [isSharedState]);


    const login = (userId: string, pin: string): boolean => {
        const user = state.users.find(u => u.id === userId && u.pin === pin);
        if (user) {
            setState(prevState => ({ ...prevState, currentUser: user }));
            addAuditLog('Login', `User ${user.name} logged in.`, user);
            return true;
        }
        return false;
    };
    
    const logout = () => {
        if (state.currentUser) {
            addAuditLog('Logout', `User ${state.currentUser.name} logged out.`, state.currentUser);
            setState(prevState => ({ ...prevState, currentUser: null }));
        }
    };

    const createQrSession = useCallback((tableId: string): QrSession => {
        const newSession: QrSession = {
            id: `qr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            createdAt: new Date(),
            status: 'active',
            tableId: tableId,
        };
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const table = prevState.tables.find(t => t.id === tableId);
            if (!table) return prevState;

            addAuditLog('QR Generation', `Generated new QR for table ${table.name}: ${newSession.id}`, prevState.currentUser);
            
            return {
                ...prevState,
                qrSessions: [...prevState.qrSessions, newSession],
                tables: prevState.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Occupied } : t),
            };
        });
        return newSession;
    }, [addAuditLog]);

    const cancelQrSession = useCallback((sessionId: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const session = prevState.qrSessions.find(qs => qs.id === sessionId);
            if (!session || session.status !== 'active') return prevState;

            let newTables = prevState.tables;
            
            if (session.tableId) {
                const table = prevState.tables.find(t => t.id === session.tableId);
                if (table) {
                    newTables = prevState.tables.map(t => t.id === session.tableId ? { ...t, status: TableStatus.Available } : t);
                    addAuditLog('QR Cancellation', `Cancelled QR for table ${table.name}: ${sessionId}`, prevState.currentUser);
                }
            }
            
            return {
                ...prevState,
                qrSessions: prevState.qrSessions.map(qs => qs.id === sessionId ? { ...qs, status: 'expired' as const } : qs),
                tables: newTables,
            };
        });
    }, [addAuditLog]);

    const getQrSession = useCallback((id: string): QrSession | undefined => {
        return state.qrSessions.find(s => s.id === id);
    }, [state.qrSessions]);
    
    const createOrderFromCart = (qrId: string, cart: CartItem[], serviceType: ServiceType): { id: string } | null => {
        try {
            const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const requestPayload = { qrId, cart, serviceType, orderId, requestedAt: new Date() };
    
            const existingRaw = localStorage.getItem('pos_order_requests');
            const existing = existingRaw ? JSON.parse(existingRaw) : [];
            existing.push(requestPayload);
            localStorage.setItem('pos_order_requests', JSON.stringify(existing));
    
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'pos_order_requests',
                newValue: JSON.stringify(existing),
                storageArea: localStorage,
            }));
    
            return { id: orderId };
        } catch (error) {
            console.error("Customer could not submit order request", error);
            return null;
        }
    };

    const markOrderAsPaid = useCallback((orderId: string, paymentMethod: PaymentMethod) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const order = prevState.orders.find(o=>o.id === orderId);
            if (!order) return prevState;

            addAuditLog('Payment', `Order #${order.queueNumber} marked as paid with ${paymentMethod}.`, prevState.currentUser);

            return { 
                ...prevState, 
                orders: prevState.orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.Paid, paidAt: new Date(), paymentMethod } : o),
            }
        });
    }, [addAuditLog]);
    
    const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const order = prevState.orders.find(o => o.id === orderId);
            if (!order) return prevState;

            let newTables = prevState.tables;
            
            addAuditLog('Order Status Update', `Order #${order.queueNumber} status changed to ${status}.`, prevState.currentUser);
            
            if ((status === OrderStatus.Served || status === OrderStatus.Cancelled) && order.qrSessionId) {
                const session = prevState.qrSessions.find(q => q.id === order.qrSessionId);
                if (session?.tableId) {
                    const table = prevState.tables.find(t => t.id === session.tableId);
                    if (table) {
                        newTables = prevState.tables.map(t => t.id === session.tableId ? { ...t, status: TableStatus.Available } : t);
                        addAuditLog('Table Status', `Table ${table.name} is now available.`, prevState.currentUser);
                    }
                }
            }
            
            return {
                ...prevState, 
                orders: prevState.orders.map(o => o.id === orderId ? { ...o, status } : o),
                tables: newTables,
            };
        });
    }, [addAuditLog]);

    const cancelOrder = useCallback((orderId: string, reason: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const order = prevState.orders.find(o => o.id === orderId);
            if (!order || order.status !== OrderStatus.Unpaid) return prevState;

            addAuditLog('Order Cancellation', `Order #${order.queueNumber} cancelled. Reason: ${reason}`, prevState.currentUser);

            let newTables = prevState.tables;
            let newQrSessions = prevState.qrSessions;

            if(order.qrSessionId) {
                const session = prevState.qrSessions.find(qs => qs.id === order.qrSessionId);
                if (session?.tableId) {
                     const table = prevState.tables.find(t => t.id === session.tableId);
                     if (table) {
                        newTables = prevState.tables.map(t => t.id === session.tableId ? {...t, status: TableStatus.Available} : t);
                        addAuditLog('Table Status', `Table ${table.name} is now available due to cancellation.`, prevState.currentUser);
                     }
                }
                newQrSessions = prevState.qrSessions.map(qs => qs.id === order.qrSessionId ? {...qs, status: 'expired' as const}: qs);
            }

            const newOrders = prevState.orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.Cancelled } : o);

            return { ...prevState, orders: newOrders, tables: newTables, qrSessions: newQrSessions };
        });
    }, [addAuditLog]);

    const addTable = useCallback(() => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const newTableNumber = prevState.tables.length > 0 ? Math.max(...prevState.tables.map(t => parseInt(t.name.replace('T', '')) || 0)) + 1 : 1;
            const newTable: Table = { id: `table-${Date.now()}`, name: `T${newTableNumber}`, status: TableStatus.Available };
            
            addAuditLog('Table Management', `Added new table: ${newTable.name}`, prevState.currentUser);
            
            return {
                ...prevState,
                tables: [...prevState.tables, newTable],
            };
        });
    }, [addAuditLog]);

    const removeTable = useCallback((tableId: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const tableToRemove = prevState.tables.find(t => t.id === tableId);

            if (tableToRemove && tableToRemove.status === TableStatus.Available) {
                addAuditLog('Table Management', `Removed table: ${tableToRemove.name}`, prevState.currentUser);
                return {
                    ...prevState,
                    tables: prevState.tables.filter(t => t.id !== tableId),
                };
            }
            return prevState; // No change if table is occupied or not found
        });
    }, [addAuditLog]);

    const forceClearTable = useCallback((tableId: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const table = prevState.tables.find(t => t.id === tableId);
            if (!table || table.status === TableStatus.Available) return prevState;
            
            let newState = { ...prevState };

            const session = prevState.qrSessions.slice().reverse().find(q => q.tableId === tableId && q.status !== 'expired');

            if (session) {
                const order = session.orderId ? prevState.orders.find(o => o.id === session.orderId) : undefined;

                if (order && order.status === OrderStatus.Unpaid) {
                    addAuditLog('Order Cancellation', `Order #${order.queueNumber} cancelled. Reason: Manually cleared by cashier.`, prevState.currentUser);
                    addAuditLog('Table Status', `Table ${table.name} is now available due to cancellation.`, prevState.currentUser);
                    newState.orders = prevState.orders.map(o => o.id === order.id ? { ...o, status: OrderStatus.Cancelled } : o);
                    newState.qrSessions = prevState.qrSessions.map(qs => qs.id === session.id ? { ...qs, status: 'expired' as const } : qs);
                    newState.tables = prevState.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Available } : t);

                } else if (session.status === 'active') {
                    addAuditLog('QR Cancellation', `Cancelled QR for table ${table.name}: ${session.id}`, prevState.currentUser);
                    newState.qrSessions = prevState.qrSessions.map(qs => qs.id === session.id ? { ...qs, status: 'expired' as const } : qs);
                    newState.tables = prevState.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Available } : t);
                
                } else {
                    return prevState;
                }
            } else {
                addAuditLog('Table Management', `Forced table ${table.name} to available (inconsistent state).`, prevState.currentUser);
                newState.tables = prevState.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Available } : t);
            }
            
            return newState;
        });
    }, [addAuditLog]);
    
    const addMenuItem = useCallback((item: Omit<MenuItem, 'id'>) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const newItem = { ...item, id: `menu-${Date.now()}`};
            addAuditLog('Menu Management', `Added menu item: ${getLocalized(newItem.name)}`, prevState.currentUser);
            return { ...prevState, menuItems: [...prevState.menuItems, newItem]};
        });
    }, [addAuditLog, getLocalized]);

    const updateMenuItem = useCallback((item: MenuItem) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            addAuditLog('Menu Management', `Updated menu item: ${getLocalized(item.name)}`, prevState.currentUser);
            return { ...prevState, menuItems: prevState.menuItems.map(m => m.id === item.id ? item : m)};
        });
    }, [addAuditLog, getLocalized]);
    
    const deleteMenuItem = useCallback((itemId: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const item = prevState.menuItems.find(i => i.id === itemId);
            if (item) {
                 addAuditLog('Menu Management', `Deleted menu item: ${getLocalized(item.name)}`, prevState.currentUser);
                return { ...prevState, menuItems: prevState.menuItems.filter(m => m.id !== itemId)};
            }
            return prevState;
        });
    }, [addAuditLog, getLocalized]);
    
    const updateSettings = useCallback((newSettings: Partial<Settings>) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            addAuditLog('Settings', `System settings updated.`, prevState.currentUser);
            return {...prevState, settings: {...prevState.settings, ...newSettings}};
        });
    }, [addAuditLog]);

    const clearAllData = useCallback(() => {
        if (state.currentUser) {
            addAuditLog('System', `All application data has been cleared.`, state.currentUser);
        }
        localStorage.removeItem('pos_app_state');
        setTimeout(() => window.location.reload(), 100);
    }, [state.currentUser, addAuditLog]);


    // Auto-cancel unpaid orders and expire active QR sessions
    useEffect(() => {
        if (isSharedState) return; // Don't run this timer on customer devices
        const interval = setInterval(() => {
            setState(prevState => {
                const now = new Date();
                const expiryTime = prevState.settings.qrCodeExpiryMinutes;
                let changed = false;
                
                let newOrders = [...prevState.orders];
                let newTables = [...prevState.tables];
                let newQrSessions = [...prevState.qrSessions];

                // Cancel old unpaid orders
                prevState.orders.forEach(order => {
                    if (order.status === OrderStatus.Unpaid) {
                        const orderAgeMinutes = (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60);
                        if (orderAgeMinutes > expiryTime) {
                            changed = true;
                            
                            const orderIndex = newOrders.findIndex(o => o.id === order.id);
                            if (orderIndex !== -1) {
                                newOrders[orderIndex] = { ...newOrders[orderIndex], status: OrderStatus.Cancelled };
                            }

                            if(order.qrSessionId) {
                                const sessionIndex = newQrSessions.findIndex(qs => qs.id === order.qrSessionId);
                                if(sessionIndex !== -1) {
                                    const session = newQrSessions[sessionIndex];
                                    newQrSessions[sessionIndex] = {...session, status: 'expired' as const};
                                    
                                    if(session.tableId) {
                                        const tableIndex = newTables.findIndex(t => t.id === session.tableId);
                                        if (tableIndex !== -1) {
                                            newTables[tableIndex] = {...newTables[tableIndex], status: TableStatus.Available};
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                // Expire old active (unused) QR sessions
                prevState.qrSessions.forEach(session => {
                    if (session.status === 'active') { // 'active' means not yet used for an order
                        const sessionAgeMinutes = (now.getTime() - new Date(session.createdAt).getTime()) / (1000 * 60);
                        if (sessionAgeMinutes > expiryTime) {
                            changed = true;
                            const sessionIndex = newQrSessions.findIndex(s => s.id === session.id);
                            if (sessionIndex !== -1) {
                                newQrSessions[sessionIndex] = { ...newQrSessions[sessionIndex], status: 'expired' };
                            }

                            if (session.tableId) {
                                const tableIndex = newTables.findIndex(t => t.id === session.tableId);
                                if (tableIndex !== -1) {
                                    const latestSessionForTable = prevState.qrSessions
                                        .filter(s => s.tableId === session.tableId)
                                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                                    
                                    if (latestSessionForTable && latestSessionForTable.id === session.id) {
                                        newTables[tableIndex] = { ...newTables[tableIndex], status: TableStatus.Available };
                                    }
                                }
                            }
                        }
                    }
                });


                if (changed) {
                    return { ...prevState, orders: newOrders, tables: newTables, qrSessions: newQrSessions };
                }
                
                return prevState; // No changes
            });
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [isSharedState]);

    return (
        <AppContext.Provider value={{ 
            ...state,
            language, setLanguage, t, getLocalized,
            login, logout, createQrSession, getQrSession, cancelQrSession,
            createOrderFromCart, markOrderAsPaid, updateOrderStatus, cancelOrder,
            addTable, removeTable, forceClearTable,
            addMenuItem, updateMenuItem, deleteMenuItem, updateSettings, clearAllData
        }}>
            {children}
        </AppContext.Provider>
    );
};

// --- CUSTOM HOOK ---
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
