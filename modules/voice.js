export function speak(text) {
    if (!localStorage.getItem('pref-voice') || localStorage.getItem('pref-voice') === 'false') return;
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}
