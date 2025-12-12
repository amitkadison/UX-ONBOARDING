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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

      {/* Full Screen Chat Canvas - No Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        width: '100%',
        minHeight: '100vh',
        paddingTop: '50px',
        paddingBottom: '100px',
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

        {/* Messages Area - Full Height Scroll Container */}
        <div className="hide-scrollbar" style={{
          height: '100vh',
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          direction: 'rtl',
          zIndex: 0,
        }}>
          {/* Top Spacer - Pushes first message below header */}
          <div style={{ height: '280px', width: '100%', flexShrink: 0 }} />

          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              }}
            >
              {/* User message - LEFT side (RTL) - Clean Crystal Champagne */}
              {message.role === 'user' && (
                <div
                  className="message-bubble"
                  style={{
                    alignSelf: 'flex-start',
                    width: 'fit-content',
                    maxWidth: '85%',
                    padding: '16px 24px',
                    borderRadius: '26px 26px 26px 4px',
                    background: 'linear-gradient(180deg, rgba(255, 252, 250, 0.85) 0%, rgba(255, 240, 235, 0.65) 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1.0), inset 0 -10px 20px rgba(255, 255, 255, 0.25)',
                    color: '#3F3C38',
                    fontSize: '17px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    lineHeight: '1.5',
                    textAlign: 'right',
                    direction: 'rtl',
                  }}>
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
                    maxWidth: '85%',
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
                    padding: '16px 24px',
                    borderRadius: '26px 26px 4px 26px',
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(240, 248, 255, 0.65) 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1.0), inset 0 -10px 20px rgba(255, 255, 255, 0.25)',
                    color: '#1E293B',
                    fontSize: '17px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    lineHeight: '1.5',
                    textAlign: 'right',
                    direction: 'rtl',
                  }}>
                    <p style={{ margin: 0, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{message.content}</p>

                    {/* Service Selection UI - Solid Porcelain Control Panel */}
                    {message.services && message.services.length > 0 && (
                      <div
                        className="control-panel"
                        style={{
                          marginTop: '20px',
                          padding: '28px',
                          background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                          borderRadius: '24px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 10px 15px -3px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1.0)',
                        }}>
                        <p style={{
                          fontSize: '15px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                          fontWeight: 400,
                          color: '#64748B',
                          letterSpacing: '-0.01em',
                          marginBottom: '16px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                          lineHeight: '1.5',
                        }}>
                          לחץ על השירותים שתרצה לפרסם (1-3):
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                          {message.services.map((service, idx) => {
                            const isSelected = tempSelectedServices.includes(service);
                            return (
                              <button
                                key={idx}
                                className="option-chip"
                                onClick={() => handleServiceToggle(service)}
                                disabled={!isSelected && tempSelectedServices.length >= 3}
                                style={{
                                  padding: '12px 24px',
                                  borderRadius: '50px',
                                  fontSize: '16px',
                                  fontWeight: 500,
                                  fontFamily: "'Heebo', -apple-system, BlinkMacSystemFont, sans-serif",
                                  border: isSelected
                                    ? '1px solid rgba(255, 220, 200, 0.7)'
                                    : '1px solid #E2E8F0',
                                  cursor: (!isSelected && tempSelectedServices.length >= 3) ? 'not-allowed' : 'pointer',
                                  background: isSelected
                                    ? 'linear-gradient(135deg, rgba(255, 245, 240, 0.95) 0%, rgba(255, 235, 230, 0.9) 100%)'
                                    : '#FFFFFF',
                                  color: isSelected ? '#423D38' : '#1E293B',
                                  boxShadow: isSelected
                                    ? '0 4px 15px rgba(255, 150, 100, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.9)'
                                    : '0 2px 4px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 1.0)',
                                  opacity: (!isSelected && tempSelectedServices.length >= 3) ? 0.4 : 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                {isSelected && <span style={{ fontSize: '16px' }}>✓</span>}
                                {service}
                              </button>
                            );
                          })}
                        </div>
                        {tempSelectedServices.length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                            <button
                              className="btn-haptic"
                              onClick={handleConfirmServices}
                              style={{
                                width: 'fit-content',
                                padding: '14px 32px',
                                borderRadius: '50px',
                                fontSize: '16px',
                                fontWeight: 600,
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                                border: '1px solid rgba(255, 220, 200, 0.5)',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, rgba(255, 240, 235, 0.95) 0%, rgba(255, 230, 220, 0.9) 100%)',
                                color: '#423D38',
                                boxShadow: '0 6px 20px rgba(255, 150, 100, 0.15), inset 0 2px 0 rgba(255, 255, 255, 1.0)',
                                transition: 'all 0.3s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 150, 100, 0.2), inset 0 2px 0 rgba(255, 255, 255, 1.0)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 150, 100, 0.15), inset 0 2px 0 rgba(255, 255, 255, 1.0)';
                              }}
                            >
                              המשך עם {tempSelectedServices.length} שירותים שנבחרו
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Customer Mapping Form - Solid Porcelain Control Panel */}
                    {message.showCustomerMapping && message.servicesForMapping && message.servicesForMapping.length > 0 && (
                      <div
                        className="control-panel"
                        style={{
                          marginTop: '20px',
                          padding: '28px',
                          background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
                          borderRadius: '24px',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 10px 15px -3px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1.0)',
                        }}>
                        <p style={{
                          fontSize: '15px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                          fontWeight: 400,
                          color: '#64748B',
                          letterSpacing: '-0.01em',
                          marginBottom: '16px',
                          paddingBottom: '12px',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                          lineHeight: '1.5',
                        }}>
                          למלא עבור כל שירות מי הלקוחות:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {message.servicesForMapping.map((service, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: idx > 0 ? '8px' : '0' }}>
                              <label style={{
                                fontSize: '15px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                                fontWeight: 600,
                                color: '#1E293B',
                                letterSpacing: '-0.01em',
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
                                  padding: '10px 14px',
                                  fontSize: '14px',
                                  border: '1.5px solid rgba(200, 200, 220, 0.4)',
                                  borderRadius: '10px',
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  outline: 'none',
                                  direction: 'rtl',
                                  textAlign: 'right',
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#8B2A9B';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 42, 155, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = 'rgba(200, 200, 220, 0.4)';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                          <button
                            onClick={() => handleConfirmCustomerMappings(message.servicesForMapping!)}
                            disabled={message.servicesForMapping.some(s => !customerMappings[s]?.trim())}
                            style={{
                              width: 'fit-content',
                              padding: '14px 32px',
                              borderRadius: '50px',
                              fontSize: '16px',
                              fontWeight: 600,
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                              border: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                                ? '1px solid rgba(200, 200, 220, 0.4)'
                                : '1px solid rgba(255, 220, 200, 0.5)',
                              cursor: message.servicesForMapping.some(s => !customerMappings[s]?.trim()) ? 'not-allowed' : 'pointer',
                              background: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                                ? 'rgba(240, 240, 245, 0.5)'
                                : 'linear-gradient(135deg, rgba(255, 240, 235, 0.95) 0%, rgba(255, 230, 220, 0.9) 100%)',
                              color: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                                ? '#999'
                                : '#423D38',
                              boxShadow: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                                ? 'none'
                                : '0 6px 20px rgba(255, 150, 100, 0.15), inset 0 2px 0 rgba(255, 255, 255, 1.0)',
                              opacity: message.servicesForMapping.some(s => !customerMappings[s]?.trim()) ? 0.6 : 1,
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!message.servicesForMapping?.some(s => !customerMappings[s]?.trim())) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(255, 150, 100, 0.2), inset 0 2px 0 rgba(255, 255, 255, 1.0)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              if (!message.servicesForMapping?.some(s => !customerMappings[s]?.trim())) {
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 150, 100, 0.15), inset 0 2px 0 rgba(255, 255, 255, 1.0)';
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
          ))}

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
                maxWidth: '85%',
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
                padding: '20px 28px',
                borderRadius: '26px 26px 4px 26px',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(240, 248, 255, 0.65) 100%)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 1.0), inset 0 -10px 20px rgba(255, 255, 255, 0.25)',
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

          {/* Bottom Spacer - Allows last message to scroll above input bar */}
          <div style={{ height: '80px', width: '100%', flexShrink: 0 }} />

          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Bottom Input Area - Glass Blur Effect - HARD OVERRIDE */}
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '0',
          width: '100%',
          height: 'auto',
          minHeight: '0',
          padding: '0',
          margin: '0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          zIndex: 100,
          background: 'transparent',
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            margin: '0 24px',
            borderRadius: '999px',
            width: '100%',
            maxWidth: '950px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0.4) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.08), inset 0 2px 4px 0 rgba(255, 255, 255, 0.9)',
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
                fontFamily: 'inherit',
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
