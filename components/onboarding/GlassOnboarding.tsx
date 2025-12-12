/**
 * Glass Onboarding Component
 * Beautiful glassmorphism design with owl avatar
 */

'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  services?: string[];
  selectedServices?: string[];
  serviceCustomerPairs?: Array<{ service: string; customers: string[] }>;
  showCustomerMapping?: boolean;
  servicesForMapping?: string[];
}

interface GlassOnboardingProps {
  onComplete: (data: any) => void;
}

const avatarImage = "/image-removebg-preview (60).png";

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2L13 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 2L9 22L13 13L22 9L2 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function GlassOnboarding({ onComplete }: GlassOnboardingProps) {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<'initial' | 'screen1' | 'screen2' | 'screen3' | 'complete'>('initial');
  const [sessionData, setSessionData] = useState<any>({});
  const [tempSelectedServices, setTempSelectedServices] = useState<string[]>([]);
  const [customerMappings, setCustomerMappings] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Smart Scroll: Detects message size and scrolls appropriately
  // Uses setTimeout to wait for DOM to fully paint the new message text
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      // Get all message row elements
      const messageRows = container.querySelectorAll('[data-message-row]');
      const lastMessageElement = messageRows[messageRows.length - 1] as HTMLElement;

      if (lastMessageElement) {
        // Get accurate measurements AFTER render is complete
        const messageHeight = lastMessageElement.getBoundingClientRect().height;
        const viewportHeight = window.innerHeight;
        const headerOffset = 180; // Size of Header + Top Safe Area
        const inputOffset = 120;  // Size of Input Bar
        const visibleSpace = viewportHeight - headerOffset - inputOffset;

        if (messageHeight > visibleSpace) {
          // SCENARIO A: Long Message - Scroll so TOP of message is visible
          console.log('Long message detected - Scrolling to START');
          lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // SCENARIO B: Short Message - Scroll to bottom as usual
          console.log('Short message detected - Scrolling to END');
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }, 100); // 100ms delay - critical for accurate height measurement!

    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Start conversation on mount
  useEffect(() => {
    if (messages.length === 0) {
      handleInitialGreeting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInitialGreeting = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMessages([{
      role: 'assistant',
      content: 'היי! אני כאן כדי להכיר את העסק שלך.\n\nקודם כל - יש לך אתר אינטרנט?'
    }]);
    setIsLoading(false);
  };

  const handleServiceToggle = (service: string) => {
    setTempSelectedServices(prev => {
      if (prev.includes(service)) {
        return prev.filter(s => s !== service);
      } else if (prev.length < 3) {
        return [...prev, service];
      }
      return prev;
    });
  };

  const handleConfirmServices = () => {
    if (tempSelectedServices.length > 0) {
      setInputValue(tempSelectedServices.join(', '));
      setTimeout(() => {
        handleSend();
        setTempSelectedServices([]);
      }, 100);
    }
  };

  const handleCustomerMappingChange = (service: string, value: string) => {
    setCustomerMappings(prev => ({
      ...prev,
      [service]: value,
    }));
  };

  const handleConfirmCustomerMappings = (services: string[]) => {
    const mappingString = services
      .map(service => `${service}:${customerMappings[service] || ''}`)
      .join('|');
    setInputValue(mappingString);
    setTimeout(() => {
      handleSend();
      setCustomerMappings({});
    }, 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Add 20 second delay for testing
      await new Promise(resolve => setTimeout(resolve, 20000));

      const response = await fetch('/api/onboarding/conversational-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentStage,
          sessionData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
        };

        // Add special data if present
        if (data.services) {
          assistantMessage.services = data.services;
        }
        if (data.selectedServices) {
          assistantMessage.selectedServices = data.selectedServices;
        }
        if (data.serviceCustomerPairs) {
          assistantMessage.serviceCustomerPairs = data.serviceCustomerPairs;
        }
        if (data.showCustomerMapping) {
          assistantMessage.showCustomerMapping = true;
          assistantMessage.servicesForMapping = data.servicesForMapping;
        }

        setMessages([...newMessages, assistantMessage]);

        // Update stage and session data
        if (data.stage) {
          setCurrentStage(data.stage);
        }
        if (data.sessionData) {
          setSessionData(data.sessionData);
        }

        // Check if complete
        if (data.isComplete) {
          setTimeout(() => {
            onComplete(data.finalData);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'סליחה, יש בעיה טכנית. נסה שוב.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      background: '#F8F9FD',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Heebo', 'Roboto', sans-serif",
    }}>

      {/* Google Font Import & Premium iOS Physics Animations */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@600;700&family=Inter:wght@300;400;600&family=Heebo:wght@400;500;600;700&display=swap');

          /* Hide scrollbar */
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          /* ===== PREMIUM iOS PHYSICS ANIMATIONS ===== */

          /* 1. Message Entry - Spring Pop with Bounce */
          @keyframes messageSlideIn {
            0% {
              opacity: 0;
              transform: translateY(24px) scale(0.92);
            }
            60% {
              opacity: 1;
              transform: translateY(-4px) scale(1.02);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .message-bubble {
            animation: messageSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }

          /* 2. Avatar Bounce Animation */
          @keyframes avatarBounce {
            0% {
              opacity: 0;
              transform: scale(0.5) rotate(-10deg);
            }
            50% {
              opacity: 1;
              transform: scale(1.15) rotate(5deg);
            }
            75% {
              transform: scale(0.95) rotate(-2deg);
            }
            100% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
          }

          .avatar-bounce {
            animation: avatarBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }

          /* 3. Option Chips - Staggered Cascade */
          @keyframes chipCascade {
            0% {
              opacity: 0;
              transform: translateY(16px) scale(0.9);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .option-chip {
            opacity: 0;
            animation: chipCascade 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .option-chip:nth-child(1) { animation-delay: 0ms; }
          .option-chip:nth-child(2) { animation-delay: 60ms; }
          .option-chip:nth-child(3) { animation-delay: 120ms; }
          .option-chip:nth-child(4) { animation-delay: 180ms; }
          .option-chip:nth-child(5) { animation-delay: 240ms; }
          .option-chip:nth-child(6) { animation-delay: 300ms; }
          .option-chip:nth-child(7) { animation-delay: 360ms; }
          .option-chip:nth-child(8) { animation-delay: 420ms; }

          /* 4. Option Chip Hover - iOS Haptic Feel */
          .option-chip:hover:not(:disabled) {
            transform: translateY(-3px) scale(1.03);
            background: #FFF8F6 !important;
            border-color: rgba(255, 200, 180, 0.7) !important;
            box-shadow: 0 8px 20px rgba(255, 150, 100, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1.0) !important;
          }

          .option-chip:active:not(:disabled) {
            transform: scale(0.95);
            transition: transform 0.1s ease;
          }

          /* 5. Selected Chip - Pulse Glow */
          @keyframes selectedPulse {
            0%, 100% {
              box-shadow: 0 4px 15px rgba(255, 150, 100, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.9);
            }
            50% {
              box-shadow: 0 4px 25px rgba(255, 150, 100, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.9);
            }
          }

          .option-chip-selected {
            animation: selectedPulse 2s ease-in-out infinite;
          }

          /* 6. Control Panel Slide Up */
          @keyframes panelSlideUp {
            0% {
              opacity: 0;
              transform: translateY(30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .control-panel {
            animation: panelSlideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            animation-delay: 0.2s;
            opacity: 0;
          }

          /* 7. Button Press - iOS Haptic */
          .btn-haptic {
            transition: all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .btn-haptic:hover {
            transform: translateY(-2px);
          }

          .btn-haptic:active {
            transform: scale(0.95);
            transition: transform 0.08s ease;
          }

          /* 8. Send Button Pulse when Active */
          @keyframes sendPulse {
            0%, 100% {
              box-shadow: 0 4px 16px rgba(139, 42, 155, 0.25);
            }
            50% {
              box-shadow: 0 4px 24px rgba(139, 42, 155, 0.4);
            }
          }

          .send-btn-active {
            animation: sendPulse 1.5s ease-in-out infinite;
          }

          /* 9. Typing Indicator Dots */
          @keyframes typingDot {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.4;
            }
            30% {
              transform: translateY(-8px);
              opacity: 1;
            }
          }

          .typing-dot {
            animation: typingDot 1.4s ease-in-out infinite;
          }
          .typing-dot:nth-child(1) { animation-delay: 0ms; }
          .typing-dot:nth-child(2) { animation-delay: 200ms; }
          .typing-dot:nth-child(3) { animation-delay: 400ms; }

          /* Generating Loader Animations */
          @keyframes loader-rotate {
            0% {
              transform: rotate(90deg);
              box-shadow:
                0 10px 20px 0 #fff inset,
                0 20px 30px 0 #ad5fff inset,
                0 60px 60px 0 #471eec inset;
            }
            50% {
              transform: rotate(270deg);
              box-shadow:
                0 10px 20px 0 #fff inset,
                0 20px 10px 0 #d60a47 inset,
                0 40px 60px 0 #311e80 inset;
            }
            100% {
              transform: rotate(450deg);
              box-shadow:
                0 10px 20px 0 #fff inset,
                0 20px 30px 0 #ad5fff inset,
                0 60px 60px 0 #471eec inset;
            }
          }

          @keyframes loader-letter-anim {
            0%, 100% {
              opacity: 0.4;
              transform: translateY(0);
            }
            20% {
              opacity: 1;
              transform: scale(1.15);
            }
            40% {
              opacity: 0.7;
              transform: translateY(0);
            }
          }
        `}
      </style>

      {/* ===== DEEP MESH AURORA BACKGROUND ===== */}

      {/* Top-Left (Deep Violet) */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-15%',
        width: '70vw',
        height: '70vw',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%)',
        filter: 'blur(120px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Top-Right (Electric Blue) */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '-10%',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Bottom-Left (Warm Peach) */}
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '70vw',
        height: '70vw',
        background: 'radial-gradient(circle, rgba(255, 160, 122, 0.2) 0%, transparent 70%)',
        filter: 'blur(120px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Bottom-Right (Soft Lavender) */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        right: '0',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(192, 132, 252, 0.15) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Glass Column - Center Stage Layout */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        minHeight: '100vh',
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
        borderRight: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 0 80px rgba(0, 0, 0, 0.03)',
      }}>

        {/* Fixed Header - Glass Blur Effect - HARD OVERRIDE */}
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: 'auto',
          minHeight: '0',
          padding: '35px 0 10px 0',
          margin: '0',
          zIndex: 100,
          background: 'transparent',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {/* Title Text - iOS Typography */}
          <h1 style={{
            margin: 0,
            textAlign: 'center',
            fontSize: '42px',
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            color: '#4A2C6D',
            letterSpacing: '-0.5px',
          }}>
            Let's Get to Know Each Other
          </h1>

          {/* Gradient Bar Image */}
          <img
            src="/Group 33061.png"
            alt=""
            style={{
              marginTop: '-6px',
              width: '650px',
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Messages Area - Inside Glass Column */}
        <div
          ref={messagesContainerRef}
          className="hide-scrollbar"
          style={{
            height: '100vh',
            width: '100%',
            padding: '180px 32px 140px 32px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            direction: 'rtl',
            zIndex: 0,
            scrollPaddingTop: '180px',
          }}>

          {messages.map((message, index) => {
            // Grouping Logic: Check if same speaker as previous message
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isSameSpeaker = prevMessage && prevMessage.role === message.role;
            const marginTop = index === 0 ? '0' : (isSameSpeaker ? '8px' : '24px');

            return (
            <div
              key={index}
              data-message-row
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                marginTop,
                scrollMarginTop: '200px',
              }}
            >
              {/* User message - LEFT side (RTL) - Frosted Amber */}
              {message.role === 'user' && (
                <div
                  className="message-bubble"
                  style={{
                    alignSelf: 'flex-start',
                    width: 'fit-content',
                    maxWidth: '75%',
                    padding: '14px 22px',
                    borderRadius: '24px 24px 24px 6px',
                    background: 'linear-gradient(135deg, rgba(255, 250, 245, 0.95) 0%, rgba(255, 230, 220, 0.85) 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), inset 0 2px 4px rgba(255, 255, 255, 1.0)',
                    color: '#422006',
                    fontSize: '16px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.42',
                    textAlign: 'right',
                    direction: 'rtl',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                  } as React.CSSProperties}>
                  {message.content}
                </div>
              )}

              {/* Assistant message - RIGHT side (RTL) with avatar on left */}
              {message.role === 'assistant' && (
                <div
                  className="message-bubble"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignSelf: 'flex-end',
                    gap: '12px',
                    alignItems: 'flex-end',
                    maxWidth: '75%',
                  }}>
                  <div
                    className="avatar-bounce"
                    style={{
                      flexShrink: 0,
                      marginBottom: '4px',
                    }}>
                    <img
                      src={avatarImage}
                      alt="AI"
                      style={{
                        width: '44px',
                        height: '44px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                      }}
                    />
                  </div>
                  <div style={{
                    width: 'fit-content',
                    maxWidth: '100%',
                    padding: '14px 22px',
                    borderRadius: '24px 24px 6px 24px',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(235, 248, 255, 0.85) 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid #FFFFFF',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 1.0)',
                    color: '#0F172A',
                    fontSize: '16px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    lineHeight: '1.42',
                    textAlign: 'right',
                    direction: 'rtl',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                  } as React.CSSProperties}>
                    <p style={{ margin: 0, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{message.content}</p>

                    {/* Service Selection UI - Frosted Moonstone Glass Card */}
                    {message.services && message.services.length > 0 && (
                      <div
                        className="control-panel"
                        style={{
                          marginTop: '20px',
                          padding: '24px',
                          background: 'rgba(255, 255, 255, 0.75)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          borderRadius: '20px',
                          border: '1px solid rgba(255, 255, 255, 0.6)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                        }}>
                        <p style={{
                          fontSize: '14px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                          fontWeight: 500,
                          color: '#64748B',
                          letterSpacing: '-0.015em',
                          marginBottom: '16px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                          lineHeight: '1.55',
                        }}>
                          לחץ על השירותים שתרצה לפרסם (1-3):
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                          {message.services.map((service, idx) => {
                            const isSelected = tempSelectedServices.includes(service);
                            return (
                              <button
                                key={idx}
                                className={`option-chip ${isSelected ? 'option-chip-selected' : ''}`}
                                onClick={() => handleServiceToggle(service)}
                                disabled={!isSelected && tempSelectedServices.length >= 3}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: '50px',
                                  fontSize: '15px',
                                  fontWeight: 500,
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                                  letterSpacing: '-0.015em',
                                  border: isSelected
                                    ? '1.5px solid rgba(255, 180, 150, 0.8)'
                                    : '1px solid rgba(0, 0, 0, 0.08)',
                                  cursor: (!isSelected && tempSelectedServices.length >= 3) ? 'not-allowed' : 'pointer',
                                  background: isSelected
                                    ? 'linear-gradient(135deg, rgba(255, 220, 200, 0.9) 0%, rgba(255, 190, 160, 0.8) 100%)'
                                    : '#FFFFFF',
                                  color: isSelected ? '#422006' : '#0F172A',
                                  boxShadow: isSelected
                                    ? '0 4px 12px rgba(255, 150, 100, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
                                    : '0 2px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1.0)',
                                  opacity: (!isSelected && tempSelectedServices.length >= 3) ? 0.4 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                }}
                              >
                                {isSelected && <span style={{ fontSize: '14px' }}>✓</span>}
                                {service}
                              </button>
                            );
                          })}
                        </div>
                        {tempSelectedServices.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px' }}>
                            <button
                              className="btn-haptic"
                              onClick={handleConfirmServices}
                              style={{
                                width: 'fit-content',
                                padding: '12px 28px',
                                borderRadius: '50px',
                                fontSize: '15px',
                                fontWeight: 600,
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                                letterSpacing: '-0.015em',
                                border: '1.5px solid rgba(255, 180, 150, 0.6)',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, rgba(255, 220, 200, 0.95) 0%, rgba(255, 180, 150, 0.85) 100%)',
                                color: '#422006',
                                boxShadow: '0 8px 20px -5px rgba(255, 150, 100, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 28px -5px rgba(255, 150, 100, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 20px -5px rgba(255, 150, 100, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
                              }}
                            >
                              המשך עם {tempSelectedServices.length} שירותים שנבחרו
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Customer Mapping Form - Frosted Moonstone Glass Card */}
                    {message.showCustomerMapping && message.servicesForMapping && message.servicesForMapping.length > 0 && (
                      <div
                        className="control-panel"
                        style={{
                          marginTop: '20px',
                          padding: '24px',
                          background: 'rgba(255, 255, 255, 0.75)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          borderRadius: '20px',
                          border: '1px solid rgba(255, 255, 255, 0.6)',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                        }}>
                        <p style={{
                          fontSize: '14px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                          fontWeight: 500,
                          color: '#64748B',
                          letterSpacing: '-0.015em',
                          marginBottom: '16px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                          lineHeight: '1.55',
                        }}>
                          למלא עבור כל שירות מי הלקוחות:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {message.servicesForMapping.map((service, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: idx > 0 ? '8px' : '0' }}>
                              <label style={{
                                fontSize: '14px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                                fontWeight: 600,
                                color: '#0F172A',
                                letterSpacing: '-0.015em',
                              }}>
                                {service}
                              </label>
                              <input
                                type="text"
                                placeholder="למשל: זוגות, מנהלי HR, בעלי עסקים קטנים..."
                                value={customerMappings[service] || ''}
                                onChange={(e) => handleCustomerMappingChange(service, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  fontSize: '15px',
                                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                                  fontWeight: 500,
                                  letterSpacing: '-0.015em',
                                  border: '1px solid rgba(0, 0, 0, 0.08)',
                                  borderRadius: '12px',
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                                  outline: 'none',
                                  direction: 'rtl',
                                  textAlign: 'right',
                                  transition: 'all 0.2s ease',
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = 'rgba(255, 180, 150, 0.8)';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 150, 100, 0.15), inset 0 1px 2px rgba(0, 0, 0, 0.04)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.04)';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px' }}>
                          <button
                            className="btn-haptic"
                            onClick={() => handleConfirmCustomerMappings(message.servicesForMapping!)}
                            disabled={message.servicesForMapping.some(s => !customerMappings[s]?.trim())}
                            style={{
                              width: 'fit-content',
                              padding: '12px 28px',
                              borderRadius: '50px',
                              fontSize: '15px',
                              fontWeight: 600,
                              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                              letterSpacing: '-0.015em',
                              border: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                                ? '1px solid rgba(0, 0, 0, 0.08)'
                                : '1.5px solid rgba(255, 180, 150, 0.6)',
                              cursor: message.servicesForMapping.some(s => !customerMappings[s]?.trim()) ? 'not-allowed' : 'pointer',
                              background: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                                ? 'rgba(240, 240, 245, 0.5)'
                                : 'linear-gradient(135deg, rgba(255, 220, 200, 0.95) 0%, rgba(255, 180, 150, 0.85) 100%)',
                              color: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                                ? '#94A3B8'
                                : '#422006',
                              boxShadow: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                                ? 'none'
                                : '0 8px 20px -5px rgba(255, 150, 100, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                              opacity: message.servicesForMapping.some(s => !customerMappings[s]?.trim()) ? 0.6 : 1,
                              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            }}
                            onMouseEnter={(e) => {
                              if (!message.servicesForMapping?.some(s => !customerMappings[s]?.trim())) {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 12px 28px -5px rgba(255, 150, 100, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              if (!message.servicesForMapping?.some(s => !customerMappings[s]?.trim())) {
                                e.currentTarget.style.boxShadow = '0 8px 20px -5px rgba(255, 150, 100, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
                              }
                            }}
                          >
                            המשך
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Service-Customer Pairs Table */}
                    {message.serviceCustomerPairs && message.serviceCustomerPairs.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid rgba(200, 200, 220, 0.3)' }}>
                              <th style={{ textAlign: 'right', padding: '8px', fontWeight: 700 }}>שירות</th>
                              <th style={{ textAlign: 'right', padding: '8px', fontWeight: 700 }}>לקוחות</th>
                            </tr>
                          </thead>
                          <tbody>
                            {message.serviceCustomerPairs.map((pair, idx) => (
                              <tr key={idx} style={{ borderBottom: idx === message.serviceCustomerPairs!.length - 1 ? 'none' : '1px solid rgba(200, 200, 220, 0.2)' }}>
                                <td style={{ padding: '8px' }}>{pair.service}</td>
                                <td style={{ padding: '8px', color: '#666' }}>
                                  {pair.customers.join(', ')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            );
          })}

          {/* Typing Indicator - Shows when bot is thinking */}
          {isLoading && (
            <div
              className="message-bubble"
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignSelf: 'flex-end',
                gap: '12px',
                alignItems: 'flex-end',
                maxWidth: '75%',
              }}>
              <div
                className="avatar-bounce"
                style={{
                  flexShrink: 0,
                  marginBottom: '4px',
                }}>
                <img
                  src={avatarImage}
                  alt="AI"
                  style={{
                    width: '44px',
                    height: '44px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                  }}
                />
              </div>
              <div style={{
                padding: '18px 24px',
                borderRadius: '24px 24px 6px 24px',
                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(235, 248, 255, 0.85) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid #FFFFFF',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255, 255, 255, 1.0)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span className="typing-dot" style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#A78BFA',
                }} />
                <span className="typing-dot" style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#38BDF8',
                }} />
                <span className="typing-dot" style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#C084FC',
                }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Bottom Input Area - Docked Inside Glass Column */}
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '820px',
          padding: '0 20px',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 22px',
            borderRadius: '999px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 1.0)',
            direction: 'rtl',
            pointerEvents: 'auto',
          }}>
            <input
              type="text"
              placeholder="הקלד הודעה..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                fontWeight: 500,
                color: '#0F172A',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, sans-serif',
                letterSpacing: '-0.015em',
                direction: 'rtl',
                textAlign: 'right',
              }}
            />

            <button
              className={inputValue.trim() && !isLoading ? 'btn-haptic send-btn-active' : ''}
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isLoading || !inputValue.trim()
                  ? 'rgba(200, 200, 220, 0.3)'
                  : 'linear-gradient(135deg, #8B2A9B 0%, #5B3A8C 100%)',
                borderRadius: '50%',
                border: 'none',
                cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(139, 42, 155, 0.25)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
