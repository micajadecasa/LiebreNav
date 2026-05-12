let muted = false;

export function speak(text) {
    if (muted || localStorage.getItem('pref-voice') === 'false') return;
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
}

export function toggleMute() {
    muted = !muted;
    return muted;
}
