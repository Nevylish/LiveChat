/**
 * Synthesizes and plays notification sounds using the Web Audio API.
 *
 * @param type Sound preset type: 'chime', 'arcade', 'success', or default (ping)
 * @param volume Output volume level (0 to 100)
 */
export const playSynthSound = (type: string, volume: number): void => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(volume / 100, audioCtx.currentTime);
        gainNode.connect(audioCtx.destination);

        if (type === 'chime') {
            const freqs = [523.25, 659.25, 783.99];
            freqs.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.06);
                osc.connect(noteGain);
                noteGain.connect(gainNode);
                const startTime = audioCtx.currentTime + i * 0.06;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(volume / 100, startTime + 0.02);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
                osc.start(startTime);
                osc.stop(startTime + 0.6);
            });
        } else if (type === 'arcade') {
            const notes = [440, 659.25];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.09);
                osc.connect(noteGain);
                noteGain.connect(gainNode);
                const startTime = audioCtx.currentTime + i * 0.09;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime((volume / 100) * 0.5, startTime + 0.005);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
                osc.start(startTime);
                osc.stop(startTime + 0.12);
            });
        } else if (type === 'success') {
            const notes = [659.25, 987.77];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
                osc.connect(noteGain);
                noteGain.connect(gainNode);
                const startTime = audioCtx.currentTime + i * 0.1;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(volume / 100, startTime + 0.015);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
                osc.start(startTime);
                osc.stop(startTime + 0.25);
            });
        } else {
            const notes = [466.16, 587.33];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const noteGain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.1);
                osc.connect(noteGain);
                noteGain.connect(gainNode);
                const startTime = audioCtx.currentTime + i * 0.1;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(volume / 100, startTime + 0.015);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
                osc.start(startTime);
                osc.stop(startTime + 0.35);
            });
        }
    } catch (e) {
        console.error('Failed to play synth sound:', e);
    }
};
