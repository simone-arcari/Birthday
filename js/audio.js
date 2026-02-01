/* =====================================================
   AUDIO.JS - Magical Audio Manager for Serena's Birthday
   Harry Potter Theme Music and Sound Effects
   ===================================================== */

class MagicalAudioManager {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.isMuted = true; // Start muted
        this.volume = 0.5;
        this.currentTrack = null;
        this.tracks = {};
        this.sfx = {};
        
        // Audio URLs - Using royalty-free alternatives and CDN sources
        this.trackUrls = {
            // Background music
            hedwigsTheme: 'https://cdn.pixabay.com/audio/2022/10/25/audio_032a7fde90.mp3', // Magical piano
            magicalAmbience: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8f1c8e1c87.mp3', // Fantasy ambience
            celebration: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3' // Celebration
        };
        
        this.init();
    }
    
    async init() {
        // Create audio context on user interaction (required for mobile)
        this.setupAudioContext();
        this.preloadTracks();
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    async preloadTracks() {
        for (const [name, url] of Object.entries(this.trackUrls)) {
            try {
                const audio = new Audio();
                audio.preload = 'metadata';
                audio.src = url;
                audio.loop = true;
                audio.volume = 0;
                this.tracks[name] = audio;
            } catch (e) {
                console.warn(`Failed to preload ${name}:`, e);
            }
        }
    }
    
    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    async playTrack(trackName, options = {}) {
        const { 
            volume = this.volume, 
            fadeIn = true, 
            fadeInDuration = 2000,
            loop = true 
        } = options;
        
        await this.resumeContext();
        
        const track = this.tracks[trackName];
        if (!track) {
            console.warn(`Track ${trackName} not found`);
            return;
        }
        
        // Stop current track with fade
        if (this.currentTrack && this.currentTrack !== track) {
            await this.fadeOut(this.currentTrack, 1000);
        }
        
        track.loop = loop;
        track.currentTime = 0;
        
        if (this.isMuted) {
            track.volume = 0;
        } else if (fadeIn) {
            track.volume = 0;
            this.fadeIn(track, volume, fadeInDuration);
        } else {
            track.volume = volume;
        }
        
        try {
            await track.play();
            this.currentTrack = track;
            this.isPlaying = true;
        } catch (e) {
            console.warn('Autoplay blocked:', e);
        }
    }
    
    fadeIn(audio, targetVolume, duration) {
        const startVolume = 0;
        const volumeStep = (targetVolume - startVolume) / (duration / 50);
        let currentVolume = startVolume;
        
        const fadeInterval = setInterval(() => {
            currentVolume += volumeStep;
            if (currentVolume >= targetVolume || this.isMuted) {
                audio.volume = this.isMuted ? 0 : targetVolume;
                clearInterval(fadeInterval);
            } else {
                audio.volume = this.isMuted ? 0 : currentVolume;
            }
        }, 50);
    }
    
    async fadeOut(audio, duration) {
        return new Promise((resolve) => {
            const startVolume = audio.volume;
            const volumeStep = startVolume / (duration / 50);
            let currentVolume = startVolume;
            
            const fadeInterval = setInterval(() => {
                currentVolume -= volumeStep;
                if (currentVolume <= 0) {
                    audio.volume = 0;
                    audio.pause();
                    clearInterval(fadeInterval);
                    resolve();
                } else {
                    audio.volume = currentVolume;
                }
            }, 50);
        });
    }
    
    async crossfadeTo(trackName, duration = 2000) {
        const newTrack = this.tracks[trackName];
        if (!newTrack) return;
        
        if (this.currentTrack) {
            // Start new track quietly
            newTrack.volume = 0;
            newTrack.currentTime = 0;
            await newTrack.play().catch(() => {});
            
            // Crossfade
            const fadePromise = this.fadeOut(this.currentTrack, duration);
            this.fadeIn(newTrack, this.isMuted ? 0 : this.volume, duration);
            await fadePromise;
        } else {
            await this.playTrack(trackName);
        }
        
        this.currentTrack = newTrack;
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.currentTrack) {
            if (this.isMuted) {
                this.currentTrack.volume = 0;
            } else {
                this.fadeIn(this.currentTrack, this.volume, 500);
            }
        }
        
        return this.isMuted;
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.currentTrack && !this.isMuted) {
            this.currentTrack.volume = this.volume;
        }
    }
    
    // Play a one-shot sound effect
    async playSfx(type) {
        // Create simple oscillator-based SFX for reliability
        if (!this.audioContext) return;
        
        await this.resumeContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const sfxVolume = this.isMuted ? 0 : 0.3;
        
        switch (type) {
            case 'seal-break':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(sfxVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
                break;
                
            case 'magic-chime':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5
                gainNode.gain.setValueAtTime(sfxVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
                
            case 'candle-light':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1000 + Math.random() * 500, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(sfxVolume * 0.5, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
                
            case 'whoosh':
                const noise = this.audioContext.createBufferSource();
                const bufferSize = this.audioContext.sampleRate * 0.5;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
                
                const noiseGain = this.audioContext.createGain();
                noiseGain.gain.setValueAtTime(sfxVolume, this.audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                
                noise.connect(filter);
                filter.connect(noiseGain);
                noiseGain.connect(this.audioContext.destination);
                noise.start();
                break;
                
            case 'celebration':
                // Play multiple notes for celebration
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        osc.connect(gain);
                        gain.connect(this.audioContext.destination);
                        osc.type = 'sine';
                        osc.frequency.value = 400 + i * 100 + Math.random() * 200;
                        gain.gain.setValueAtTime(sfxVolume * 0.5, this.audioContext.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                        osc.start();
                        osc.stop(this.audioContext.currentTime + 0.3);
                    }, i * 100);
                }
                break;
        }
    }
    
    // Vibration feedback for mobile (when audio is muted)
    vibrate(pattern = [50]) {
        if (this.isMuted && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    stop() {
        if (this.currentTrack) {
            this.currentTrack.pause();
            this.currentTrack.currentTime = 0;
        }
        this.isPlaying = false;
    }
    
    // Get audio state for UI
    getState() {
        return {
            isPlaying: this.isPlaying,
            isMuted: this.isMuted,
            volume: this.volume,
            currentTrack: this.currentTrack ? true : false
        };
    }
}

// Export for use in main.js
window.MagicalAudioManager = MagicalAudioManager;
