/* =====================================================
   MAIN.JS - Lettera di Hogwarts per Serena
   Main Application Controller
   ===================================================== */

// Application State
const AppState = {
    currentScreen: 'lock',
    screens: ['lock', 'intro', 'owl', 'letter-sealed', 'letter-content', 'countdown'],
    isAnimating: false,
    audioStarted: false,
    isUnlocked: false
};

// DOM Elements
const DOM = {
    screens: {},
    audioToggle: null,
    audioIcon: null,
    countdown: {
        hours: null,
        minutes: null,
        seconds: null
    },
    lockCountdown: {
        hours: null,
        minutes: null,
        seconds: null
    },
    candlesContainer: null,
    continueBtn: null,
    restartBtn: null
};

// Managers
let audioManager;
let particleSystem;

// Target dinner date/time (from config or default)
const DINNER_DATE = new Date(CONFIG?.DINNER_DATE || '2026-02-01T19:15:00+01:00');

// Unlock time - 18:45 on February 1st, 2026 (from config or default)
const UNLOCK_TIME = new Date(CONFIG?.UNLOCK_TIME || '2026-02-01T18:45:00+01:00');

/* =====================================================
   INITIALIZATION
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initDOM();
    initManagers();
    initEventListeners();
    generateCandles();
    startCountdown();
    startLockCountdown();
    
    // Check if already unlocked
    checkUnlockStatus();
});

function initDOM() {
    // Get all screens
    document.querySelectorAll('.screen').forEach(screen => {
        const id = screen.id.replace('-screen', '');
        DOM.screens[id] = screen;
    });
    
    // Audio controls
    DOM.audioToggle = document.getElementById('audio-toggle');
    DOM.audioIcon = DOM.audioToggle?.querySelector('.audio-icon');
    
    // Countdown elements (final countdown)
    DOM.countdown.hours = document.getElementById('hours');
    DOM.countdown.minutes = document.getElementById('minutes');
    DOM.countdown.seconds = document.getElementById('seconds');
    
    // Lock countdown elements
    DOM.lockCountdown.hours = document.getElementById('lock-hours');
    DOM.lockCountdown.minutes = document.getElementById('lock-minutes');
    DOM.lockCountdown.seconds = document.getElementById('lock-seconds');
    
    // Other elements
    DOM.candlesContainer = document.getElementById('candles');
    DOM.continueBtn = document.getElementById('continue-btn');
    DOM.restartBtn = document.getElementById('restart-btn');
    DOM.waxSeal = document.getElementById('wax-seal');
    DOM.owl = document.getElementById('hedwig');
}

function initManagers() {
    // Initialize audio manager
    audioManager = new MagicalAudioManager();
    
    // Initialize particle system
    particleSystem = new ParticleSystem('particles-canvas');
}

function initEventListeners() {
    // Audio toggle
    DOM.audioToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAudio();
    });
    
    // Intro screen - tap to start
    if (DOM.screens.intro) {
        DOM.screens.intro.addEventListener('click', startExperience);
    }
    
    // Wax seal - break to open letter
    if (DOM.waxSeal) {
        DOM.waxSeal.addEventListener('click', (e) => {
            e.stopPropagation();
            breakSeal(e);
        });
    }
    
    // Continue button
    if (DOM.continueBtn) {
        DOM.continueBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            goToCountdown();
        });
    }
    
    // Restart button
    if (DOM.restartBtn) {
        DOM.restartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            restartExperience();
        });
    }
    
    // Lock screen - click to proceed (only when unlocked)
    if (DOM.screens.lock) {
        DOM.screens.lock.addEventListener('click', proceedFromLockScreen);
    }
}

/* =====================================================
   LOCK SCREEN MANAGEMENT
   ===================================================== */

function checkUnlockStatus() {
    // Check if bypass is enabled in config
    if (CONFIG?.BYPASS_LOCK_SCREEN === true) {
        if (CONFIG?.DEBUG_MODE) console.log('🔓 Lock screen bypassed via config');
        AppState.isUnlocked = true;
        showScreen('intro');
        return;
    }
    
    const now = new Date();
    
    if (now >= UNLOCK_TIME) {
        // Already unlocked - go directly to intro
        AppState.isUnlocked = true;
        showScreen('intro');
    } else {
        // Still locked - show lock screen
        showScreen('lock');
    }
}

function startLockCountdown() {
    updateLockCountdown();
    setInterval(updateLockCountdown, 1000);
}

function updateLockCountdown() {
    const now = new Date();
    const diff = UNLOCK_TIME - now;
    
    if (diff <= 0) {
        // Time's up - unlock!
        if (!AppState.isUnlocked) {
            unlockExperience();
        }
        
        // Show zeros
        if (DOM.lockCountdown.hours) DOM.lockCountdown.hours.textContent = '00';
        if (DOM.lockCountdown.minutes) DOM.lockCountdown.minutes.textContent = '00';
        if (DOM.lockCountdown.seconds) DOM.lockCountdown.seconds.textContent = '00';
        return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    if (DOM.lockCountdown.hours) DOM.lockCountdown.hours.textContent = String(hours).padStart(2, '0');
    if (DOM.lockCountdown.minutes) DOM.lockCountdown.minutes.textContent = String(minutes).padStart(2, '0');
    if (DOM.lockCountdown.seconds) DOM.lockCountdown.seconds.textContent = String(seconds).padStart(2, '0');
}

function unlockExperience() {
    AppState.isUnlocked = true;
    
    const lockScreen = DOM.screens.lock;
    if (lockScreen) {
        lockScreen.classList.add('unlocked');
        
        // Update text to indicate it's unlocked
        const patience = lockScreen.querySelector('.lock-patience');
        if (patience) {
            patience.textContent = 'Tocca per scoprire la sorpresa! ✨';
        }
        
        const subtitle = lockScreen.querySelector('.lock-subtitle');
        if (subtitle) {
            subtitle.textContent = 'È il momento!';
        }
    }
}

function proceedFromLockScreen(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Only proceed if unlocked
    if (!AppState.isUnlocked) {
        // Shake the countdown to indicate it's still locked
        const container = document.querySelector('.lock-countdown-container');
        if (container) {
            container.classList.add('shake');
            setTimeout(() => container.classList.remove('shake'), 500);
        }
        return;
    }
    
    // Proceed to intro
    if (AppState.currentScreen === 'lock') {
        transitionToScreen('intro', 500);
    }
}

/* =====================================================
   SCREEN MANAGEMENT
   ===================================================== */

function showScreen(screenName) {
    console.log('Showing screen:', screenName);
    
    // Hide all screens
    Object.values(DOM.screens).forEach(screen => {
        if (screen) {
            screen.classList.remove('active');
        }
    });
    
    // Show target screen
    const targetScreen = DOM.screens[screenName];
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenName;
        console.log('Screen activated:', screenName);
    } else {
        console.error('Screen not found:', screenName);
    }
}

function transitionToScreen(screenName, delay = 500) {
    console.log('Transitioning to:', screenName, 'isAnimating:', AppState.isAnimating);
    
    if (AppState.isAnimating) return;
    AppState.isAnimating = true;
    
    const currentScreen = DOM.screens[AppState.currentScreen];
    
    // Fade out current
    if (currentScreen) {
        currentScreen.classList.add('fade-out');
    }
    
    setTimeout(() => {
        // Reset isAnimating BEFORE showing screen
        AppState.isAnimating = false;
        
        showScreen(screenName);
        
        const newScreen = DOM.screens[screenName];
        if (newScreen) {
            newScreen.classList.add('fade-in');
            setTimeout(() => {
                newScreen.classList.remove('fade-in');
            }, 500);
        }
        
        if (currentScreen) {
            currentScreen.classList.remove('fade-out');
        }
        
        // Trigger screen-specific animations
        onScreenEnter(screenName);
    }, delay);
}

function onScreenEnter(screenName) {
    switch (screenName) {
        case 'owl':
            startOwlAnimation();
            break;
        case 'letter-sealed':
            showEnvelopeAnimation();
            break;
        case 'letter-content':
            revealLetterContent();
            break;
        case 'countdown':
            startCelebration();
            break;
    }
}

/* =====================================================
   EXPERIENCE FLOW
   ===================================================== */

function startExperience(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Evita doppi click
    if (AppState.currentScreen !== 'intro' || AppState.isAnimating) return;
    
    console.log('Starting experience...');
    
    // Start audio on first user interaction
    if (!AppState.audioStarted) {
        audioManager.playTrack('hedwigsTheme', { volume: 0.4 });
        AppState.audioStarted = true;
    }
    
    // Emit magic particles
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    particleSystem.emitBurst(centerX, centerY, 'sparkle', 20);
    audioManager.playSfx('magic-chime');
    
    // Transition to owl screen
    transitionToScreen('owl', 800);
}

function startOwlAnimation() {
    const owl = DOM.owl;
    if (!owl) return;
    
    // Play whoosh sound
    audioManager.playSfx('whoosh');
    
    // Start flight animation
    owl.classList.add('flying');
    
    // Create sparkle trail during flight
    let trailInterval = setInterval(() => {
        const rect = owl.getBoundingClientRect();
        particleSystem.emitMagicTrail(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }, 100);
    
    // After flight animation completes
    setTimeout(() => {
        clearInterval(trailInterval);
        owl.classList.remove('flying');
        owl.classList.add('landed');
        
        // Emit landing particles
        const rect = owl.getBoundingClientRect();
        particleSystem.emitBurst(rect.left + rect.width / 2, rect.top + rect.height, 'dust', 15);
        
        // Wait then transition to sealed letter
        setTimeout(() => {
            transitionToScreen('letter-sealed', 800);
        }, 1500);
    }, 3500);
}

function showEnvelopeAnimation() {
    const envelope = document.querySelector('.envelope');
    if (envelope) {
        envelope.classList.add('dropping');
        audioManager.playSfx('whoosh');
        
        setTimeout(() => {
            envelope.classList.remove('dropping');
            envelope.classList.add('waiting');
        }, 1000);
    }
    
    // Change music
    audioManager.crossfadeTo('magicalAmbience', 2000);
}

function breakSeal(e) {
    if (e) e.preventDefault();
    
    const seal = DOM.waxSeal;
    if (!seal || seal.classList.contains('breaking')) return;
    
    // Play break sound
    audioManager.playSfx('seal-break');
    audioManager.vibrate([100, 50, 100]);
    
    // Emit particles from seal
    const rect = seal.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    particleSystem.emitBurst(centerX, centerY, 'sparkle', 30);
    particleSystem.emit(centerX, centerY, 'dust', 20);
    
    // Animate seal breaking
    seal.classList.add('breaking');
    
    // Transition to letter content
    setTimeout(() => {
        transitionToScreen('letter-content', 500);
    }, 600);
}

function revealLetterContent() {
    const parchment = document.querySelector('.parchment');
    const letterBody = document.querySelector('.letter-body');
    const restaurantReveal = document.querySelector('.restaurant-reveal');
    
    if (parchment) {
        parchment.classList.add('unfolding');
    }
    
    // Reveal letter body with animation
    setTimeout(() => {
        if (letterBody) {
            letterBody.classList.add('revealing');
        }
    }, 1000);
    
    // Special animation for restaurant reveal
    setTimeout(() => {
        if (restaurantReveal) {
            restaurantReveal.classList.add('revealing');
            
            // Emit celebration particles
            const rect = restaurantReveal.getBoundingClientRect();
            particleSystem.emit(rect.left + rect.width / 2, rect.top, 'star', 10);
        }
        
        audioManager.playSfx('magic-chime');
    }, 3000);
}

function goToCountdown() {
    audioManager.playSfx('celebration');
    transitionToScreen('countdown', 500);
}

function startCelebration() {
    // Change to celebration music
    audioManager.crossfadeTo('celebration', 1500);
    
    // Light candles sequentially
    lightCandles();
    
    // Emit celebration particles
    setTimeout(() => {
        particleSystem.emitCelebration();
    }, 500);
}

function restartExperience() {
    // Reset all animations
    document.querySelectorAll('.flying, .landed, .breaking, .dropping, .waiting, .unfolding, .revealing')
        .forEach(el => {
            el.classList.remove('flying', 'landed', 'breaking', 'dropping', 'waiting', 'unfolding', 'revealing');
        });
    
    // Reset candles
    document.querySelectorAll('.candle-flame.lit').forEach(flame => {
        flame.classList.remove('lit');
    });
    
    // Clear particles
    particleSystem.clear();
    
    // Go back to intro
    transitionToScreen('intro', 500);
    
    // Reset audio
    audioManager.crossfadeTo('hedwigsTheme', 1000);
}

/* =====================================================
   AUDIO CONTROL
   ===================================================== */

function toggleAudio() {
    const isMuted = audioManager.toggleMute();
    
    if (DOM.audioIcon) {
        DOM.audioIcon.textContent = isMuted ? '🔇' : '🔊';
    }
    
    DOM.audioToggle?.classList.toggle('playing', !isMuted);
}

/* =====================================================
   COUNTDOWN
   ===================================================== */

function startCountdown() {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function updateCountdown() {
    const now = new Date();
    const timeLeft = DINNER_DATE - now;
    
    if (timeLeft <= 0) {
        // Countdown finished!
        displayTime(0, 0, 0);
        showCountdownFinished();
        return;
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    displayTime(hours, minutes, seconds);
    
    // Add pulse effect in last minute
    const countdownTimer = document.querySelector('.countdown-timer');
    if (timeLeft < 60000 && countdownTimer) {
        countdownTimer.classList.add('final');
    }
}

function displayTime(hours, minutes, seconds) {
    if (DOM.countdown.hours) {
        DOM.countdown.hours.textContent = String(hours).padStart(2, '0');
    }
    if (DOM.countdown.minutes) {
        DOM.countdown.minutes.textContent = String(minutes).padStart(2, '0');
    }
    if (DOM.countdown.seconds) {
        DOM.countdown.seconds.textContent = String(seconds).padStart(2, '0');
    }
}

function showCountdownFinished() {
    const countdownLabel = document.querySelector('.countdown-label');
    if (countdownLabel) {
        countdownLabel.textContent = '✨ È ora di andare! ✨';
    }
    
    // Celebration effects
    particleSystem.emitCelebration();
    audioManager.playSfx('celebration');
}

/* =====================================================
   CANDLES
   ===================================================== */

function generateCandles() {
    const container = DOM.candlesContainer;
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= 24; i++) {
        const candle = document.createElement('div');
        candle.className = 'candle';
        candle.dataset.number = i;
        candle.innerHTML = `
            <div class="candle-body">
                <div class="candle-flame"></div>
            </div>
            <span class="candle-number">${i}</span>
        `;
        container.appendChild(candle);
    }
}

function lightCandles() {
    const candles = document.querySelectorAll('.candle');
    
    candles.forEach((candle, index) => {
        setTimeout(() => {
            const flame = candle.querySelector('.candle-flame');
            if (flame) {
                flame.classList.add('lit');
                candle.classList.add('lighting');
                
                // Play candle light sound
                audioManager.playSfx('candle-light');
                
                // Emit small sparkle
                const rect = candle.getBoundingClientRect();
                particleSystem.emit(
                    rect.left + rect.width / 2,
                    rect.top,
                    'sparkle',
                    3
                );
            }
        }, index * 150); // 150ms between each candle
    });
}

/* =====================================================
   UTILITY FUNCTIONS
   ===================================================== */

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if device supports touch
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Preload critical images
function preloadImages(urls) {
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// Handle visibility change (pause/resume)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden - could pause animations
    } else {
        // Page is visible again
        updateCountdown();
    }
});

// Export for debugging
window.AppState = AppState;
window.audioManager = audioManager;
window.particleSystem = particleSystem;
