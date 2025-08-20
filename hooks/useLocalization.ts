import { useState, useCallback, useEffect } from 'react';

const translations: { [key: string]: { [key: string]: string } } = {
  en: {
    // General
    'th': 'TH',
    'en': 'EN',
    'appName': 'QR Restaurant POS',
    'logout': 'Logout',
    'login': 'Login',
    'selectUser': 'Select User',
    'enterPin': 'Enter PIN',
    'submit': 'Submit',
    'close': 'Close',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'error': 'Error',
    'success': 'Success',
    'loading': 'Loading...',
    'search': 'Search...',
    'price': 'Price',
    'quantity': 'Quantity',
    'total': 'Total',
    'notes': 'Notes',
    'subtotal': 'Subtotal',
    'vat': 'VAT',
    'serviceCharge': 'Service Charge',
    'discount': 'Discount',
    'grandTotal': 'Grand Total',
    'status': 'Status',
    'actions': 'Actions',
    'required': 'Required',
    'optional': 'Optional',
    'save': 'Save',
    'edit': 'Edit',
    'delete': 'Delete',
    'outOfStock': 'Out of Stock',
    
    // Roles
    'Cashier': 'Cashier',
    'Kitchen': 'Kitchen',
    'Manager': 'Manager',
    'Auditor': 'Auditor',

    // Cashier View
    'newQR': 'New Customer (Print QR)',
    'unpaid': 'Unpaid',
    'inProgress': 'In Progress',
    'completed': 'Completed',
    'printQR': 'Print New QR',
    'newWalkInOrder': 'New Walk-in Order',
    'unpaidOrders': 'Unpaid Orders',
    'order': 'Order',
    'pay': 'Pay',
    'payment': 'Payment',
    'paymentMethod': 'Payment Method',
    'cash': 'Cash',
    'card': 'Card',
    'transfer': 'Transfer',
    'markAsPaid': 'Mark as Paid',
    'orderPaidSuccess': 'Order marked as paid successfully!',
    'printReceipt': 'Print Receipt',
    'manageTables': 'Manage Tables',
    'doneManaging': 'Done',
    'addTable': 'Add Table',
    'confirmRemoveTableTitle': 'Delete Table',
    'confirmRemoveTableMessage': 'Are you sure you want to permanently delete this table?',
    'tableInUseError': 'Cannot remove an occupied table.',
    'manageTable': 'Manage Table',
    'markAsAvailable': 'Mark as Available (Customer Left)',
    'confirmClearTableTitle': 'Clear Table',
    'confirmClearTableMessage': 'Are you sure? This will cancel any unpaid order and make the table available.',
    'floorPlan': 'Floor Plan',
    'editFloorPlan': 'Edit Floor Plan',
    'clearTable': 'Clear Table',


    // Customer View
    'welcome': 'Welcome!',
    'menu': 'Menu',
    'yourCart': 'Your Cart',
    'addToCart': 'Add to Cart',
    'specialInstructions': 'Allergies or special instructions...',
    'cartIsEmpty': 'Your cart is empty.',
    'confirmOrder': 'Confirm Order',
    'payAtCounterMessage': 'Please proceed to the counter to pay for your order.',
    'dineIn': 'Dine-in',
    'takeAway': 'Take-away',
    'pickUp': 'Pick-up',
    'serviceType': 'Service Type',
    'yourOrder': 'Your Order',
    'queueNumber': 'Queue Number',
    'orderStatus': 'Order Status',

    // Order Statuses
    'Unpaid': 'Unpaid',
    'Paid': 'Paid',
    'Preparing': 'Preparing',
    'Ready': 'Ready for Pickup',
    'Served': 'Served',
    'Cancelled': 'Cancelled',
    
    // KDS
    'kitchenDisplaySystem': 'Kitchen Display System',
    'new': 'New',
    'cooking': 'Cooking',
    'done': 'Done',
    'startCooking': 'Start Cooking',
    'markAsReady': 'Mark as Ready',
    'markAsServed': 'Mark as Served',

    // Manager
    'managerDashboard': 'Manager Dashboard',
    'menuManagement': 'Menu Management',
    'reports': 'Reports',
    'settings': 'Settings',
    'auditLog': 'Audit Log',
    'addCategory': 'Add Category',
    'addItem': 'Add Item',
    'itemName': 'Item Name',
    'category': 'Category',
    'vatRate': 'VAT Rate (%)',
    'serviceChargeRate': 'Service Charge Rate (%)',
    'qrCodeExpiry': 'QR Code Expiry (minutes)',
    'systemSettings': 'System Settings',
    'dataManagement': 'Data Management',
    'exportData': 'Export Data',
    'clearAllData': 'Clear All Data',
    'confirmClearDataTitle': 'Confirm Clear All Data',
    'confirmClearDataMessage': 'Are you sure you want to delete ALL data? This cannot be undone.',
    'salesSummary': 'Sales Summary',
    'totalRevenue': 'Total Revenue',
    'totalOrders': 'Total Orders',
    'topSellingItems': 'Top Selling Items',
    'exportToCSV': 'Export to CSV',
    'confirmDeleteItemTitle': 'Delete Menu Item',
    'confirmDeleteItemMessage': 'Are you sure you want to delete this menu item?',
  },
  th: {
    // General
    'th': 'ไทย',
    'en': 'ENG',
    'appName': 'ระบบ POS ร้านอาหาร',
    'logout': 'ออกจากระบบ',
    'login': 'เข้าสู่ระบบ',
    'selectUser': 'เลือกผู้ใช้งาน',
    'enterPin': 'ใส่รหัส PIN',
    'submit': 'ยืนยัน',
    'close': 'ปิด',
    'cancel': 'ยกเลิก',
    'confirm': 'ยืนยัน',
    'error': 'ข้อผิดพลาด',
    'success': 'สำเร็จ',
    'loading': 'กำลังโหลด...',
    'search': 'ค้นหา...',
    'price': 'ราคา',
    'quantity': 'จำนวน',
    'total': 'รวม',
    'notes': 'หมายเหตุ',
    'subtotal': 'ยอดรวม',
    'vat': 'ภาษีมูลค่าเพิ่ม',
    'serviceCharge': 'ค่าบริการ',
    'discount': 'ส่วนลด',
    'grandTotal': 'ยอดสุทธิ',
    'status': 'สถานะ',
    'actions': 'ดำเนินการ',
    'required': 'จำเป็น',
    'optional': 'ไม่บังคับ',
    'save': 'บันทึก',
    'edit': 'แก้ไข',
    'delete': 'ลบ',
    'outOfStock': 'ของหมด',

    // Roles
    'Cashier': 'แคชเชียร์',
    'Kitchen': 'ครัว',
    'Manager': 'ผู้จัดการ',
    'Auditor': 'ผู้ตรวจสอบ',

    // Cashier View
    'newQR': 'ลูกค้าใหม่ (พิมพ์ QR)',
    'unpaid': 'ยังไม่ชำระ',
    'inProgress': 'กำลังดำเนินการ',
    'completed': 'เสร็จสิ้น',
    'printQR': 'พิมพ์ QR ใหม่',
    'newWalkInOrder': 'ออร์เดอร์หน้าร้าน',
    'unpaidOrders': 'ออร์เดอร์ที่ยังไม่ชำระ',
    'order': 'ออร์เดอร์',
    'pay': 'ชำระเงิน',
    'payment': 'การชำระเงิน',
    'paymentMethod': 'วิธีชำระเงิน',
    'cash': 'เงินสด',
    'card': 'บัตรเครดิต',
    'transfer': 'โอนเงิน',
    'markAsPaid': 'ทำเครื่องหมายว่าชำระแล้ว',
    'orderPaidSuccess': 'บันทึกการชำระเงินสำเร็จ!',
    'printReceipt': 'พิมพ์ใบเสร็จ',
    'manageTables': 'จัดการโต๊ะ',
    'doneManaging': 'เสร็จสิ้น',
    'addTable': 'เพิ่มโต๊ะ',
    'confirmRemoveTableTitle': 'ลบโต๊ะ',
    'confirmRemoveTableMessage': 'คุณแน่ใจหรือไม่ว่าต้องการลบโต๊ะนี้อย่างถาวร?',
    'tableInUseError': 'ไม่สามารถลบโต๊ะที่มีลูกค้าอยู่ได้',
    'manageTable': 'จัดการโต๊ะ',
    'markAsAvailable': 'ทำให้โต๊ะว่าง (ลูกค้าไปแล้ว)',
    'confirmClearTableTitle': 'เคลียร์โต๊ะ',
    'confirmClearTableMessage': 'คุณแน่ใจหรือไม่? การกระทำนี้จะยกเลิกออร์เดอร์ที่ยังไม่ชำระเงินและทำให้โต๊ะนี้ว่าง',
    'floorPlan': 'แผนผังโต๊ะ',
    'editFloorPlan': 'แก้ไขผังโต๊ะ',
    'clearTable': 'เคลียร์โต๊ะ',

    // Customer View
    'welcome': 'ยินดีต้อนรับ!',
    'menu': 'เมนูอาหาร',
    'yourCart': 'ตะกร้าของคุณ',
    'addToCart': 'เพิ่มลงตะกร้า',
    'specialInstructions': 'แพ้อาหารหรือคำแนะนำพิเศษ...',
    'cartIsEmpty': 'ตะกร้าของคุณว่างเปล่า',
    'confirmOrder': 'ยืนยันรายการ',
    'payAtCounterMessage': 'กรุณาชำระเงินที่เคาน์เตอร์',
    'dineIn': 'ทานที่ร้าน',
    'takeAway': 'ห่อกลับบ้าน',
    'pickUp': 'รับเอง',
    'serviceType': 'ประเภทบริการ',
    'yourOrder': 'ออร์เดอร์ของคุณ',
    'queueNumber': 'หมายเลขคิว',
    'orderStatus': 'สถานะออร์เดอร์',
    
    // Order Statuses
    'Unpaid': 'รอชำระเงิน',
    'Paid': 'ชำระแล้ว',
    'Preparing': 'กำลังเตรียม',
    'Ready': 'พร้อมรับ',
    'Served': 'เสิร์ฟแล้ว',
    'Cancelled': 'ยกเลิกแล้ว',
    
    // KDS
    'kitchenDisplaySystem': 'จอแสดงผลในครัว',
    'new': 'ใหม่',
    'cooking': 'กำลังทำ',
    'done': 'เสร็จแล้ว',
    'startCooking': 'เริ่มทำอาหาร',
    'markAsReady': 'เสร็จแล้ว',
    'markAsServed': 'เสิร์ฟแล้ว',

    // Manager
    'managerDashboard': 'แดชบอร์ดผู้จัดการ',
    'menuManagement': 'จัดการเมนู',
    'reports': 'รายงาน',
    'settings': 'ตั้งค่า',
    'auditLog': 'บันทึกกิจกรรม',
    'addCategory': 'เพิ่มหมวดหมู่',
    'addItem': 'เพิ่มรายการ',
    'itemName': 'ชื่อรายการ',
    'category': 'หมวดหมู่',
    'vatRate': 'อัตราภาษี (%)',
    'serviceChargeRate': 'อัตราค่าบริการ (%)',
    'qrCodeExpiry': 'อายุ QR Code (นาที)',
    'systemSettings': 'ตั้งค่าระบบ',
    'dataManagement': 'จัดการข้อมูล',
    'exportData': 'ส่งออกข้อมูล',
    'clearAllData': 'ล้างข้อมูลทั้งหมด',
    'confirmClearDataTitle': 'ยืนยันการล้างข้อมูลทั้งหมด',
    'confirmClearDataMessage': 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้',
    'salesSummary': 'สรุปยอดขาย',
    'totalRevenue': 'รายได้รวม',
    'totalOrders': 'จำนวนออร์เดอร์',
    'topSellingItems': 'รายการขายดี',
    'exportToCSV': 'ส่งออกเป็น CSV',
    'confirmDeleteItemTitle': 'ลบรายการอาหาร',
    'confirmDeleteItemMessage': 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการอาหารนี้?',
  },
};

export type Language = 'en' | 'th';

export const useLocalization = () => {
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('pos_lang') as Language) || 'en'
  );

  useEffect(() => {
    localStorage.setItem('pos_lang', language);
  }, [language]);

  const t = useCallback(
    (key: string, lang: Language = language): string => {
      return translations[lang]?.[key] || key;
    },
    [language]
  );
  
  const getLocalized = useCallback(
    (obj: { en: string; th: string } | undefined) => {
        if (!obj) return '';
        return obj[language];
    },
    [language]
  );

  return { language, setLanguage, t, getLocalized };
};