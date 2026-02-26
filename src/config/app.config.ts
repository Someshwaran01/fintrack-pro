// App configuration

export const APP_CONFIG = {
    // App metadata
    APP_NAME: 'Somu Fin - Tracker',
    APP_VERSION: '1.1.0',

    // Feature flags
    ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development',
    ENABLE_REALTIME_SYNC: true,

    // Sync settings
    MAX_FAMILY_MEMBERS: 5,
    AUTO_SAVE_DELAY: 500, // ms

    // UI settings
    MONTHS: [
        'Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26',
        'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'
    ],

    // Storage keys
    STORAGE_KEYS: {
        FAMILY_ID: 'fintrack_family_id',
        BILLS: 'fintrack_bills',
        MEDICAL: 'fintrack_medical',
        HOME: 'fintrack_home',
        INCOME: 'fintrack_income',
        SAVINGS: 'fintrack_savings',
        CC_LIMITS: 'fintrack_cc_limits'
    }
};

/**
 * Conditional logging based on environment
 */
export const logger = {
    log: (...args: any[]) => {
        if (APP_CONFIG.ENABLE_DEBUG_LOGS) {
            console.log(...args);
        }
    },
    error: (...args: any[]) => {
        console.error(...args);
    },
    warn: (...args: any[]) => {
        if (APP_CONFIG.ENABLE_DEBUG_LOGS) {
            console.warn(...args);
        }
    }
};
