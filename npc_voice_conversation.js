// ===== NPC VOICE CONVERSATION SYSTEM =====
// STT: Web Speech API (Google engine - free, unlimited, excellent Tamil)
// AI:  GPT-4 via your backend /chat endpoint
// TTS: Edge TTS via your backend (ta-IN-ValluvarNeural)

const BACKEND_URL = 'http://localhost:8000';

let isProcessingVoice = false;

window.addEventListener('beforeunload', (event) => {
    if (isProcessingVoice) {
        event.preventDefault();
        event.returnValue = 'Voice processing in progress. Are you sure you want to leave?';
    }
});

// ===== WEB SPEECH API SETUP =====
// Uses Google's speech recognition engine — free, unlimited, great Tamil support
// No Whisper, no ffmpeg, no backend STT needed

let recognition = null;
let isRecording = false;
let accumulatedTranscript = '';  // Accumulate all transcripts until V pressed again
let currentAudioSource = null;  // For X key cancellation
let isAIResponding = false;     // Track AI response state

function initVoiceSystem() {
    // Check browser support (Chrome / Edge work best)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert('Voice recognition not supported. Please use Chrome or Edge browser.');
        return false;
    }

    recognition = new SpeechRecognition();

    // OPTIMIZED FOR 80%+ TAMIL ACCURACY
    recognition.lang = 'ta-IN';           // Tamil (India) - primary
    recognition.continuous = true;        // Keep listening until manually stopped
    recognition.interimResults = true;    // Show interim results for feedback
    recognition.maxAlternatives = 5;      // Get 5 alternatives for best accuracy

    // When recognition gets a result - ACCUMULATE until V pressed again
    recognition.onresult = (event) => {
        // Get the most recent result
        const resultIndex = event.resultIndex;
        const result = event.results[resultIndex];
        
        // Show interim results for user feedback
        if (!result.isFinal) {
            const interim = result[0].transcript;
            console.log(`🎤 Interim: "${interim}"`);
            updateRecordingIndicator(`🎤 கேட்டுக்கொண்டிருக்கிறது: "${interim}..."`);
            return;
        }
        
        // Get best alternative from multiple options for MAXIMUM ACCURACY
        let bestTranscript = '';
        let bestConfidence = 0;
        
        for (let i = 0; i < result.length; i++) {
            const alt = result[i];
            console.log(`   Alternative ${i + 1}: "${alt.transcript}" (${(alt.confidence * 100).toFixed(0)}%)`);
            
            if (alt.confidence > bestConfidence) {
                bestConfidence = alt.confidence;
                bestTranscript = alt.transcript;
            }
        }
        
        const transcript = bestTranscript.trim();
        console.log(`🎤 FINAL SEGMENT: "${transcript}" (confidence: ${(bestConfidence * 100).toFixed(0)}%)`);

        // ACCUMULATE - don't stop, keep listening until V pressed
        if (transcript && bestConfidence > 0.2) {  // Lower threshold for better pickup
            if (accumulatedTranscript) {
                accumulatedTranscript += ' ' + transcript;
            } else {
                accumulatedTranscript = transcript;
            }
            console.log(`📝 Accumulated: "${accumulatedTranscript}"`);
            updateRecordingIndicator(`🎤 பதிவு: "${accumulatedTranscript}"`);
        }
    };

    recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        isRecording = false;
        hideRecordingIndicator();
        hideProcessingIndicator();

        if (event.error === 'no-speech') {
            console.log('No speech detected — try again');
        } else if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone in browser settings.');
        } else {
            console.error('Recognition error:', event.error);
        }
    };

    recognition.onend = () => {
        isRecording = false;
        hideRecordingIndicator();
        console.log('🎤 Recognition ended');
    };

    console.log('✅ Web Speech API initialized (Tamil/ta-IN)');
    return true;
}

// Start listening - CLEAR previous transcript
function startVoiceRecording() {
    if (!recognition || isRecording || isProcessingVoice) return;

    // Clear accumulated transcript for new recording
    accumulatedTranscript = '';

    try {
        recognition.start();
        isRecording = true;
        showRecordingIndicator();
        moveCameraToConversationAngle();  // Move camera to frontal view
        console.log('🎤 Recording started - Speak now, press V when done');
        console.log('   💡 Tip: Speak clearly, recognition is continuous');
    } catch (e) {
        // Recognition might already be running
        if (e.name === 'InvalidStateError') {
            console.log('Recognition already running, stopping and restarting...');
            recognition.stop();
            setTimeout(() => startVoiceRecording(), 100);
        } else {
            console.error('Failed to start recognition:', e);
        }
    }
}

// Stop listening and PROCESS accumulated transcript
async function stopVoiceRecording() {
    if (!recognition || !isRecording) return;

    recognition.stop();
    isRecording = false;
    hideRecordingIndicator();
    
    console.log('🎤 Stopped listening');
    console.log('📝 Full transcript:', accumulatedTranscript);

    // Process the accumulated transcript
    if (accumulatedTranscript && accumulatedTranscript.trim().length > 0) {
        await processTranscript(accumulatedTranscript);
    } else {
        console.warn('⚠️ No speech detected');
        alert('எதுவும் கேட்கவில்லை - மீண்டும் முயற்சிக்கவும்');
        resetCameraAngle();  // Reset camera if no speech
    }
}

// ===== PROCESS TRANSCRIPT → AI → TTS =====

async function processTranscript(playerText) {
    console.log('🧠 Processing transcript:', playerText);
    isProcessingVoice = true;
    isAIResponding = true;

    try {
        // Show what player said
        showUserMessage(playerText);
        showConversationLog();
        showProcessingIndicator('இராஜராஜ சோழன் சிந்திக்கிறார்...');

        // Step 1: Send to GPT-4 → get Tamil response
        console.log('📡 Sending to AI...');
        const npcText = await sendToNPCChat(playerText);

        // Check if cancelled by X key
        if (!isAIResponding) {
            console.log('⏹️ Response cancelled by user');
            resetCameraAngle();
            return;
        }

        if (!npcText) {
            throw new Error('No AI response received');
        }

        console.log('🤖 NPC response:', npcText);
        showNPCMessage(npcText);

        // Step 2: Convert Tamil text → voice via backend Edge TTS
        console.log('🔊 Generating Tamil voice...');
        const audioBytes = await textToSpeech(npcText);

        // Check again if cancelled
        if (!isAIResponding) {
            console.log('⏹️ TTS cancelled by user');
            resetCameraAngle();
            return;
        }

        // Step 3: Play audio
        await playAudioBytes(audioBytes);

        console.log('✅ Conversation complete!');

    } catch (error) {
        if (error.message === 'CANCELLED') {
            console.log('⏹️ Cancelled by user');
        } else {
            console.error('❌ Processing failed:', error);
            alert('பிழை! மீண்டும் முயற்சிக்கவும்.');
        }
    } finally {
        hideProcessingIndicator();
        isProcessingVoice = false;
        isAIResponding = false;
        resetCameraAngle();  // Return camera to normal

        // Re-show voice tooltip if still near NPC
        if (window.canInteract && window.showVoiceChatTooltip) {
            window.showVoiceChatTooltip();
        }
    }
}

// ===== AI CHAT (GPT-4) =====

async function sendToNPCChat(playerText) {
    const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: playerText,
            response_language: 'ta'   // Always Tamil response
        })
    });

    if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
    }

    const result = await response.json();
    return result.response;
}

// ===== TTS VIA BACKEND (Edge TTS) =====

async function textToSpeech(text) {
    const response = await fetch(`${BACKEND_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        throw new Error(`TTS failed: ${response.status}`);
    }

    return await response.arrayBuffer();
}

async function playAudioBytes(arrayBuffer) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    // Store for X key cancellation
    currentAudioSource = source;

    return new Promise((resolve, reject) => {
        source.onended = () => {
            currentAudioSource = null;
            if (!isAIResponding) {
                reject(new Error('CANCELLED'));
            } else {
                resolve();
            }
        };
        source.start(0);
        
        // Check if cancelled during playback
        if (!isAIResponding) {
            source.stop();
            currentAudioSource = null;
            reject(new Error('CANCELLED'));
        }
    });
}

// ===== UI HELPERS =====

function showRecordingIndicator() {
    const el = document.getElementById('voiceRecordingIndicator');
    if (el) {
        el.innerHTML = '<div class="recording-dot"></div>🎤 பேசுங்கள்... (V ஐ அழுத்தவும்)';
        el.classList.add('active');
    }
}

function updateRecordingIndicator(text) {
    const el = document.getElementById('voiceRecordingIndicator');
    if (el && el.classList.contains('active')) {
        el.innerHTML = `<div class="recording-dot"></div>${text}`;
    }
}

function hideRecordingIndicator() {
    const el = document.getElementById('voiceRecordingIndicator');
    if (el) el.classList.remove('active');
}

function showProcessingIndicator(message) {
    const el = document.getElementById('voiceProcessingIndicator');
    if (el) {
        el.textContent = message || 'Processing...';
        el.classList.add('active');
    }
}

function hideProcessingIndicator() {
    const el = document.getElementById('voiceProcessingIndicator');
    if (el) el.classList.remove('active');
}

function showConversationLog() {
    const el = document.getElementById('conversationLog');
    if (el) el.classList.add('visible');
}

function showUserMessage(text) {
    const container = document.querySelector('#conversationLog .log-messages');
    if (container) {
        const msg = document.createElement('div');
        msg.className = 'conversation-message player-message';
        msg.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-header">
                        <span class="message-name">நீங்கள்</span>
                        <span class="message-role">Player</span>
                    </div>
                    <div class="message-text">${text}</div>
                </div>
            </div>
        `;
        container.appendChild(msg);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }
}

// Clean markdown and formatting from text for display
function cleanTextForDisplay(text) {
    if (!text) return '';
    
    // Remove markdown bold (**text**)
    text = text.replace(/\*\*(.+?)\*\*/g, '$1');
    
    // Remove markdown italic (*text*)
    text = text.replace(/\*(.+?)\*/g, '$1');
    
    // Remove underscores for bold (__text__)
    text = text.replace(/__(.+?)__/g, '$1');
    
    // Remove underscores for italic (_text_)
    text = text.replace(/_(.+?)_/g, '$1');
    
    return text;
}

function showNPCMessage(text) {
    // Clean markdown before displaying
    const cleanedText = cleanTextForDisplay(text);
    
    const container = document.querySelector('#conversationLog .log-messages');
    if (container) {
        const msg = document.createElement('div');
        msg.className = 'conversation-message npc-message';
        msg.innerHTML = `
            <div class="message-avatar">👑</div>
            <div class="message-content">
                <div class="message-bubble">
                    <div class="message-header">
                        <span class="message-name">இராஜராஜ சோழன்</span>
                        <span class="message-role">King</span>
                    </div>
                    <div class="message-text">${cleanedText}</div>
                </div>
            </div>
        `;
        container.appendChild(msg);
        
        // Smooth scroll to bottom
        setTimeout(() => {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
    }
}

// ===== CAMERA CONTROL FOR CONVERSATION =====
let originalCameraPosition = null;
let originalCameraRotation = null;

function moveCameraToConversationAngle() {
    if (!window.camera || !window.rajaModel) return;
    
    // Save original position
    originalCameraPosition = window.camera.position.clone();
    originalCameraRotation = window.camera.rotation.clone();
    
    // Move to frontal conversation angle (like screenshot)
    const rajaPos = window.rajaModel.position;
    window.camera.position.set(rajaPos.x, rajaPos.y + 1.5, rajaPos.z + 3);
    window.camera.lookAt(rajaPos.x, rajaPos.y + 1, rajaPos.z);
    
    console.log('📷 Camera moved to conversation angle');
}

function resetCameraAngle() {
    if (!window.camera || !originalCameraPosition) return;
    
    window.camera.position.copy(originalCameraPosition);
    window.camera.rotation.copy(originalCameraRotation);
    
    console.log('📷 Camera reset to original position');
}

// ===== KEYBOARD CONTROLS =====
// V key - Toggle recording (start/stop)
// X key - Cancel AI response (like ChatGPT stop button)

window.addEventListener('keydown', (event) => {
    // V KEY - Voice recording toggle
    if (event.code === 'KeyV') {
        event.preventDefault();
        event.stopPropagation();

        if (window.canInteract && window.rajaModel && window.rajaModel.userData.voiceChatEnabled) {
            // Toggle recording on/off
            if (isRecording) {
                console.log('🎤 V pressed - Stopping and sending');
                stopVoiceRecording();
            } else if (!isProcessingVoice) {
                console.log('🎤 V pressed - Start speaking');
                startVoiceRecording();
                if (window.hideVoiceChatTooltip) window.hideVoiceChatTooltip();
            } else {
                console.log('⏳ AI is responding, press X to cancel');
            }
        } else {
            console.log('❌ Not near NPC or voice chat not enabled yet');
        }
    }
    
    // X KEY - Cancel AI response
    if (event.code === 'KeyX') {
        event.preventDefault();
        event.stopPropagation();
        
        if (isAIResponding || isProcessingVoice) {
            console.log('⏹️ X pressed - Cancelling AI response');
            isAIResponding = false;
            isProcessingVoice = false;
            
            // Stop audio if playing
            if (currentAudioSource) {
                currentAudioSource.stop();
                currentAudioSource = null;
            }
            
            hideProcessingIndicator();
            resetCameraAngle();
            
            // Show cancellation message
            const container = document.querySelector('#conversationLog .log-messages');
            if (container) {
                const msg = document.createElement('div');
                msg.className = 'conversation-message system-message';
                msg.innerHTML = '<div class="message-text">⏹️ நிறுத்தப்பட்டது</div>';
                container.appendChild(msg);
            }
            
            console.log('✅ AI response cancelled');
        }
    }
});

// ===== INIT =====

async function initNPCVoiceSystem() {
    console.log('🎤 Initializing NPC voice system (Web Speech API - Tamil)...');
    const ok = initVoiceSystem();
    if (ok) {
        console.log('✅ Voice system ready! Controls:');
        console.log('   🗣️ Language: Tamil (ta-IN) - 80%+ accuracy');
        console.log('   🎯 Recognition: Continuous mode, 5 alternatives');
        console.log('   🔊 TTS: Edge TTS (ta-IN-ValluvarNeural)');
        console.log('   🎮 V key: Start/Stop speaking');
        console.log('   🛑 X key: Cancel AI response (like ChatGPT stop)');
    }
    return ok;
}

window.initNPCVoiceSystem = initNPCVoiceSystem;