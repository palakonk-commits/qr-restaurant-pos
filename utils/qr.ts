import pako from 'pako';
import { MenuItem, MenuCategory, Settings, MenuOption } from '../types';

// --- QR State Serialization ---

// Define lean versions of types for QR code
// This is to minimize the amount of data encoded in the QR code
interface QrMenuItem {
    id: string;
    name: { th: string; en: string };
    category: string;
    price: number;
    isOutOfStock: boolean;
    options?: MenuOption[];
}
interface QrSettings {
    vatRate: number;
    serviceChargeRate: number;
    currency: { th: string; en: string };
}

// Define a minimal state shape for QR codes to avoid overflowing the QR capacity
interface QrState {
    menuItems: QrMenuItem[];
    menuCategories: MenuCategory[];
    settings: QrSettings;
}

// Encodes the minimal customer state into a URL-safe, compressed string
export const encodeQrState = (state: QrState): string => {
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

// Decodes the minimal state from a URL param for the customer view
export const decodeQrState = (encodedState: string): QrState | null => {
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
    return parsed;
  } catch (e) {
    console.error("Failed to decode QR state from URL", e);
    return null;
  }
};

export const getAbsoluteUrlWithState = (
    hashPath: string,
    menuItems: MenuItem[],
    menuCategories: MenuCategory[],
    settings: Settings
) => {
    const { origin, pathname } = window.location;
    const cleanPath = pathname.replace(/index\.html$/, '');
    const baseUrl = `${origin}${cleanPath}`;
    
    // Create a leaner state object for the QR code to prevent overflow
    const { qrCodeExpiryMinutes, ...customerSettings } = settings;
    const leanMenuItems = menuItems.map(({ id, name, category, price, isOutOfStock, options }) => ({
        id,
        name,
        category,
        price,
        isOutOfStock,
        options,
    }));

    const qrState: QrState = {
        menuItems: leanMenuItems,
        menuCategories,
        settings: customerSettings,
    };
    const encodedState = encodeQrState(qrState);

    return `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${hashPath}&state=${encodedState}`;
};
