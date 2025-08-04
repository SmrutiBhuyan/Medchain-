import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LanguageSelector from '../components/LanguageSelector';
import './Chatbot.css';

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState('en');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const translations = {
    'en': {
      'title': 'MedChain Assistant',
      'initialMessage': "Hello! I'm your MedChain assistant. How can I help you today?",
      'errorMessage': "I'm sorry, I couldn't find a relevant answer. Please try rephrasing your question or check the Help & Support section.",
      'inputPlaceholder': "Type your message...",
      'sendButton': "Send"
    },
    'es': {
      'title': 'Asistente de MedChain',
      'initialMessage': "¡Hola! Soy tu asistente de MedChain. ¿En qué puedo ayudarte hoy?",
      'errorMessage': "Lo siento, no pude encontrar una respuesta relevante. Por favor, intenta reformular tu pregunta o revisa la sección de Ayuda y Soporte.",
      'inputPlaceholder': "Escribe tu mensaje...",
      'sendButton': "Enviar"
    },
    'fr': {
      'title': 'Assistant MedChain',
      'initialMessage': "Bonjour ! Je suis votre assistant MedChain. Comment puis-je vous aider aujourd'hui ?",
      'errorMessage': "Je suis désolé, je n'ai pas pu trouver de réponse pertinente. Veuillez reformuler votre question ou consulter la section Aide et support.",
      'inputPlaceholder': "Tapez votre message...",
      'sendButton': "Envoyer"
    },
    'hi': {
      'title': 'मेडचेन असिस्टेंट',
      'initialMessage': "नमस्ते! मैं आपका मेडचेन असिस्टेंट हूँ। मैं आज आपकी क्या मदद कर सकता हूँ?",
      'errorMessage': "मुझे क्षमा करें, मुझे कोई प्रासंगिक उत्तर नहीं मिल सका। कृपया अपना प्रश्न फिर से पूछने का प्रयास करें या सहायता और समर्थन अनुभाग देखें।",
      'inputPlaceholder': "अपना संदेश लिखें...",
      'sendButton': "भेजें"
    },
    'mr': {
      'title': 'मेडचेन असिस्टंट',
      'initialMessage': "नमस्कार! मी तुमचा मेडचेन असिस्टंट आहे. आज मी तुम्हाला कशी मदत करू शकतो?",
      'errorMessage': "माफ करा, मला योग्य उत्तर सापडले नाही. कृपया तुमचा प्रश्न पुन्हा विचारण्याचा प्रयत्न करा किंवा 'मदत आणि समर्थन' विभाग तपासा.",
      'inputPlaceholder': "तुमचा संदेश टाइप करा...",
      'sendButton': "पाठवा"
    },
    'te': {
      'title': 'మెడ్ చైన్ అసిస్టెంట్',
      'initialMessage': "నమస్కారం! నేను మీ మెడ్ చైన్ అసిస్టెంట్. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
      'errorMessage': "క్షమించండి, నాకు సంబంధిత సమాధానం దొరకలేదు. దయచేసి మీ ప్రశ్నను తిరిగి అడగడానికి ప్రయత్నించండి లేదా సహాయం & మద్దతు విభాగాన్ని తనిఖీ చేయండి.",
      'inputPlaceholder': "మీ సందేశాన్ని టైప్ చేయండి...",
      'sendButton': "పంపు"
    },
    'gu': {
      'title': 'મેડચેન આસિસ્ટન્ટ',
      'initialMessage': "નમસ્કાર! હું તમારો મેડચેન આસિસ્ટન્ટ છું. આજે હું તમને કેવી રીતે મદદ કરી શકું?",
      'errorMessage': "માફ કરશો, મને કોઈ સંબંધિત જવાબ મળ્યો નથી. કૃપા કરીને તમારા પ્રશ્નને ફરીથી પૂછવાનો પ્રયાસ કરો અથવા 'સહાય અને સપોર્ટ' વિભાગ તપાસો.",
      'inputPlaceholder': "તમારો સંદેશ લખો...",
      'sendButton': "મોકલો"
    },
    'or': {
      'title': 'ମେଡ୍‌ଚେନ୍‌ ସହାୟକ',
      'initialMessage': "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ମେଡ୍‌ଚେନ୍‌ ସହାୟକ। ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
      'errorMessage': "କ୍ଷମା କରିବେ, ମୁଁ ଏକ ପ୍ରାସଙ୍ଗିକ ଉତ୍ତର ପାଇଲି ନାହିଁ। ଦୟାକરି ଆପଣଙ୍କ ପ୍ରଶ୍ନକୁ ପୁନର୍ବାର ପଚାରନ୍ତୁ କିମ୍ବା ସାହାଯ୍ୟ ଓ ସହାୟତା ବିଭାଗ ଯାଞ୍ଚ କରନ୍ତୁ।",
      'inputPlaceholder': "ଆପଣଙ୍କ ବାର୍ତ୍ତା ଟାଇପ୍ କରନ୍ତୁ...",
      'sendButton': "ପଠାନ୍ତୁ"
    },
    'ta': {
      'title': 'மெட் செயின் உதவியாளர்',
      'initialMessage': "வணக்கம்! நான் உங்கள் மெட் செயின் உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      'errorMessage': "மன்னிக்கவும், பொருத்தமான பதிலை என்னால் கண்டுபிடிக்க முடியவில்லை. தயவுசெய்து உங்கள் கேள்வியை மீண்டும் கேளுங்கள் அல்லது உதவி மற்றும் ஆதரவு பகுதியைப் பார்க்கவும்.",
      'inputPlaceholder': "உங்கள் செய்தியை தட்டச்சு செய்யவும்...",
      'sendButton': "அனுப்பு"
    },
    'bn': {
      'title': 'মেডচেইন সহকারী',
      'initialMessage': "নমস্কার! আমি আপনার মেডচেইন সহকারী। আজ আমি আপনাকে কিভাবে সাহায্য করতে পারি?",
      'errorMessage': "আমি দুঃখিত, আমি একটি প্রাসঙ্গিক উত্তর খুঁজে পাইনি। অনুগ্রহ করে আপনার প্রশ্নটি পুনরায় লিখুন অথবা 'সহায়তা ও সমর্থন' বিভাগটি দেখুন।",
      'inputPlaceholder': "আপনার বার্তা লিখুন...",
      'sendButton': "পাঠান"
    }
  };

  useEffect(() => {
    setMessages([{ 
      text: translations[language].initialMessage, 
      sender: 'bot' 
    }]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      setIsTyping(true);
      setMessages(prev => [...prev, { text: '', sender: 'bot', isTyping: true }]);

      const response = await axios.post('http://localhost:5000/api/chatbot/query', {
        query: inputValue,
        language
      });

      setIsTyping(false);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          text: response.data.response, 
          sender: 'bot',
          isTyping: false
        };
        return newMessages;
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          text: translations[language].errorMessage, 
          sender: 'bot',
          isTyping: false
        };
        return newMessages;
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  return (
   <div className="chatbot">
     <div className="app">
      <div className="chat-container">
        <header className="chat-header">
          <h1 className="chat-title">{translations[language].title}</h1>
          <LanguageSelector 
            language={language} 
            onLanguageChange={handleLanguageChange} 
          />
        </header>
        
        <div className="chat-messages">
          {messages.map((message, index) => (
            <React.Fragment key={index}>
              {message.isTyping ? (
                <div className="message bot typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <div 
                  className={`message ${message.sender}`}
                  dangerouslySetInnerHTML={{ 
                    __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                  }}
                />
              )}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={translations[language].inputPlaceholder}
            disabled={isTyping}
          />
          <button 
            onClick={handleSendMessage}
            disabled={isTyping || !inputValue.trim()}
          >
            {translations[language].sendButton}
          </button>
        </div>
      </div>
    </div>
   </div>  );
}

export default Chatbot;