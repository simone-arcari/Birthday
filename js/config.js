/* =====================================================
   CONFIG.JS - Configurazione per test e sviluppo
   ===================================================== */

const CONFIG = {
    // ========== MODALITÀ TEST ==========
    
    // Imposta a TRUE per bypassare la lock screen
    // IMPORTANTE: Rimettere a FALSE prima di pubblicare!
    BYPASS_LOCK_SCREEN: true,
    
    // ========== DATE E ORARI ==========
    
    // Orario di sblocco della lock screen (formato ISO)
    UNLOCK_TIME: '2026-02-01T18:45:00+01:00',
    
    // Data/ora della cena (per il countdown finale)
    DINNER_DATE: '2026-02-01T19:15:00+01:00',
    
    // ========== DEBUG ==========
    
    // Mostra log nella console
    DEBUG_MODE: false
};

// Non modificare sotto questa riga
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
