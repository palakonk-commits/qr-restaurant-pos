
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import pako from 'pako';
import { User, UserRole, MenuItem, MenuCategory, Order, OrderStatus, QrSession, AuditLog, Settings, ServiceType, CartItem, PaymentMethod, Table, TableStatus, AppState } from '../types';
import { useLocalization } from '../hooks/useLocalization';

// --- STATE SERIALIZATION HELPERS ---
// Encodes the entire app state into a URL-safe, compressed string
export const encodeState = (state: AppState): string => {
  const jsonString = JSON.stringify(state);
  const compressed = pako.deflate(jsonString);
  let binaryString = '';
  compressed.forEach(byte => {
    binaryString += String.fromCharCode(byte);
  });
  return btoa(binaryString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Decodes the state from a URL param
const decodeState = (encodedState: string): AppState | null => {
  try {
    let base64 = encodedState.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binaryString = atob(base64);
    const compressed = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        compressed[i] = binaryString.charCodeAt(i);
    }
    const jsonString = pako.inflate(compressed, { to: 'string' });
    const parsed = JSON.parse(jsonString);
    // Dates are stored as strings, need to convert them back
    parsed.orders = parsed.orders.map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt), paidAt: o.paidAt ? new Date(o.paidAt) : undefined }));
    parsed.qrSessions = parsed.qrSessions.map((s: QrSession) => ({ ...s, createdAt: new Date(s.createdAt) }));
    parsed.auditLogs = parsed.auditLogs.map((l: AuditLog) => ({...l, timestamp: new Date(l.timestamp) }));
    return parsed;
  } catch (e) {
    console.error("Failed to decode state from URL", e);
    return null;
  }
};


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
    if (stateFromUrl) {
        const decoded = decodeState(stateFromUrl);
        if (decoded) {
            console.log("State successfully loaded from URL.");
            // This instance is for a customer, so we don't need to persist their view.
            // We just use the state from the QR.
            return { ...decoded, currentUser: null }; // Always start logged out
        }
    }

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
    createOrderFromCart: (qrId: string, cart: CartItem[], serviceType: ServiceType) => Order | null;
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
    
    // Listen for changes in localStorage from other tabs (i.e., customer orders)
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'pos_app_state' && event.newValue) {
                try {
                    const parsed = JSON.parse(event.newValue);
                    // Rehydrate dates
                    parsed.orders = parsed.orders.map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt), paidAt: o.paidAt ? new Date(o.paidAt) : undefined }));
                    parsed.qrSessions = parsed.qrSessions.map((s: QrSession) => ({ ...s, createdAt: new Date(s.createdAt) }));
                    parsed.auditLogs = parsed.auditLogs.map((l: AuditLog) => ({...l, timestamp: new Date(l.timestamp) }));
                    
                    // Update state but preserve the current logged-in user
                    setState(prevState => ({...parsed, currentUser: prevState.currentUser }));
                } catch (e) {
                    console.error("Failed to parse state from storage event", e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
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

            const newLog: AuditLog = {
                id: `log-${Date.now()}`,
                timestamp: new Date(),
                userId: prevState.currentUser.id,
                userName: prevState.currentUser.name,
                action: 'QR Generation',
                details: `Generated new QR for table ${table.name}: ${newSession.id}`,
            };
            
            return {
                ...prevState,
                qrSessions: [...prevState.qrSessions, newSession],
                tables: prevState.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Occupied } : t),
                auditLogs: [newLog, ...prevState.auditLogs]
            };
        });
        return newSession;
    }, []);

    const cancelQrSession = useCallback((sessionId: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const session = prevState.qrSessions.find(qs => qs.id === sessionId);
            if (!session || session.status !== 'active') return prevState;

            let newTables = prevState.tables;
            let newAuditLogs = prevState.auditLogs;
            
            if (session.tableId) {
                const table = prevState.tables.find(t => t.id === session.tableId);
                if (table) {
                    newTables = prevState.tables.map(t => t.id === session.tableId ? { ...t, status: TableStatus.Available } : t);
                    const newLog: AuditLog = {
                        id: `log-${Date.now()}`,
                        timestamp: new Date(),
                        userId: prevState.currentUser.id,
                        userName: prevState.currentUser.name,
                        action: 'QR Cancellation',
                        details: `Cancelled QR for table ${table.name}: ${sessionId}`,
                    };
                    newAuditLogs = [newLog, ...prevState.auditLogs];
                }
            }
            
            return {
                ...prevState,
                qrSessions: prevState.qrSessions.map(qs => qs.id === sessionId ? { ...qs, status: 'expired' as const } : qs),
                tables: newTables,
                auditLogs: newAuditLogs,
            };
        });
    }, []);

    const getQrSession = useCallback((id: string): QrSession | undefined => {
        return state.qrSessions.find(s => s.id === id);
    }, [state.qrSessions]);
    
    const calculateTotals = (cart: CartItem[], settings: Settings) => {
        const subtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
        const vat = subtotal * settings.vatRate;
        const serviceCharge = subtotal * settings.serviceChargeRate;
        const total = subtotal + vat + serviceCharge;
        return { subtotal, vat, serviceCharge, total };
    };
    
    const createOrderFromCart = (qrId: string, cart: CartItem[], serviceType: ServiceType): Order | null => {
        // 1. Read the LATEST state from localStorage to prevent overwriting recent changes from other tabs.
        let latestState: AppState;
        try {
            const savedState = localStorage.getItem('pos_app_state');
            if (!savedState) {
                console.error("Cannot create order, master state not found in localStorage.");
                return null;
            }
            latestState = JSON.parse(savedState);
            // Rehydrate dates from the master copy
            latestState.orders = latestState.orders.map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt), paidAt: o.paidAt ? new Date(o.paidAt) : undefined }));
            latestState.qrSessions = latestState.qrSessions.map((s: QrSession) => ({ ...s, createdAt: new Date(s.createdAt) }));
            latestState.auditLogs = latestState.auditLogs.map((l: AuditLog) => ({...l, timestamp: new Date(l.timestamp) }));
        } catch(e) {
            console.error("Failed to read master state from localStorage.", e);
            return null; // Don't proceed if we can't get the latest state
        }
        
        // 2. Validate session against the LATEST state
        const session = latestState.qrSessions.find(s => s.id === qrId);
        if (!session || session.status !== 'active') {
            console.error("QR Session is invalid or already used.");
            return null;
        }

        // 3. Create the new order based on the LATEST state
        const newQueueNumber = latestState.lastQueueNumber + 1;
        const { subtotal, vat, serviceCharge, total } = calculateTotals(cart, latestState.settings);
        const newOrder: Order = {
            id: `order-${Date.now()}`,
            qrSessionId: qrId,
            queueNumber: newQueueNumber,
            items: cart.map(item => ({...item, id: `item-${Math.random()}`})),
            serviceType,
            status: OrderStatus.Unpaid,
            subtotal, vat, serviceCharge, discount: 0, total,
            createdAt: new Date(),
            createdBy: 'Customer',
        };
        
        // 4. Construct the final state to be saved
        const finalState: AppState = {
            ...latestState,
            lastQueueNumber: newQueueNumber,
            orders: [...latestState.orders, newOrder],
            qrSessions: latestState.qrSessions.map(s => s.id === qrId ? { ...s, status: 'used' as const, orderId: newOrder.id } : s)
        };

        // 5. Write the final state to localStorage to trigger sync on other tabs
        try {
            const stateToSave = { ...finalState, currentUser: null }; // Always save as logged out
            localStorage.setItem('pos_app_state', JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Customer could not save state to localStorage", error);
            return null;
        }
        
        // 6. Update the local state of this customer tab to match
        setState(finalState);
        
        // 7. Return the created order so navigation can happen
        return newOrder;
    };

    const markOrderAsPaid = (orderId: string, paymentMethod: PaymentMethod) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const order = prevState.orders.find(o=>o.id === orderId);
            if (!order) return prevState;

            const newLog: AuditLog = {
                id: `log-${Date.now()}`,
                timestamp: new Date(),
                userId: prevState.currentUser.id,
                userName: prevState.currentUser.name,
                action: 'Payment',
                details: `Order #${order.queueNumber} marked as paid with ${paymentMethod}.`,
            };

            return { 
                ...prevState, 
                orders: prevState.orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.Paid, paidAt: new Date(), paymentMethod } : o),
                auditLogs: [newLog, ...prevState.auditLogs]
            }
        });
    };
    
    const updateOrderStatus = (orderId: string, status: OrderStatus) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const order = prevState.orders.find(o => o.id === orderId);
            if (!order) return prevState;

            let newTables = prevState.tables;
            let newAuditLogs = prevState.auditLogs;

            const createLog = (action: string, details: string) => ({
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
                userId: prevState.currentUser!.id,
                userName: prevState.currentUser!.name,
                action,
                details
            });
            
            newAuditLogs = [createLog('Order Status Update', `Order #${order.queueNumber} status changed to ${status}.`), ...newAuditLogs];
            
            if ((status === OrderStatus.Served || status === OrderStatus.Cancelled) && order.qrSessionId) {
                const session = prevState.qrSessions.find(q => q.id === order.qrSessionId);
                if (session?.tableId) {
                    const table = prevState.tables.find(t => t.id === session.tableId);
                    if (table) {
                        newTables = prevState.tables.map(t => t.id === session.tableId ? { ...t, status: TableStatus.Available } : t);
                        newAuditLogs = [createLog('Table Status', `Table ${table.name} is now available.`), ...newAuditLogs];
                    }
                }
            }
            
            return {
                ...prevState, 
                orders: prevState.orders.map(o => o.id === orderId ? { ...o, status } : o),
                tables: newTables,
                auditLogs: newAuditLogs
            };
        });
    };

    const cancelOrder = useCallback((orderId: string, reason: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const order = prevState.orders.find(o => o.id === orderId);
            if (!order || order.status !== OrderStatus.Unpaid) return prevState;

            let newAuditLogs = prevState.auditLogs;
            const createLog = (action: string, details: string) => ({
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
                userId: prevState.currentUser!.id,
                userName: prevState.currentUser!.name,
                action,
                details
            });
            newAuditLogs = [createLog('Order Cancellation', `Order #${order.queueNumber} cancelled. Reason: ${reason}`), ...newAuditLogs];

            let newTables = prevState.tables;
            let newQrSessions = prevState.qrSessions;

            if(order.qrSessionId) {
                const session = prevState.qrSessions.find(qs => qs.id === order.qrSessionId);
                if (session?.tableId) {
                     const table = prevState.tables.find(t => t.id === session.tableId);
                     if (table) {
                        newTables = prevState.tables.map(t => t.id === session.tableId ? {...t, status: TableStatus.Available} : t);
                        newAuditLogs = [createLog('Table Status', `Table ${table.name} is now available due to cancellation.`), ...newAuditLogs];
                     }
                }
                newQrSessions = prevState.qrSessions.map(qs => qs.id === order.qrSessionId ? {...qs, status: 'expired' as const}: qs);
            }

            const newOrders = prevState.orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.Cancelled } : o);

            return { ...prevState, orders: newOrders, tables: newTables, qrSessions: newQrSessions, auditLogs: newAuditLogs };
        });
    }, []);

    const addTable = useCallback(() => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const newTableNumber = prevState.tables.length > 0 ? Math.max(...prevState.tables.map(t => parseInt(t.name.replace('T', '')) || 0)) + 1 : 1;
            const newTable: Table = { id: `table-${Date.now()}`, name: `T${newTableNumber}`, status: TableStatus.Available };
            
            const newLog: AuditLog = {
                id: `log-${Date.now()}`,
                timestamp: new Date(),
                userId: prevState.currentUser.id,
                userName: prevState.currentUser.name,
                action: 'Table Management',
                details: `Added new table: ${newTable.name}`,
            };
            
            return {
                ...prevState,
                tables: [...prevState.tables, newTable],
                auditLogs: [newLog, ...prevState.auditLogs]
            };
        });
    }, []);

    const removeTable = useCallback((tableId: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const tableToRemove = prevState.tables.find(t => t.id === tableId);

            if (tableToRemove && tableToRemove.status === TableStatus.Available) {
                const newLog: AuditLog = {
                    id: `log-${Date.now()}`,
                    timestamp: new Date(),
                    userId: prevState.currentUser.id,
                    userName: prevState.currentUser.name,
                    action: 'Table Management',
                    details: `Removed table: ${tableToRemove.name}`,
                };
                return {
                    ...prevState,
                    tables: prevState.tables.filter(t => t.id !== tableId),
                    auditLogs: [newLog, ...prevState.auditLogs]
                };
            }
            return prevState; // No change if table is occupied or not found
        });
    }, []);

    const forceClearTable = useCallback((tableId: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const table = prevState.tables.find(t => t.id === tableId);
            if (!table || table.status === TableStatus.Available) return prevState;
            
            let newState = { ...prevState };
            const createLog = (action: string, details: string) => ({
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
                userId: prevState.currentUser!.id,
                userName: prevState.currentUser!.name,
                action,
                details
            });
            let newLogs: AuditLog[] = [];

            const session = prevState.qrSessions.slice().reverse().find(q => q.tableId === tableId && q.status !== 'expired');

            // If a session is found, try to cancel it or its associated order
            if (session) {
                const order = session.orderId ? prevState.orders.find(o => o.id === session.orderId) : undefined;

                if (order && order.status === OrderStatus.Unpaid) {
                    // Cancel the unpaid order
                    newLogs.push(createLog('Order Cancellation', `Order #${order.queueNumber} cancelled. Reason: Manually cleared by cashier.`));
                    newLogs.push(createLog('Table Status', `Table ${table.name} is now available due to cancellation.`));
                    
                    newState.orders = prevState.orders.map(o => o.id === order.id ? { ...o, status: OrderStatus.Cancelled } : o);
                    newState.qrSessions = prevState.qrSessions.map(qs => qs.id === session.id ? { ...qs, status: 'expired' as const } : qs);
                    newState.tables = prevState.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Available } : t);

                } else if (session.status === 'active') {
                    // Cancel the active (but unused) QR session
                    newLogs.push(createLog('QR Cancellation', `Cancelled QR for table ${table.name}: ${session.id}`));
                    newState.qrSessions = prevState.qrSessions.map(qs => qs.id === session.id ? { ...qs, status: 'expired' as const } : qs);
                    newState.tables = prevState.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Available } : t);
                
                } else {
                     // The order is paid or served, cannot clear
                    return prevState;
                }
            } else {
                 // No active/used session found, but table is occupied (inconsistent state). Force clear.
                newLogs.push(createLog('Table Management', `Forced table ${table.name} to available (inconsistent state).`));
                newState.tables = prevState.tables.map(t => t.id === tableId ? { ...t, status: TableStatus.Available } : t);
            }
            
            return { ...newState, auditLogs: [...newLogs, ...prevState.auditLogs] };
        });
    }, []);
    
    const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const newItem = { ...item, id: `menu-${Date.now()}`};
            const newLog: AuditLog = {
                id: `log-${Date.now()}`,
                timestamp: new Date(),
                userId: prevState.currentUser.id,
                userName: prevState.currentUser.name,
                action: 'Menu Management',
                details: `Added menu item: ${getLocalized(newItem.name)}`,
            };
            return { ...prevState, menuItems: [...prevState.menuItems, newItem], auditLogs: [newLog, ...prevState.auditLogs]};
        });
    };

    const updateMenuItem = (item: MenuItem) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const newLog: AuditLog = {
                id: `log-${Date.now()}`,
                timestamp: new Date(),
                userId: prevState.currentUser.id,
                userName: prevState.currentUser.name,
                action: 'Menu Management',
                details: `Updated menu item: ${getLocalized(item.name)}`,
            };
            return { ...prevState, menuItems: prevState.menuItems.map(m => m.id === item.id ? item : m), auditLogs: [newLog, ...prevState.auditLogs]};
        });
    };
    
    const deleteMenuItem = (itemId: string) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const item = prevState.menuItems.find(i => i.id === itemId);
            if (item) {
                 const newLog: AuditLog = {
                    id: `log-${Date.now()}`,
                    timestamp: new Date(),
                    userId: prevState.currentUser.id,
                    userName: prevState.currentUser.name,
                    action: 'Menu Management',
                    details: `Deleted menu item: ${getLocalized(item.name)}`,
                };
                return { ...prevState, menuItems: prevState.menuItems.filter(m => m.id !== itemId), auditLogs: [newLog, ...prevState.auditLogs]};
            }
            return prevState;
        });
    };
    
    const updateSettings = (newSettings: Partial<Settings>) => {
        setState(prevState => {
            if (!prevState.currentUser) return prevState;
            const newLog: AuditLog = {
                    id: `log-${Date.now()}`,
                    timestamp: new Date(),
                    userId: prevState.currentUser.id,
                    userName: prevState.currentUser.name,
                    action: 'Settings',
                    details: `System settings updated.`,
            };
            return {...prevState, settings: {...prevState.settings, ...newSettings}, auditLogs: [newLog, ...prevState.auditLogs]};
        });
    };

    const clearAllData = () => {
        if (state.currentUser) {
            addAuditLog('System', `All application data has been cleared.`, state.currentUser);
        }
        localStorage.removeItem('pos_app_state');
        // A slight delay to ensure the log is captured in state before reload, although localStorage persistence is primary
        setTimeout(() => window.location.reload(), 100);
    }


    // Auto-cancel unpaid orders
    useEffect(() => {
        const interval = setInterval(() => {
            setState(prevState => {
                const now = new Date();
                const expiryTime = prevState.settings.qrCodeExpiryMinutes;
                let changed = false;
                
                let newOrders = [...prevState.orders];
                let newTables = [...prevState.tables];
                let newQrSessions = [...prevState.qrSessions];

                prevState.orders.forEach(order => {
                    if (order.status === OrderStatus.Unpaid) {
                        const orderAgeMinutes = (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60);
                        if (orderAgeMinutes > expiryTime) {
                            changed = true;
                            
                            // Find and update the specific order
                            const orderIndex = newOrders.findIndex(o => o.id === order.id);
                            if (orderIndex !== -1) {
                                newOrders[orderIndex] = { ...newOrders[orderIndex], status: OrderStatus.Cancelled };
                            }

                            // If linked to a QR session and table, update them
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

                if (changed) {
                    return { ...prevState, orders: newOrders, tables: newTables, qrSessions: newQrSessions };
                }
                
                return prevState; // No changes
            });
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []); // Empty dependency array to run only once

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
