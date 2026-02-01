/* =====================================================
   AUDIO.JS - Magical Audio Manager for Serena's Birthday
   Harry Potter Theme Music and Sound Effects
   ===================================================== */

class MagicalAudioManager {
    constructor() {
        this.sounds = {};
        this.backgroundMusic = null;
        this.isMuted = true;  // Inizia muted - l'utente deve attivare
        this.isLoaded = false;
        this.volume = 0.4;
        this.audioContext = null;
        
        this.init();
    }

    init() {
        // Setup Web Audio API per effetti sonori generati
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
        
        // Musica di sottofondo - stile magico/fantasy orchestrale
        // Kevin MacLeod (incompetech.com) - Royalty Free, stile Harry Potter
        this.musicSources = {
            // "Enchanted Valley" - atmosfera magica con archi e flauti
            hedwigsTheme: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Enchanted%20Valley.mp3',
            // "Ghost Story" - misterioso e incantato
            magicalAmbience: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ghost%20Story.mp3',
            // "Merry Go" - festoso e celebrativo
            celebration: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Merry%20Go.mp3'
        };
        
        this.preloadMusic();
    }

    preloadMusic() {
        // Precarica musica di sottofondo
        Object.entries(this.musicSources).forEach(([name, url]) => {
            const audio = new Audio();
            audio.src = url;
            audio.volume = this.volume;
            audio.loop = true;
            audio.preload = 'auto';
            this.sounds[name] = audio;
            
            audio.addEventListener('canplaythrough', () => {
                console.log('Audio pronto:', name);
            });
            
            audio.addEventListener('error', (e) => {
                console.error('Errore caricamento audio:', name, e);
            });
        });
        
        this.backgroundMusic = this.sounds.hedwigsTheme;
        this.isLoaded = true;
        console.log('Audio manager inizializzato');
    }

    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    async playTrack(trackName, options = {}) {
        const { volume = this.volume, fadeIn = true } = options;
        
        await this.resumeContext();
        
        const track = this.sounds[trackName];
        if (!track) {
            console.warn('Track non trovata:', trackName);
            return;
        }
        
        // Ferma la musica attuale
        if (this.backgroundMusic && this.backgroundMusic !== track) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        
        track.volume = this.isMuted ? 0 : volume;
        this.backgroundMusic = track;
        
        console.log('Tentativo riproduzione:', trackName, 'volume:', track.volume, 'muted:', this.isMuted);
        
        try {
            const playPromise = track.play();
            if (playPromise !== undefined) {
                await playPromise;
                console.log('✅ Riproduzione avviata:', trackName);
            }
        } catch (e) {
            console.error('❌ Errore riproduzione:', e.name, e.message);
            // Se autoplay è bloccato, mostra un messaggio
            if (e.name === 'NotAllowedError') {
                console.log('Autoplay bloccato dal browser. Clicca di nuovo per avviare la musica.');
            }
        }
    }

    async crossfadeTo(trackName, duration = 2000) {
        const newTrack = this.sounds[trackName];
        if (!newTrack) return;
        
        const oldTrack = this.backgroundMusic;
        
        if (oldTrack && oldTrack !== newTrack) {
            // Fade out old track
            this.fadeOut(oldTrack, duration);
        }
        
        // Start and fade in new track
        newTrack.volume = 0;
        newTrack.currentTime = 0;
        
        try {
            await newTrack.play();
            this.fadeIn(newTrack, this.isMuted ? 0 : this.volume, duration);
            this.backgroundMusic = newTrack;
        } catch (e) {
            console.warn('Crossfade fallito:', e);
        }
    }

    fadeIn(audio, targetVolume, duration) {
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = targetVolume / steps;
        let currentVolume = 0;
        
        const fadeInterval = setInterval(() => {
            currentVolume += volumeStep;
            if (currentVolume >= targetVolume) {
                audio.volume = this.isMuted ? 0 : targetVolume;
                clearInterval(fadeInterval);
            } else {
                audio.volume = this.isMuted ? 0 : currentVolume;
            }
        }, stepTime);
    }

    fadeOut(audio, duration) {
        const steps = 20;
        const stepTime = duration / steps;
        const startVolume = audio.volume;
        const volumeStep = startVolume / steps;
        let currentVolume = startVolume;
        
        const fadeInterval = setInterval(() => {
            currentVolume -= volumeStep;
            if (currentVolume <= 0) {
                audio.volume = 0;
                audio.pause();
                clearInterval(fadeInterval);
            } else {
                audio.volume = currentVolume;
            }
        }, stepTime);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.isMuted ? 0 : this.volume;
        }
        
        return this.isMuted;
    }

    // Genera effetti sonori con Web Audio API
    async playSfx(type) {
        if (this.isMuted || !this.audioContext) return;
        
        await this.resumeContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const now = this.audioContext.currentTime;
        
        switch (type) {
            case 'magic-chime':
                // Suono magico di campana
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, now); // C5
                oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, now + 0.2); // G5
                oscillator.frequency.setValueAtTime(1047, now + 0.3); // C6
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                oscillator.start(now);
                oscillator.stop(now + 0.8);
                break;
                
            case 'seal-break':
                // Suono di rottura
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gainNode.gain.setValueAtTime(0.4, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                
                // Aggiungi un "crack"
                setTimeout(() => this.playNoise(0.1), 50);
                break;
                
            case 'whoosh':
                // Suono di vento/volo
                this.playNoise(0.5, 'bandpass', 800, 100);
                break;
                
            case 'candle-light':
                // Suono accensione candela
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800 + Math.random() * 400, now);
                oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
                gainNode.gain.setValueAtTime(0.15, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
                
            case 'celebration':
                // Suono di festa
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(this.audioContext.destination);
                        osc.type = 'sine';
                        osc.frequency.value = 400 + i * 150 + Math.random() * 100;
                        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                        osc.start();
                        osc.stop(this.audioContext.currentTime + 0.4);
                    }, i * 80);
                }
                break;
                
            default:
                // Suono generico
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, now);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
        }
    }

    // Genera rumore per effetti speciali
    playNoise(duration, filterType = 'lowpass', startFreq = 1000, endFreq = 100) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        noise.start();
    }

    // Vibrazione per feedback tattile (mobile)
    vibrate(pattern = [50]) {
        if (this.isMuted && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    stop() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        if (this.backgroundMusic && !this.isMuted) {
            this.backgroundMusic.volume = this.volume;
        }
    }
}

// Export per uso globale
window.MagicalAudioManager = MagicalAudioManager;
