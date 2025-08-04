import React, { useState, useEffect, useRef } from 'react';
import { FaVolumeUp, FaPaperPlane } from 'react-icons/fa';
import "./Chatbot.css"

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [userRole, setUserRole] = useState('consumer');
  const [language, setLanguage] = useState('en-US');
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const currentAudioRef = useRef(null);
  const chatLogRef = useRef(null);

  // Dummy data for the supply chain
  const dummyData = {
    regulatoryCompliance: {
      authenticity: {
        details: "All products must have verifiable authenticity codes. For example, '12345-P-2025-001-A' is valid, but '12345-P-2025-001-B' is not.",
        validCodes: ['12345-P-2025-001-A', '67890-A-2025-002-C'],
        invalidCodes: ['12345-P-2025-001-B']
      },
      qualityAndExpiry: {
        details: "Maintain detailed batch records and monitor expiry dates. Products must not be distributed past their expiry dates.",
        batchCertificate: 'batch certificate P-2025-001',
        expiryDates: {
          'Paracetamol': '2026-12-31',
          'Ibuprofen': '2026-03-20',
        }
      },
      storageAndHandling: {
        details: "Strictly adhere to specified storage guidelines for each product to maintain efficacy and safety.",
        guidelines: {
          'Paracetamol': 'Store at room temperature (15-30°C) in a dry place.',
          'Amoxicillin': 'Store in a cool, dry place. The liquid form requires refrigeration after mixing.',
          'Ibuprofen': 'Keep in a cool, dry place, away from direct light and heat.',
        }
      },
      licensing: {
        details: "Ensure all necessary licenses are current and valid. All operations must be conducted under appropriate and up-to-date licenses.",
        licenseNumber: 'Pharmaceutical Manufacturing License #PMC-98765',
        validUntil: '2029-01-01'
      },
      distribution: {
        details: "Adherence to Good Distribution Practices (GDP) to ensure products are shipped efficiently while maintaining quality.",
        orderStatus: {
          'ORD-12345': 'Shipped',
          'ORD-67890': 'Processing'
        }
      }
    },
    inventory: {
      'Paracetamol': { quantity: 5000, batch: 'P-2025-001', expiry: '2026-12-31' },
      'Amoxicillin': { quantity: 1200, batch: 'A-2025-002', expiry: '2027-06-15' },
      'Ibuprofen': { quantity: 7500, batch: 'I-2025-003', expiry: '2026-03-20' },
    },
    orders: {
      'ORD-12345': { product: 'Paracetamol', quantity: 1000, status: 'Shipped', eta: '2025-08-10' },
      'ORD-67890': { product: 'Amoxicillin', quantity: 200, status: 'Processing', eta: '2025-08-15' },
    },
    authenticityCodes: {
      '12345-P-2025-001-A': true,
      '12345-P-2025-001-B': false, // Counterfeit example
      '67890-A-2025-002-C': true,
    },
    storageGuidelines: {
      'Paracetamol': 'Store at room temperature (15-30°C) in a dry place.',
      'Amoxicillin': 'Store in a cool, dry place. The liquid form requires refrigeration after mixing.',
      'Ibuprofen': 'Keep in a cool, dry place, away from direct light and heat.',
    },
    pharmacies: [
      { name: 'City Center Pharmacy', location: '123 Main St', contact: '555-1234' },
      { name: 'Corner Drug Store', location: '456 Oak Ave', contact: '555-5678' },
    ],
    documents: {
      'batch certificate P-2025-001': 'Certificate of Analysis for Batch P-2025-001. All tests passed. Valid until 2026-12-31.',
      'license': 'Pharmaceutical Manufacturing License #PMC-98765. Issued: 2024-01-01, Expires: 2029-01-01.',
    },
  };

  // Utility function to convert base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Utility function to convert PCM data to a WAV Blob
  const pcmToWav = (pcmData, sampleRate) => {
    const dataLength = pcmData.length * 2;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type
    writeString(view, 8, 'WAVE');
    // format chunk identifier
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 = PCM)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channels * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, dataLength, true);

    // Write PCM samples
    for (let i = 0; i < pcmData.length; i++) {
      view.setInt16(44 + i * 2, pcmData[i], true);
    }
    return new Blob([view], { type: 'audio/wav' });
  };

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Welcome messages in different languages
  const getWelcomeMessage = (role, lang) => {
    const messages = {
      'en-US': `Hello! You've selected the <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b> role. How can I help you today?`,
      'hi-IN': `नमस्ते! आपने <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b> की भूमिका चुनी है। मैं आज आपकी कैसे मदद कर सकता हूँ?`,
      'bh-IN': `नमस्कार! रउआ <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b> के भूमिका चुनल बानी। हम आज रउआ के कइसे मदद क सकत बानी?`,
      'or-IN': `ନମସ୍କାର! ଆପଣ <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b> ଭୂମିକା ବାଛିଛନ୍ତି। ମୁଁ ଆପଣଙ୍କୁ ଆଜି କିପରି ସାହାଯ୍ୟ କରିପାରିବି?`,
      'bn-BD': `নমস্কার! আপনি <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b> ভূমিকাটি বেছে নিয়েছেন। আমি আজ আপনাকে কীভাবে সাহায্য করতে পারি?`,
      'ta-IN': `வணக்கம்! நீங்கள் <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b> என்ற பங்கைத் தேர்ந்தெடுத்துள்ளீர்கள். நான் இன்று உங்களுக்கு எப்படி உதவ முடியும்?`,
      'te-IN': `నమస్కారం! మీరు <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b> పాత్రను ఎంచుకున్నారు. నేను ఈ రోజు మీకు ఎలా సహాయపడగలను?`,
      'mr-IN': `नमस्कार! तुम्ही <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b> ही भूमिका निवडली आहे. मी आज तुम्हाला कशी मदत करू शकतो?`,
      'es-ES': `¡Hola! Has seleccionado el rol de <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b>. ¿En qué puedo ayudarte hoy?`,
      'fr-FR': `Bonjour! Vous avez sélectionné le rôle de <b>${role.charAt(0).toUpperCase() + role.slice(1)}</b>. Comment puis-je vous aider aujourd'hui?`,
      'ja-JP': `こんにちは！<b>${role.charAt(0).toUpperCase() + role.slice(1)}</b>の役割を選択しました。今日はどのようにお手伝いできますか？`
    };
    return messages[lang] || messages['en-US'];
  };

  // Speak response using TTS
  const speakResponse = async (text, buttonId) => {
    if (audioPlaying) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      document.querySelectorAll('.read-aloud-btn.playing').forEach(btn => {
        btn.classList.remove('playing');
      });
      const button = document.getElementById(buttonId);
      if (button && button.classList.contains('playing')) {
        setAudioPlaying(false);
        return;
      }
    }
    
    setAudioPlaying(true);
    const button = document.getElementById(buttonId);
    if (button) button.classList.add('playing');
    
    try {
      const payload = {
        contents: [{
          parts: [{ text: text }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Iapetus" }
            }
          }
        },
        model: "gemini-2.5-flash-preview-tts"
      };

      const apiKey = "AIzaSyCP0AD3hzQ4yyoZsK9yB9LuZCjlPKQvEOQ";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      const audioData = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;

      if (audioData && mimeType && mimeType.startsWith("audio/")) {
        const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
        const pcmData = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(pcmData);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const audioUrl = URL.createObjectURL(wavBlob);
        
        currentAudioRef.current = new Audio(audioUrl);
        currentAudioRef.current.play();
        currentAudioRef.current.onended = () => {
          setAudioPlaying(false);
          if (button) button.classList.remove('playing');
        };
      } else {
        console.error('TTS API response error:', result);
        setAudioPlaying(false);
        if (button) button.classList.remove('playing');
      }
    } catch (e) {
      console.error("TTS API call failed:", e);
      setAudioPlaying(false);
      if (button) button.classList.remove('playing');
    }
  };

  // Handle user message submission
  const handleUserMessage = async () => {
    const message = userInput.trim();
    if (message === '') return;

    // Add user message to chat
    setMessages(prev => [...prev, { sender: 'user', text: message }]);
    setUserInput('');
    setIsLoading(true);

    const prompt = `You are a chatbot for a medicine supply chain. Your role is a ${userRole}. Here is the available dummy data: ${JSON.stringify(dummyData)}. Respond to the user's query in the language corresponding to the code '${language}', acting as the chatbot for the ${userRole} role, using the provided data where relevant. Be clear and concise. If you don't have information, say so. User query: "${message}"`;

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      const apiKey = ""; // Add your API key here
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      
      const fetchWithRetry = async (url, options, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const res = await fetch(url, options);
            if (res.status !== 429) {
              return res;
            }
          } catch (error) {
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            } else {
              throw error;
            }
          }
        }
        throw new Error('All retries failed.');
      };

      const apiResponse = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await apiResponse.json();

      let response = 'I\'m sorry, I couldn\'t generate a valid response. Please try again.';
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        response = result.candidates[0].content.parts[0].text;
      }

      setMessages(prev => [...prev, { sender: 'bot', text: response }]);
    } catch (e) {
      console.error("API call failed:", e);
      setMessages(prev => [...prev, { sender: 'bot', text: 'I\'m sorry, something went wrong. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role or language change
  const handleSettingChange = () => {
    setMessages([{ sender: 'bot', text: getWelcomeMessage(userRole, language) }]);
  };

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{ sender: 'bot', text: getWelcomeMessage(userRole, language) }]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <h1>Medicine Supply Chain Assistant</h1>
      </header>

      <div className="selector-container">
        <div className="selector-group">
          <label htmlFor="user-role">Select your role:</label>
          <select 
            id="user-role" 
            className="role-selector" 
            value={userRole}
            onChange={(e) => {
              setUserRole(e.target.value);
              handleSettingChange();
            }}
          >
            <option value="consumer">Consumer/Patient</option>
            <option value="retailer">Retailer/Pharmacy</option>
            <option value="distributor">Distributor/Wholesaler</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="regulatory">Regulatory/Compliance</option>
          </select>
        </div>
        <div className="selector-group">
          <label htmlFor="language-selector">Select language:</label>
          <select 
            id="language-selector" 
            className="language-selector" 
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              handleSettingChange();
            }}
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="bh-IN">Bhojpuri</option>
            <option value="or-IN">Odia</option>
            <option value="bn-BD">Bengali</option>
            <option value="ta-IN">Tamil</option>
            <option value="te-IN">Telugu</option>
            <option value="mr-IN">Marathi</option>
            <option value="es-ES">Spanish</option>
            <option value="fr-FR">French</option>
            <option value="ja-JP">Japanese</option>
          </select>
        </div>
      </div>

      <div id="chat-log" className="chat-log" ref={chatLogRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.sender}-message-wrapper`}>
            <div className={`message ${msg.sender}-message`} dangerouslySetInnerHTML={{ __html: msg.text }}></div>
            {msg.sender === 'bot' && (
              <button 
                id={`read-aloud-${index}`}
                className="read-aloud-btn"
                onClick={() => speakResponse(msg.text, `read-aloud-${index}`)}
              >
                <FaVolumeUp />
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message-wrapper">
            <div className="message bot-message">
              Typing<span className="loading-dot"></span><span className="loading-dot"></span><span className="loading-dot"></span>
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          id="user-input"
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleUserMessage()}
          disabled={isLoading}
        />
        <button 
          id="send-button" 
          onClick={handleUserMessage}
          disabled={isLoading || !userInput.trim()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;