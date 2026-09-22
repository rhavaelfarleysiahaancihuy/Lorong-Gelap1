/**
 * Lorong Gelap - Cinematic Procedural Horror Audio System
 * Uses Web Audio API with a Master Dynamics Compressor to synthesize:
 * - Dissonant Dark Ambient Music & Sinister Drones (Tritones & Minor 2nd Clashes)
 * - Haunting Music Box melody fragments (Creepy childhood echoes)
 * - Spectral Whispers and Breath sweeps
 * - Deep Cinematic Sub-Bass Tension Pulse
 * - Realistic Footsteps, Flashlight relay clicks, Key jingles
 * - Dynamic Proximity Heartbeat & Monster Screeches
 * - Violent Jumpscare cluster strikes
 */
class HorrorAudioSystem {
    constructor() {
        this.ctx = null;
        this.isInitialized = false;
        this.masterCompressor = null;
        this.musicGain = null;
        this.sfxGain = null;

        // Music Box timing
        this.musicBoxTimer = 4.0; // Starts shortly after game begins

        // Ghostly breath / spectral whisper timing
        this.whisperTimer = 8.0;

        // Random creepy horror sting timing
        this.stingTimer = 14.0;

        // Tension pulse timer
        this.pulseTimer = 0;

        // Heartbeat state
        this.heartbeatTimer = 0;
    }

    init() {
        if (this.isInitialized) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.isInitialized = true;

        // Master Dynamics Compressor to prevent clipping and give rich cinematic horror depth
        this.masterCompressor = this.ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        this.masterCompressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);
        this.masterCompressor.connect(this.ctx.destination);

        // Music bus (horror ambient drone, pads, music box)
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
        this.musicGain.connect(this.masterCompressor);

        // SFX bus (footsteps, keys, monster, jumpscare)
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.sfxGain.connect(this.masterCompressor);

        // Start continuous dark cinematic layers
        this.startSinisterDrones();
        this.startHowlingWind();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Layer 1: Sinister Dissonant Drone (Deep C# Minor / D Minor Cluster Clash)
    startSinisterDrones() {
        if (!this.ctx) return;
        try {
            // Frequencies of dissonant horror cluster: C#1, D1, G#1 (tritone clash)
            const clusterFreqs = [34.65, 36.71, 51.91, 73.42, 110.0];

            clusterFreqs.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

                // Slight detuning LFO for sickening pitch instability
                const detuneLfo = this.ctx.createOscillator();
                detuneLfo.frequency.setValueAtTime(0.1 + idx * 0.04, this.ctx.currentTime);
                const detuneGain = this.ctx.createGain();
                detuneGain.gain.setValueAtTime(2.8 + idx * 0.8, this.ctx.currentTime);
                detuneLfo.connect(detuneGain);
                detuneGain.connect(osc.frequency);

                // Resonant lowpass filter
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(110 + idx * 25, this.ctx.currentTime);
                filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

                // Filter breathing LFO
                const filterLfo = this.ctx.createOscillator();
                filterLfo.frequency.setValueAtTime(0.06 + idx * 0.02, this.ctx.currentTime);
                const filterLfoGain = this.ctx.createGain();
                filterLfoGain.gain.setValueAtTime(35, this.ctx.currentTime);
                filterLfo.connect(filterLfoGain);
                filterLfoGain.connect(filter.frequency);

                const voiceGain = this.ctx.createGain();
                voiceGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

                osc.connect(filter);
                filter.connect(voiceGain);
                voiceGain.connect(this.musicGain);

                osc.start();
                detuneLfo.start();
                filterLfo.start();
            });

            // High Dissonant "Waterphone" Violin Tremolo (Eerie high horror string)
            this.startHorrorStrings();
        } catch (e) {
            console.warn("Horror drone init failed:", e);
        }
    }

    // Layer 2: High Dissonant Bowed Horror Strings (like The Shining / Silent Hill)
    startHorrorStrings() {
        if (!this.ctx) return;
        const stringFreqs = [587.33, 622.25]; // D5 and D#5 (grating minor 2nd clash)

        stringFreqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            // Shivering Vibrato / Tremolo LFO
            const vibLfo = this.ctx.createOscillator();
            vibLfo.frequency.setValueAtTime(5.8 + idx * 0.5, this.ctx.currentTime);
            const vibGain = this.ctx.createGain();
            vibGain.gain.setValueAtTime(14, this.ctx.currentTime);
            vibLfo.connect(vibGain);
            vibGain.connect(osc.frequency);

            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(freq, this.ctx.currentTime);
            bandpass.Q.setValueAtTime(5.0, this.ctx.currentTime);

            const stringGain = this.ctx.createGain();
            stringGain.gain.setValueAtTime(0.045, this.ctx.currentTime);

            // Slow swelling LFO so it fades in and out hauntingly
            const swellLfo = this.ctx.createOscillator();
            swellLfo.frequency.setValueAtTime(0.09, this.ctx.currentTime);
            const swellGain = this.ctx.createGain();
            swellGain.gain.setValueAtTime(0.035, this.ctx.currentTime);
            swellLfo.connect(swellGain);
            swellGain.connect(stringGain.gain);

            osc.connect(bandpass);
            bandpass.connect(stringGain);
            stringGain.connect(this.musicGain);

            osc.start();
            vibLfo.start();
            swellLfo.start();
        });
    }

    // Layer 3: Creepy Howling Wind & Ghostly Air Noise
    startHowlingWind() {
        if (!this.ctx) return;
        const bufferSize = 3 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(320, this.ctx.currentTime);
        bandpass.Q.setValueAtTime(3.5, this.ctx.currentTime);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

        // Wind pitch modulation
        const windLfo = this.ctx.createOscillator();
        windLfo.frequency.setValueAtTime(0.14, this.ctx.currentTime);
        const windLfoGain = this.ctx.createGain();
        windLfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
        windLfo.connect(windLfoGain);
        windLfoGain.connect(bandpass.frequency);

        whiteNoise.connect(bandpass);
        bandpass.connect(noiseGain);
        noiseGain.connect(this.musicGain);

        whiteNoise.start();
        windLfo.start();
    }

    // Dramatic Event 1: Haunted Music Box Melodies in the Dark
    playHauntedMusicBox() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // A spooky, melancholic nursery melody in D Minor (D5, F5, A5, G#5, F5, D5)
        const notes = [
            { freq: 587.33, delay: 0.0 },   // D5
            { freq: 698.46, delay: 0.7 },   // F5
            { freq: 880.00, delay: 1.4 },   // A5
            { freq: 830.61, delay: 2.1 },   // G#5 (Spooky tritone!)
            { freq: 698.46, delay: 2.9 },   // F5
            { freq: 587.33, delay: 3.7 }    // D5
        ];

        notes.forEach(note => {
            const time = now + note.delay;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Slight detune for antique, decaying music box tine feel
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq + (Math.random() * 4 - 2), time);

            // Subtle harmonic chime
            const harmonic = this.ctx.createOscillator();
            harmonic.type = 'triangle';
            harmonic.frequency.setValueAtTime(note.freq * 2, time);
            const harmGain = this.ctx.createGain();
            harmGain.gain.setValueAtTime(0.03, time);
            harmGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

            gain.gain.setValueAtTime(0.09, time);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

            osc.connect(gain);
            harmonic.connect(harmGain);
            harmGain.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            harmonic.start(time);
            osc.stop(time + 1.9);
            harmonic.stop(time + 0.7);
        });
    }

    // Dramatic Event 2: Spectral Whisper / Ghostly Sigh
    playGhostlyWhisper() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 1.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.linearRampToValueAtTime(450, now + 1.4);
        filter.Q.setValueAtTime(6.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        source.start(now);
    }

    // Dramatic Event 3: Ominous Piano / Orchestral Low Braam Strike
    playOrchestralHit() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Low cluster impact (D1, D#1, A1)
        const freqs = [36.71, 38.89, 55.0];
        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + 2.5);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(now);
            osc.stop(now + 2.7);
        });
    }

    // Footstep Sound
    playFootstep(isRunning = false) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        const baseFreq = isRunning ? 75 : 60;
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 15, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, now);

        const vol = isRunning ? 0.35 : 0.2;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isRunning ? 0.14 : 0.18));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.2);

        if (Math.random() > 0.4) {
            this.playFloorScrape();
        }
    }

    playFloorScrape() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1800, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
    }

    // Flashlight Toggle Switch Click
    playFlashlightSwitch() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    // Pick up Key metallic jingle
    playKeyPickup() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [880, 1174, 1567, 1760];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.25, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.5);
        });
    }

    // Battery Pickup Electric Buzz & Chime
    playBatteryPickup() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.15);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Door Unlock & Creak
    playDoorUnlock() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.4);

        setTimeout(() => {
            if (!this.ctx) return;
            const t = this.ctx.currentTime;
            const creakOsc = this.ctx.createOscillator();
            const creakGain = this.ctx.createGain();
            creakOsc.type = 'sawtooth';
            creakOsc.frequency.setValueAtTime(90, t);
            creakOsc.frequency.linearRampToValueAtTime(160, t + 0.6);

            creakGain.gain.setValueAtTime(0.15, t);
            creakGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

            creakOsc.connect(creakGain);
            creakGain.connect(this.sfxGain);
            creakOsc.start(t);
            creakOsc.stop(t + 0.75);
        }, 200);
    }

    playDoorLocked() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.setValueAtTime(95, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    // Light Bulb Buzz and Flicker
    playLightFlicker() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100 + Math.random() * 50, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    // Heartbeat Sound (Accelerates as monster closes in)
    triggerHeartbeat(intensity = 0.5) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const playThump = (timeOffset, volume, pitch) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(pitch, now + timeOffset);
            osc.frequency.exponentialRampToValueAtTime(30, now + timeOffset + 0.12);

            gain.gain.setValueAtTime(volume * intensity, now + timeOffset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.14);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + 0.16);
        };

        playThump(0, 0.55, 70);
        playThump(0.14, 0.42, 60);
    }

    // Monster Growl / Screech when chasing
    playMonsterRoar() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(75, now);
        osc.frequency.linearRampToValueAtTime(260, now + 0.35);
        osc.frequency.exponentialRampToValueAtTime(50, now + 1.3);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420, now);
        filter.Q.setValueAtTime(7.0, now);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 1.4);
    }

    // Bloodcurdling Jumpscare Sound
    playJumpscare() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Harsh cluster chord
        const freqs = [185, 233, 293, 370, 440, 880, 1318];
        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq + (Math.random() * 20 - 10), now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 1.6);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 1.9);
        });

        // Deep explosive sub impact
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(130, now);
        sub.frequency.exponentialRampToValueAtTime(22, now + 0.85);
        subGain.gain.setValueAtTime(0.85, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + 1.0);
    }

    // Victory escaped chord progression
    playVictory() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const chords = [
            [261.63, 329.63, 392.00], // C
            [293.66, 349.23, 440.00], // Dm
            [329.63, 392.00, 493.88], // Em
            [349.23, 440.00, 523.25], // F
            [392.00, 493.88, 587.33], // G
            [523.25, 659.25, 783.99]  // C high
        ];

        chords.forEach((chord, chordIdx) => {
            const time = now + chordIdx * 0.6;
            chord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);

                gain.gain.setValueAtTime(0.12, time);
                gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.9);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(time);
                osc.stop(time + 0.95);
            });
        });
    }

    // Update loop for periodic horror events (music box, ghostly whisper, orchestral hits)
    update(delta) {
        if (!this.ctx || this.ctx.state !== 'running') return;

        // 1. Haunted Music Box melody (every 16 - 24 seconds)
        this.musicBoxTimer -= delta;
        if (this.musicBoxTimer <= 0) {
            this.musicBoxTimer = 16 + Math.random() * 10;
            this.playHauntedMusicBox();
        }

        // 2. Ghostly whisper / breathing (every 10 - 18 seconds)
        this.whisperTimer -= delta;
        if (this.whisperTimer <= 0) {
            this.whisperTimer = 10 + Math.random() * 12;
            this.playGhostlyWhisper();
        }

        // 3. Random orchestral hit / pipe clangs (every 15 - 25 seconds)
        this.stingTimer -= delta;
        if (this.stingTimer <= 0) {
            this.stingTimer = 15 + Math.random() * 14;
            if (Math.random() < 0.5) {
                this.playOrchestralHit();
            } else {
                this.playDistantPipeClang();
            }
        }
    }

    playDistantPipeClang() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380 + Math.random() * 150, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.9);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 1.05);
    }

    checkRandomHorrorSound(delta) {
        this.update(delta);
    }
}

// Global horror audio instance
window.horrorAudio = new HorrorAudioSystem();
