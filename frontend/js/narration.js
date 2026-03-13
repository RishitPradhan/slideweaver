/**
 * Narration Layer using Web Speech API
 * Pure JavaScript implementation - no dependencies.
 */

(function() {
    // Configuration object
    window.narrationConfig = {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voiceName: null // or a specific voice name string
    };

    let voices = [];

    /**
     * Initializes voices from the browser.
     */
    function initVoices() {
        voices = window.speechSynthesis.getVoices();
        if (voices.length > 0 && !window.narrationConfig.voiceName) {
            // Pick a default if not set
            const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            window.narrationConfig.voiceName = defaultVoice.name;
        }
    }

    // voiceschanged event for asynchronous voice loading
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = initVoices;
    }
    
    // Initial call in case they are already loaded
    initVoices();

    /**
     * Stops any currently playing narration.
     */
    window.stopNarration = function() {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }
    };

    /**
     * Starts narration with the provided text.
     * @param {string} text - The text to narrate.
     */
    window.startNarration = function(text) {
        if (!text) return;

        // Stop current speech
        window.stopNarration();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply configuration
        utterance.rate = window.narrationConfig.rate;
        utterance.pitch = window.narrationConfig.pitch;
        utterance.volume = window.narrationConfig.volume;

        // Find the configured voice
        if (window.narrationConfig.voiceName) {
            const selectedVoice = voices.find(v => v.name === window.narrationConfig.voiceName);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        window.speechSynthesis.speak(utterance);
    };

    /**
     * Narrates the text content of a specific element.
     * @param {string} elementId - The ID of the element to narrate.
     */
    window.narrateElement = function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const text = element.innerText || element.textContent;
            window.startNarration(text);
        } else {
            console.warn(`Element with ID "${elementId}" not found for narration.`);
        }
    };

    console.log("Narration layer initialized. Available functions: startNarration(text), stopNarration(), narrateElement(elementId)");
})();
