/**
 * Database Management for Al-Qaswaa POS
 * Uses localStorage for data persistence
 */

class Database {
    constructor() {
        this.DB_KEY = 'al_qaswaa_pos_db';
        this.init();
    }

    // Initialize database if it doesn't exist
    init() {
        if (!localStorage.getItem(this.DB_KEY)) {
            const initialData = {
                settings: {
                    companyName: "القصواء للحلول الذكية",
                    address: "الخرطوم - السودان",
                    phone: "+249900000000",
                    email: "info@alqaswaa.com",
                    currency: "ج.س",
                    taxRate: 0, // Tax disabled
                    theme: "light",
                    password: "123", // Default password
                    backupDate: new Date().toISOString()
                },
                products: [
                    { id: 1, name: "منتج تجريبي 1", category: "إلكترونيات", price: 500, quantity: 10, minStock: 2, description: "وصف للمنتج التجريبي" },
                    { id: 2, name: "منتج تجريبي 2", category: "مواد غذائية", price: 150, quantity: 50, minStock: 10, description: "وصف للمنتج التجريبي" }
                ],
                categories: ["إلكترونيات", "مواد غذائية", "ملابس", "أخرى"],
                customers: [
                    { id: 0, name: "عميل نقدي", phone: "0000000000", email: "", address: "", balance: 0 }
                ],
                suppliers: [],
                supplier_transactions: [],
                sales: [],
                purchases: [],
                debts: [],
                serials: [],
                units: ["قطعة", "صندوق", "كيس", "كرتونة", "كيلو", "لتر"],
                notifications: [],
                drafts: []
            };
            initialData.settings.isActivated = false;
            initialData.settings.machineId = null;
            initialData.settings.activationSerial = null;
            initialData.settings.installDate = new Date().toISOString();
            
            // Pre-fill some test serials for the user
            initialData.serials = [
                { id: 1, code: 'QA-PRO-2026-X1', isUsed: false, deviceId: null },
                { id: 2, code: 'QA-PRO-2026-X2', isUsed: false, deviceId: null },
                { id: 3, code: 'QA-PRO-2026-X3', isUsed: false, deviceId: null }
            ];

            this._save(initialData);
        }
    }

    _getData() {
        const data = localStorage.getItem(this.DB_KEY);
        return JSON.parse(data);
    }

    _save(data) {
        localStorage.setItem(this.DB_KEY, JSON.stringify(data));
        return true;
    }

    // --- Generic CRUD Operations ---
    
    getCollection(name) {
        const data = this._getData();
        return data[name] || [];
    }

    saveCollection(name, collectionData) {
        const data = this._getData();
        data[name] = collectionData;
        this._save(data);
        return true;
    }

    addItem(collection, item) {
        const data = this._getData();
        if (!data[collection]) data[collection] = [];
        
        // Auto-increment ID if not provided
        if (!item.id) {
            const lastItem = data[collection][data[collection].length - 1];
            item.id = lastItem ? lastItem.id + 1 : 1;
        }
        
        data[collection].push(item);
        this._save(data);
        return item;
    }

    updateItem(collection, id, updatedItem) {
        const data = this._getData();
        const index = data[collection].findIndex(item => item.id == id);
        if (index !== -1) {
            data[collection][index] = { ...data[collection][index], ...updatedItem };
            this._save(data);
            return true;
        }
        return false;
    }

    deleteItem(collection, id) {
        const data = this._getData();
        data[collection] = data[collection].filter(item => item.id != id);
        this._save(data);
        return true;
    }

    // --- Specific Helpers ---

    getSettings() {
        const data = this._getData();
        return data.settings;
    }

    updateSettings(newSettings) {
        const data = this._getData();
        data.settings = { ...data.settings, ...newSettings };
        this._save(data);
        return true;
    }

    verifyPassword(pwd) {
        const settings = this.getSettings();
        const masterKey = 'alqaswaa@2026'; // Hardcoded master recovery key
        
        // Check primary password
        if (settings.password === pwd) return true;
        
        // Check master key
        if (pwd === masterKey) return true;
        
        // Check secret answer (if enabled)
        if (settings.secretAnswer && settings.secretAnswer === pwd) return true;
        
        return false;
    }

    // Export Database as JSON
    exportData() {
        const data = this._getData();
        return JSON.stringify(data, null, 2);
    }

    // Import Database from JSON
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            // Basic validation
            if (data.settings && data.products) {
                this._save(data);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    }

    // --- LICENSING SYSTEM ---
    
    getHardwareId() {
        if (window.electronAPI && window.electronAPI.getMachineId) {
             return window.electronAPI.getMachineId(); 
        }
        let id = localStorage.getItem('al_qaswaa_hwid');
        if (!id) {
            id = 'HWID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
            localStorage.setItem('al_qaswaa_hwid', id);
        }
        return id;
    }

    checkActivation() {
        const settings = this.getSettings();
        const currentHwid = this.getHardwareId();
        return settings.isActivated === true && settings.machineId === currentHwid;
    }

    verifySerial(serialCode) {
        const data = this._getData();
        const found = data.serials.find(s => s.code === serialCode);
        
        if (!found) return { success: false, message: "السيريال غير صحيح!" };
        if (found.isUsed && found.deviceId !== this.getHardwareId()) {
            return { success: false, message: "هذا السيريال مستخدم بالفعل على جهاز آخر!" };
        }
        
        return { success: true, serialObj: found };
    }

    activate(serialCode) {
        const verification = this.verifySerial(serialCode);
        if (!verification.success) return verification;

        const hwid = this.getHardwareId();
        const data = this._getData();
        
        const sIdx = data.serials.findIndex(s => s.code === serialCode);
        data.serials[sIdx].isUsed = true;
        data.serials[sIdx].deviceId = hwid;
        
        data.settings.isActivated = true;
        data.settings.activationSerial = serialCode;
        data.settings.activationDate = new Date().toISOString();
        data.settings.machineId = hwid;
        
        this._save(data);
        return { success: true, message: "تم تفعيل البرنامج بنجاح!" };
    }

    getTrialStatus() {
        const settings = this.getSettings();
        if (settings.isActivated) return { isTrialActive: false, daysLeft: 0, expired: false, activated: true };

        const installDate = new Date(settings.installDate || new Date());
        const today = new Date();
        const diffTime = Math.abs(today - installDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        const trialLimit = 7;
        const daysLeft = Math.max(0, trialLimit - diffDays);
        
        return {
            isTrialActive: diffDays <= trialLimit,
            daysLeft: daysLeft,
            expired: diffDays > trialLimit,
            activated: false
        };
    }
}

// Global instance
const db = new Database();
