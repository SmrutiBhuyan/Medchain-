import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Send, Loader, Shield, Navigation, Search, CheckCircle, XCircle, AlertTriangle, Map, Phone } from 'lucide-react';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [ticketId, setTicketId] = useState(null);
  const [language, setLanguage] = useState('en-US');
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const currentAudioRef = useRef(null);
  const chatLogRef = useRef(null);

  // MedChain intents data from the document
  const medChainIntents = {
    verify_medicine: {
      questions: [
        "How do I verify a medicine?",
        "Can I verify multiple medicines at once?",
        "What details are needed for verification?",
        "Is verification free?",
        "What if my medicine fails verification?",
        "Can I save verification results?"
      ],
      answers: [
        "Click **'Verify Medicine'** on the main panel, enter the drug details, and submit for authenticity verification.",
        "Currently, you can verify one medicine at a time via **'Verify Medicine'**.",
        "You'll need the drug's batch number, manufacturer, and expiry date.",
        "Yes! MedChain offers free verification for all users.",
        "Contact **'Help & Support'** to report counterfeit drugs.",
        "Yes, log in to your account to save history under **'Verify Medicine'**."
      ]
    },
    general_navigation: {
      questions: [
        "Where can I find the rewards program?",
        "How do I contact support?",
        "What is MedChain's purpose?",
        "How do I watch the demo?"
      ],
      answers: [
        "Go to **'More Features 1'** > **'Rewards Program'** to view and redeem loyalty points.",
        "Navigate to **'More Features 1'** > **'Help & Support'** for assistance.",
        "MedChain helps you *'Track Trust. Fight Fakes.'* by verifying medicines and tracking inventory.",
        "Click **'See MedChain in Action'** on the homepage for a verification demo."
      ]
    },
    emergency_stock: {
      questions: [
        "How do I find the nearest pharmacy?",
        "Does Emergency Stock show real-time availability?",
        "Can I reserve medicine via Emergency Stock?",
        "What if no pharmacies have my medicine?",
        "Is GPS mandatory for Emergency Stock?"
      ],
      answers: [
        "Use **'Emergency Stock'**, enable GPS, and enter the medicine name for nearby options.",
        "Yes, it displays live stock data from partnered pharmacies.",
        "Currently, it only shows availability. Contact the pharmacy directly to reserve.",
        "Try broadening your search or use **'Demand Predictor'** to check future restocks.",
        "Yes, GPS ensures accurate nearby results. You can also manually enter your location."
      ]
    }
  };

  // Sample verification data
  const verificationData = {
    validCodes: {
      'MED-2025-001-A': {
        medicine: 'Paracetamol 500mg',
        manufacturer: 'PharmaCorp Ltd',
        batch: 'P-2025-001',
        expiry: '2026-12-31',
        status: 'authentic'
      },
      'AMX-2025-002-C': {
        medicine: 'Amoxicillin 250mg',
        manufacturer: 'MediTech Industries',
        batch: 'A-2025-002',
        expiry: '2027-06-15',
        status: 'authentic'
      },
      'IBU-2025-003-B': {
        medicine: 'Ibuprofen 400mg',
        manufacturer: 'HealthCare Solutions',
        batch: 'I-2025-003',
        expiry: '2026-03-20',
        status: 'authentic'
      }
    },
    invalidCodes: ['MED-2025-001-B', 'FAKE-123-456', 'OLD-2024-999']
  };

  // Navigation structure for MedChain
  const navigationStructure = {
    mainFeatures: [
      'Verify Medicine',
      'Emergency Stock',
      'Get Started',
      'Login'
    ],
    moreFeatures1: [
      'Smart Inventory Monitor',
      'Voice Assistant', 
      'Rewards Program',
      'Help & Support'
    ],
    specialActions: [
      'See MedChain in Action (Demo)',
      'Contact Support'
    ]
  };

  // Welcome message with focus on verification and navigation
  const getWelcomeMessage = (lang) => {
    const messages = {
      'en-US': `🛡️ **Welcome to MedChain Customer Support!**
      
      **Track Trust. Fight Fakes.** 
      
      I'm here to help you with:
      
      🔍 **Medicine Verification**
      • Authenticate your medicines instantly
      • Check batch numbers and expiry dates
      • Report counterfeit drugs
      
      🧭 **Platform Navigation**
      • Find features and tools
      • Locate nearby pharmacies
      • Access your account and rewards
      
      💡 **Quick Start:**
      Try asking: "How to verify medicine?" or "Where is the rewards program?"`,
      
      'hi-IN': `🛡️ **MedChain ग्राहक सहायता में आपका स्वागत है!**
      
      **ट्रस्ट ट्रैक करें। नकली से लड़ें।**
      
      मैं आपकी इन चीजों में मदद कर सकता हूँ:
      
      🔍 **दवा सत्यापन**
      • अपनी दवाओं को तुरंत प्रमाणित करें
      • बैच नंबर और समाप्ति तिथि जांचें
      • नकली दवाओं की रिपोर्ट करें
      
      🧭 **प्लेटफॉर्म नेवीगेशन**
      • फीचर्स और टूल्स खोजें
      • नजदीकी फार्मेसी खोजें
      • अपना अकाउंट और रिवार्ड्स एक्सेस करें`,
      
      'es-ES': `🛡️ **¡Bienvenido al Soporte de MedChain!**
      
      **Rastrea la Confianza. Combate las Falsificaciones.**
      
      Estoy aquí para ayudarte con:
      
      🔍 **Verificación de Medicinas**
      • Autentica tus medicinas al instante
      • Verifica números de lote y fechas de vencimiento
      • Reporta medicinas falsas
      
      🧭 **Navegación de la Plataforma**
      • Encuentra características y herramientas
      • Localiza farmacias cercanas
      • Accede a tu cuenta y recompensas`
    };
    return messages[lang] || messages['en-US'];
  };

  // Enhanced text-to-speech
  const speakResponse = async (text) => {
    if (audioPlaying) {
      speechSynthesis.cancel();
      setAudioPlaying(false);
      return;
    }
    
    setAudioPlaying(true);
    
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, '').replace(/\*\*/g, ''));
        utterance.lang = language;
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        utterance.onend = () => setAudioPlaying(false);
        utterance.onerror = () => setAudioPlaying(false);
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("TTS failed:", error);
      setAudioPlaying(false);
    }
  };

  // Smart response generator focused on verification and navigation
  const generateSupportResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    // Medicine verification responses
    if (message.includes('verify') || message.includes('authentic') || message.includes('check medicine') || message.includes('fake')) {
      // Check for specific verification codes
      const codePattern = /[A-Z]{3}-\d{4}-\d{3}-[A-Z]/g;
      const foundCodes = userMessage.match(codePattern);
      
      if (foundCodes) {
        const code = foundCodes[0];
        if (verificationData.validCodes[code]) {
          const med = verificationData.validCodes[code];
          return `✅ **AUTHENTIC MEDICINE VERIFIED**<br/><br/>
          🔍 **Code:** ${code}<br/>
          💊 **Medicine:** ${med.medicine}<br/>
          🏭 **Manufacturer:** ${med.manufacturer}<br/>
          📦 **Batch:** ${med.batch}<br/>
          📅 **Expiry:** ${med.expiry}<br/><br/>
          ✨ This medicine is **100% authentic** and safe to use!<br/><br/>
          💡 **Tip:** Save this verification to your account by logging in first.`;
        } else if (verificationData.invalidCodes.includes(code)) {
          return `⚠️ **COUNTERFEIT ALERT**<br/><br/>
          🚨 **Code:** ${code}<br/>
          ❌ **Status:** This code is **INVALID** or **COUNTERFEIT**<br/><br/>
          **⚡ IMMEDIATE ACTIONS:**<br/>
          🔸 Do NOT consume this medicine<br/>
          🔸 Report to **'Help & Support'** immediately<br/>
          🔸 Contact the pharmacy where you purchased it<br/>
          🔸 Take photos of the packaging for evidence<br/><br/>
          📞 **Emergency:** If you've already taken it, consult a doctor immediately.`;
        }
      }
      
      if (message.includes('how') || message.includes('steps')) {
        return `🔍 **How to Verify Your Medicine:**<br/><br/>
        **Step 1:** Click **'Verify Medicine'** on the main panel<br/>
        **Step 2:** Enter these required details:<br/>
        🔹 Batch number (found on packaging)<br/>
        🔹 Manufacturer name<br/>
        🔹 Expiry date<br/>
        **Step 3:** Submit for instant authenticity check<br/><br/>
        💡 **Sample codes to try:**<br/>
        • MED-2025-001-A (Valid)<br/>
        • AMX-2025-002-C (Valid)<br/>
        • MED-2025-001-B (Invalid)<br/><br/>
        ✨ **Pro Tip:** Verification is completely FREE for all users!`;
      }
      
      if (message.includes('multiple') || message.includes('batch')) {
        return medChainIntents.verify_medicine.answers[1] + "<br/><br/>💡 **For bulk verification:** Contact our enterprise support team for pharmacy/distributor solutions.";
      }
      
      if (message.includes('details needed') || message.includes('information required')) {
        return `📋 **Required Information for Verification:**<br/><br/>
        ✅ **Mandatory Fields:**<br/>
        🔹 **Batch Number** (e.g., P-2025-001)<br/>
        🔹 **Manufacturer Name** (exact spelling)<br/>
        🔹 **Expiry Date** (MM/DD/YYYY format)<br/><br/>
        📸 **Optional but Helpful:**<br/>
        🔹 Photo of the packaging<br/>
        🔹 Purchase receipt<br/>
        🔹 Pharmacy location<br/><br/>
        ⏱️ **Verification Time:** Instant results in under 5 seconds!`;
      }
      
      if (message.includes('free') || message.includes('cost')) {
        return medChainIntents.verify_medicine.answers[3] + "<br/><br/>🎯 **Our Mission:** Making medicine verification accessible to everyone, everywhere.";
      }
      
      if (message.includes('fails') || message.includes('counterfeit') || message.includes('fake')) {
        return `🚨 **If Your Medicine Fails Verification:**<br/><br/>
        **Immediate Steps:**<br/>
        🔸 Stop using the medicine immediately<br/>
        🔸 Keep the packaging and receipt<br/>
        🔸 Take clear photos of all labels<br/><br/>
        **Report Process:**<br/>
        📍 Go to **'More Features 1'** > **'Help & Support'**<br/>
        📝 Fill out the counterfeit report form<br/>
        📤 Upload photos and purchase details<br/><br/>
        🏥 **If you've consumed it:** Consult a healthcare provider immediately<br/>
        ⚖️ **Legal Action:** We work with authorities to track counterfeit sources`;
      }
      
      if (message.includes('save') || message.includes('history')) {
        return medChainIntents.verify_medicine.answers[5] + "<br/><br/>📊 **Account Benefits:**<br/>🔹 Verification history<br/>🔹 Medication reminders<br/>🔹 Reward points for each verification";
      }
    }

    // Navigation responses
    if (message.includes('where') || message.includes('find') || message.includes('locate') || message.includes('navigation')) {
      if (message.includes('rewards') || message.includes('points') || message.includes('loyalty')) {
        return `🎁 **Finding the Rewards Program:**<br/><br/>
        📍 **Navigation Path:**<br/>
        **'More Features 1'** > **'Rewards Program'**<br/><br/>
        🌟 **What You Can Do:**<br/>
        🔹 View your current point balance<br/>
        🔹 Redeem points for discounts<br/>
        🔹 See reward history<br/>
        🔹 Check available offers<br/><br/>
        💰 **Earn Points By:**<br/>
        ✅ Verifying medicines (+10 points)<br/>
        ✅ Reporting fake drugs (+50 points)<br/>
        ✅ Referring friends (+25 points)`;
      }
      
      if (message.includes('support') || message.includes('help') || message.includes('contact')) {
        return `📞 **Finding Help & Support:**<br/><br/>
        📍 **Navigation Path:**<br/>
        **'More Features 1'** > **'Help & Support'**<br/><br/>
        🛠️ **Available Support Options:**<br/>
        🔹 Submit technical issues<br/>
        🔹 Report counterfeit medicines<br/>
        🔹 Account assistance<br/>
        🔹 Feature requests<br/>
        🔹 Partnership inquiries<br/><br/>
        ⏰ **Response Time:** 24-48 hours for most queries<br/>
        🚨 **Urgent Issues:** Use priority support flag`;
      }
      
      if (message.includes('demo') || message.includes('action') || message.includes('tutorial')) {
        return `🎬 **Watching the MedChain Demo:**<br/><br/>
        📍 **Location:** Homepage main section<br/>
        🎯 **Button:** **'See MedChain in Action'**<br/><br/>
        📺 **Demo Includes:**<br/>
        🔹 Live medicine verification process<br/>
        🔹 Platform navigation walkthrough<br/>
        🔹 Emergency stock search demo<br/>
        🔹 Key features overview<br/><br/>
        ⏱️ **Duration:** 3-5 minutes<br/>
        💡 **Best For:** New users and partners`;
      }
      
      if (message.includes('pharmacy') || message.includes('emergency stock') || message.includes('nearby')) {
        return `🏥 **Finding Nearby Pharmacies:**<br/><br/>
        📍 **Navigation Path:**<br/>
        Click **'Emergency Stock'** on main panel<br/><br/>
        🔍 **Search Process:**<br/>
        1️⃣ Enable GPS location access<br/>
        2️⃣ Enter medicine name<br/>
        3️⃣ View real-time availability<br/>
        4️⃣ Get directions to pharmacy<br/><br/>
        📱 **Features:**<br/>
        🔹 Live stock data<br/>
        🔹 Distance and directions<br/>
        🔹 Pharmacy contact info<br/>
        🔹 Operating hours<br/><br/>
        💡 **Tip:** Call ahead to reserve your medicine`;
      }
      
      if (message.includes('inventory') || message.includes('smart monitor')) {
        return `📊 **Smart Inventory Monitor Location:**<br/><br/>
        📍 **Navigation Path:**<br/>
        **'More Features 1'** > **'Smart Inventory Monitor'**<br/><br/>
        🎯 **Key Features:**<br/>
        🔹 Track your medicine stock levels<br/>
        🔹 Set low-stock alerts<br/>
        🔹 Predict when you'll need refills<br/>
        🔹 Export reports for doctors<br/>
        🔹 Sync with pharmacy purchases<br/><br/>
        📱 **Coming Soon:** Mobile app integration`;
      }
    }

    // Platform purpose and general info
    if (message.includes('purpose') || message.includes('what is medchain') || message.includes('about')) {
      return `🛡️ **About MedChain:**<br/><br/>
      🎯 **Our Mission:** *"Track Trust. Fight Fakes."*<br/><br/>
      🔍 **Core Functions:**<br/>
      ✅ Verify medicine authenticity instantly<br/>
      📦 Track pharmaceutical supply chain<br/>
      🏥 Connect patients with verified pharmacies<br/>
      📊 Monitor inventory and predict demand<br/>
      🚨 Combat counterfeit drug distribution<br/><br/>
      🌍 **Global Impact:**<br/>
      🔹 Protecting millions from fake medicines<br/>
      🔹 Supporting 10,000+ verified pharmacies<br/>
      🔹 Blockchain-secured verification system<br/>
      🔹 Available in 15+ countries`;
    }

    // Main navigation structure
    if (message.includes('main features') || message.includes('homepage') || message.includes('navigation menu')) {
      return `🏠 **MedChain Main Navigation:**<br/><br/>
      **🎯 Primary Features:**<br/>
      🔹 **'Verify Medicine'** - Authenticate drugs instantly<br/>
      🔹 **'Emergency Stock'** - Find nearby pharmacy stock<br/>
      🔹 **'Get Started'** - New user registration<br/>
      🔹 **'Login'** - Access your account<br/><br/>
      **⚡ More Features 1:**<br/>
      🔹 Smart Inventory Monitor<br/>
      🔹 Voice Assistant<br/>
      🔹 Rewards Program<br/>
      🔹 Help & Support<br/><br/>
      💡 **Pro Tip:** Most users start with **'Verify Medicine'**`;
    }

    // Default helpful response
    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      return `Hello! 👋 I'm here to help you with **Medicine Verification** and **Platform Navigation**.<br/><br/>
      🔍 **Popular Questions:**<br/>
      🔹 "How do I verify a medicine?"<br/>
      🔹 "Where is the rewards program?"<br/>
      🔹 "How to find nearby pharmacies?"<br/>
      🔹 "What details are needed for verification?"<br/><br/>
      💡 **Quick Actions:**<br/>
      Try typing a verification code like: **MED-2025-001-A**<br/><br/>
      What would you like help with today?`;
    }

    // Default response for unmatched queries
    return `🤔 I specialize in **Medicine Verification** and **Platform Navigation** help.<br/><br/>
    🔍 **I can help you with:**<br/>
    ✅ How to verify medicine authenticity<br/>
    ✅ Finding features on MedChain platform<br/>
    ✅ Locating nearby pharmacies<br/>
    ✅ Navigating rewards and support sections<br/><br/>
    💡 **Try asking:**<br/>
    🔹 "How to verify my medicine?"<br/>
    🔹 "Where is the help section?"<br/>
    🔹 "Find nearby pharmacies"<br/><br/>
    Please let me know what specific help you need!`;
  };

  // Generate ticket ID
  const generateTicketId = () => {
    return 'TKT-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  };

  // Handle user message submission
  const handleUserMessage = async () => {
    const message = userInput.trim();
    if (message === '') return;

    setMessages(prev => [...prev, { sender: 'user', text: message }]);
    setUserInput('');
    setIsLoading(true);

    if (!ticketId && messages.filter(m => m.sender === 'user').length === 0) {
      const newTicketId = generateTicketId();
      setTicketId(newTicketId);
    }

    setTimeout(() => {
      const response = generateSupportResponse(message);
      setMessages(prev => [...prev, { sender: 'bot', text: response }]);
      setIsLoading(false);
    }, 800);
  };

  // Initialize with welcome message
  useEffect(() => {
    setMessages([{ sender: 'bot', text: getWelcomeMessage(language) }]);
  }, [language]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      borderBottom: '4px solid #3b82f6',
      padding: '16px'
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1e40af',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: 0
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginTop: '4px'
    },
    ticketId: {
      fontSize: '12px',
      color: '#2563eb',
      marginTop: '4px'
    },
    headerRight: {
      textAlign: 'right',
      fontSize: '14px',
      color: '#6b7280'
    },
    tagline: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: '#2563eb',
      fontWeight: '500'
    },
    quickActions: {
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '12px'
    },
    quickActionsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      justifyContent: 'center'
    },
    quickActionButton: {
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '14px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'background-color 0.2s'
    },
    verifyButton: {
      backgroundColor: '#dcfce7',
      color: '#15803d'
    },
    verifyButtonHover: {
      backgroundColor: '#bbf7d0'
    },
    rewardsButton: {
      backgroundColor: '#f3e8ff',
      color: '#7c3aed'
    },
    rewardsButtonHover: {
      backgroundColor: '#e9d5ff'
    },
    pharmacyButton: {
      backgroundColor: '#fed7aa',
      color: '#c2410c'
    },
    pharmacyButtonHover: {
      backgroundColor: '#fdba74'
    },
    codeButton: {
      backgroundColor: '#dbeafe',
      color: '#1d4ed8'
    },
    codeButtonHover: {
      backgroundColor: '#bfdbfe'
    },
    languageSelect: {
      padding: '4px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '9999px',
      fontSize: '14px',
      outline: 'none'
    },
    languageSelectFocus: {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px'
    },
    chatArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    messageContainer: {
      display: 'flex'
    },
    userMessageContainer: {
      justifyContent: 'flex-end'
    },
    botMessageContainer: {
      justifyContent: 'flex-start'
    },
    message: {
      maxWidth: '512px',
      padding: '12px 16px',
      borderRadius: '8px'
    },
    userMessage: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    botMessage: {
      backgroundColor: 'white',
      color: '#374151',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb'
    },
    messageActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px solid #e5e7eb'
    },
    actionButton: {
      padding: '4px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'color 0.2s'
    },
    speakerButton: {
      color: '#6b7280'
    },
    speakerButtonHover: {
      color: '#3b82f6'
    },
    actionButtonsGroup: {
      display: 'flex',
      gap: '4px'
    },
    helpfulButton: {
      color: '#10b981'
    },
    helpfulButtonHover: {
      color: '#059669'
    },
    notHelpfulButton: {
      color: '#ef4444'
    },
    notHelpfulButtonHover: {
      color: '#dc2626'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'flex-start'
    },
    loadingMessage: {
      maxWidth: '512px',
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: 'white',
      color: '#374151',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb'
    },
    loadingContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    inputArea: {
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      padding: '16px'
    },
    inputContainer: {
      display: 'flex',
      gap: '8px'
    },
    input: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      outline: 'none',
      fontSize: '16px'
    },
    inputFocus: {
      outline: '2px solid #3b82f6',
      outlineOffset: '2px',
      borderColor: 'transparent'
    },
    sendButton: {
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    },
    sendButtonHover: {
      backgroundColor: '#2563eb'
    },
    sendButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    inputFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      fontSize: '12px',
      color: '#6b7280'
    },
    footerLeft: {
      display: 'flex',
      alignItems: 'center'
    },
    footerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>
              <Shield color="#2563eb" size={28} />
              MedChain Support
            </h1>
            <p style={styles.subtitle}>
              Medicine Verification & Navigation Help
            </p>
            {ticketId && (
              <p style={styles.ticketId}>
                Ticket: <span style={{fontWeight: '500'}}>{ticketId}</span>
              </p>
            )}
          </div>
          <div style={styles.headerRight}>
            <div style={styles.tagline}>
              <Shield size={16} />
              <span>Track Trust. Fight Fakes.</span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <div style={styles.quickActionsContainer}>
          <button 
            onClick={() => setUserInput('How do I verify a medicine?')}
            style={{...styles.quickActionButton, ...styles.verifyButton}}
            onMouseEnter={(e) => e.target.style.backgroundColor = styles.verifyButtonHover.backgroundColor}
            onMouseLeave={(e) => e.target.style.backgroundColor = styles.verifyButton.backgroundColor}
          >
            <Shield size={14} />
            Verify Medicine
          </button>
          <button 
            onClick={() => setUserInput('Where is the rewards program?')}
            style={{...styles.quickActionButton, ...styles.rewardsButton}}
            onMouseEnter={(e) => e.target.style.backgroundColor = styles.rewardsButtonHover.backgroundColor}
            onMouseLeave={(e) => e.target.style.backgroundColor = styles.rewardsButton.backgroundColor}
          >
            🎁 Rewards
          </button>
          <button 
            onClick={() => setUserInput('How to find nearby pharmacies?')}
            style={{...styles.quickActionButton, ...styles.pharmacyButton}}
            onMouseEnter={(e) => e.target.style.backgroundColor = styles.pharmacyButtonHover.backgroundColor}
            onMouseLeave={(e) => e.target.style.backgroundColor = styles.pharmacyButton.backgroundColor}
          >
            <Map size={14} />
            Find Pharmacies
          </button>
          <button 
            onClick={() => setUserInput('MED-2025-001-A')}
            style={{...styles.quickActionButton, ...styles.codeButton}}
            onMouseEnter={(e) => e.target.style.backgroundColor = styles.codeButtonHover.backgroundColor}
            onMouseLeave={(e) => e.target.style.backgroundColor = styles.codeButton.backgroundColor}
          >
            <Search size={14} />
            Try Code
          </button>
          <select 
            style={styles.languageSelect}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            onFocus={(e) => e.target.style.outline = styles.languageSelectFocus.outline}
            onBlur={(e) => e.target.style.outline = 'none'}
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="es-ES">Spanish</option>
          </select>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={chatLogRef}
        style={styles.chatArea}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{
            ...styles.messageContainer,
            ...(msg.sender === 'user' ? styles.userMessageContainer : styles.botMessageContainer)
          }}>
            <div style={{
              ...styles.message,
              ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage)
            }}>
              <div dangerouslySetInnerHTML={{ __html: msg.text }}></div>
              {msg.sender === 'bot' && (
                <div style={styles.messageActions}>
                  <button 
                    onClick={() => speakResponse(msg.text)}
                    style={{...styles.actionButton, ...styles.speakerButton}}
                    disabled={audioPlaying}
                    onMouseEnter={(e) => !audioPlaying && (e.target.style.color = styles.speakerButtonHover.color)}
                    onMouseLeave={(e) => !audioPlaying && (e.target.style.color = styles.speakerButton.color)}
                  >
                    <Volume2 size={16} />
                  </button>
                  <div style={styles.actionButtonsGroup}>
                    <button 
                      style={{...styles.actionButton, ...styles.helpfulButton}} 
                      title="Helpful"
                      onMouseEnter={(e) => e.target.style.color = styles.helpfulButtonHover.color}
                      onMouseLeave={(e) => e.target.style.color = styles.helpfulButton.color}
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button 
                      style={{...styles.actionButton, ...styles.notHelpfulButton}} 
                      title="Not helpful"
                      onMouseEnter={(e) => e.target.style.color = styles.notHelpfulButtonHover.color}
                      onMouseLeave={(e) => e.target.style.color = styles.notHelpfulButton.color}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingMessage}>
              <div style={styles.loadingContent}>
                <Loader className="animate-spin" color="#3b82f6" size={16} />
                <span>MedChain support is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder="Ask about medicine verification or navigation... (e.g., 'How to verify medicine?' or 'MED-2025-001-A')"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleUserMessage()}
            disabled={isLoading}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.outline = styles.inputFocus.outline;
              e.target.style.outlineOffset = styles.inputFocus.outlineOffset;
              e.target.style.borderColor = styles.inputFocus.borderColor;
            }}
            onBlur={(e) => {
              e.target.style.outline = 'none';
              e.target.style.borderColor = '#d1d5db';
            }}
          />
          <button 
            onClick={handleUserMessage}
            disabled={isLoading || !userInput.trim()}
            style={{
              ...styles.sendButton,
              ...(isLoading || !userInput.trim() ? styles.sendButtonDisabled : {})
            }}
            onMouseEnter={(e) => {
              if (!isLoading && userInput.trim()) {
                e.target.style.backgroundColor = styles.sendButtonHover.backgroundColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && userInput.trim()) {
                e.target.style.backgroundColor = styles.sendButton.backgroundColor;
              }
            }}
          >
            <Send size={18} />
            Send
          </button>
        </div>
        <div style={styles.inputFooter}>
          <span style={styles.footerLeft}>
            💡 Try: "Verify MED-2025-001-A", "Where is rewards program?", "Find pharmacies"
          </span>
          <span style={styles.footerRight}>
            <Shield size={12} />
            Secure verification powered by blockchain
          </span>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;