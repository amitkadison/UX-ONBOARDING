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

const avatarImage = "/image-removebg-preview (61).png";

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
      background: 'linear-gradient(135deg, #fdfbfb 0%, #f2f0fc 25%, #e8f4fc 50%, #f5f0fa 75%, #fdfbfb 100%)',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Heebo', 'Roboto', sans-serif",
    }}>

      {/* Google Font Import & Animations */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@600;700&family=Inter:wght@300;400;600&display=swap');

          /* Hide scrollbar */
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

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

      {/* Corner gradient blobs - Top Left - Soft Pastel */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50%',
        height: '55%',
        background: 'radial-gradient(ellipse at center, rgba(198, 80, 214, 0.15) 0%, rgba(198, 80, 214, 0.08) 40%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Corner gradient blobs - Top Right - Soft Pastel */}
      <div style={{
        position: 'absolute',
        top: '-5%',
        right: '-10%',
        width: '45%',
        height: '50%',
        background: 'radial-gradient(ellipse at center, rgba(149, 173, 229, 0.18) 0%, rgba(149, 173, 229, 0.09) 40%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Corner gradient blobs - Bottom Left - Soft Pastel */}
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-5%',
        width: '40%',
        height: '45%',
        background: 'radial-gradient(ellipse at center, rgba(149, 173, 229, 0.16) 0%, rgba(149, 173, 229, 0.08) 40%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Corner gradient blobs - Bottom Right - Soft Pastel */}
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '45%',
        height: '50%',
        background: 'radial-gradient(ellipse at center, rgba(198, 80, 214, 0.15) 0%, rgba(198, 80, 214, 0.08) 40%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Side accents for glass effect - Left */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '5%',
        width: '15%',
        height: '40%',
        background: 'radial-gradient(ellipse at center, rgba(198, 80, 214, 0.1) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Side accents for glass effect - Right */}
      <div style={{
        position: 'absolute',
        top: '35%',
        right: '5%',
        width: '15%',
        height: '35%',
        background: 'radial-gradient(ellipse at center, rgba(149, 173, 229, 0.35) 0%, transparent 70%)',
        filter: 'blur(40px)',
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
        paddingTop: '60px',
        paddingBottom: '120px',
      }}>

        {/* Fixed Header - Glass Style */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          padding: '24px 0',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
        }}>
          <h1 style={{
            margin: 0,
            textAlign: 'center',
            fontSize: '32px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #8B2A9B 0%, #5B3A8C 50%, #4A6FA5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.5px',
          }}>
            בואו נכיר
          </h1>
        </div>

        {/* Messages Area - Centered Column - RTL */}
        <div className="hide-scrollbar" style={{
          flex: 1,
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 24px',
          paddingTop: '120px',
          paddingBottom: '150px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          direction: 'rtl',
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              }}
            >
              {/* User message - LEFT side (RTL) - Super Shiny Glass with Purple Tint - Pill Shape */}
              {message.role === 'user' && (
                <div style={{
                  alignSelf: 'flex-start',
                  width: 'fit-content',
                  maxWidth: '85%',
                  padding: '16px 24px',
                  borderRadius: '30px',
                  background: 'rgba(139, 42, 155, 0.12)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), 0 8px 32px rgba(139, 42, 155, 0.15)',
                  color: '#2d1b35',
                  fontSize: '17px',
                  fontWeight: 400,
                  lineHeight: '1.65',
                  textAlign: 'right',
                  direction: 'rtl',
                }}>
                  {message.content}
                </div>
              )}

              {/* Assistant message - RIGHT side (RTL) with avatar on right - Super Shiny Clear Glass - Pill Shape */}
              {message.role === 'assistant' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'row-reverse',
                  alignSelf: 'flex-end',
                  gap: '12px',
                  alignItems: 'flex-start',
                  maxWidth: '85%',
                }}>
                  <div style={{
                    width: 'fit-content',
                    maxWidth: '100%',
                    padding: '16px 24px',
                    borderRadius: '30px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), 0 8px 32px rgba(0, 0, 0, 0.1)',
                    color: '#1a1a2e',
                    fontSize: '17px',
                    fontWeight: 400,
                    lineHeight: '1.65',
                    textAlign: 'right',
                    direction: 'rtl',
                  }}>
                    <p style={{ margin: 0, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{message.content}</p>

                    {/* Service Selection UI */}
                    {message.services && message.services.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
                          לחץ על השירותים שתרצה לפרסם (1-3):
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                          {message.services.map((service, idx) => {
                            const isSelected = tempSelectedServices.includes(service);
                            return (
                              <button
                                key={idx}
                                onClick={() => handleServiceToggle(service)}
                                disabled={!isSelected && tempSelectedServices.length >= 3}
                                style={{
                                  padding: '12px 24px',
                                  borderRadius: '50px',
                                  fontSize: '16px',
                                  fontWeight: 500,
                                  border: isSelected
                                    ? '1.5px solid rgba(140, 80, 255, 0.6)'
                                    : '1.5px solid rgba(140, 80, 255, 0.3)',
                                  cursor: (!isSelected && tempSelectedServices.length >= 3) ? 'not-allowed' : 'pointer',
                                  background: isSelected
                                    ? 'rgba(140, 80, 255, 0.25)'
                                    : 'rgba(140, 80, 255, 0.12)',
                                  backdropFilter: 'blur(10px)',
                                  WebkitBackdropFilter: 'blur(10px)',
                                  color: isSelected ? '#5B2A8C' : '#7B4AA5',
                                  boxShadow: isSelected
                                    ? '0 4px 16px rgba(140, 80, 255, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                                    : '0 2px 8px rgba(140, 80, 255, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
                                  opacity: (!isSelected && tempSelectedServices.length >= 3) ? 0.4 : 1,
                                  transition: 'all 0.3s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected && !(tempSelectedServices.length >= 3)) {
                                    e.currentTarget.style.background = 'rgba(140, 80, 255, 0.18)';
                                    e.currentTarget.style.border = '1.5px solid rgba(140, 80, 255, 0.5)';
                                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(140, 80, 255, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.background = 'rgba(140, 80, 255, 0.12)';
                                    e.currentTarget.style.border = '1.5px solid rgba(140, 80, 255, 0.3)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(140, 80, 255, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.2)';
                                  }
                                }}
                              >
                                {isSelected && <span style={{ fontSize: '16px' }}>✓</span>}
                                {service}
                              </button>
                            );
                          })}
                        </div>
                        {tempSelectedServices.length > 0 && (
                          <button
                            onClick={handleConfirmServices}
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '12px',
                              fontSize: '15px',
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              background: 'linear-gradient(135deg, #8B2A9B 0%, #5B3A8C 50%, #4A6FA5 100%)',
                              color: 'white',
                              boxShadow: '0 4px 16px rgba(139, 42, 155, 0.3)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            המשך עם {tempSelectedServices.length} שירותים שנבחרו
                          </button>
                        )}
                      </div>
                    )}

                    {/* Customer Mapping Form */}
                    {message.showCustomerMapping && message.servicesForMapping && message.servicesForMapping.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '12px' }}>
                          למלא עבור כל שירות מי הלקוחות:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {message.servicesForMapping.map((service, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>
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
                        <button
                          onClick={() => handleConfirmCustomerMappings(message.servicesForMapping!)}
                          disabled={message.servicesForMapping.some(s => !customerMappings[s]?.trim())}
                          style={{
                            width: '100%',
                            padding: '12px',
                            marginTop: '14px',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: message.servicesForMapping.some(s => !customerMappings[s]?.trim()) ? 'not-allowed' : 'pointer',
                            background: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                              ? 'rgba(200, 200, 220, 0.4)'
                              : 'linear-gradient(135deg, #8B2A9B 0%, #5B3A8C 50%, #4A6FA5 100%)',
                            color: 'white',
                            boxShadow: message.servicesForMapping.some(s => !customerMappings[s]?.trim())
                              ? 'none'
                              : '0 4px 16px rgba(139, 42, 155, 0.3)',
                            opacity: message.servicesForMapping.some(s => !customerMappings[s]?.trim()) ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                          }}
                        >
                          המשך
                        </button>
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
                  <div style={{
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                  }}>
                    <img
                      src={avatarImage}
                      alt="AI"
                      style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 3px 10px rgba(139, 42, 155, 0.2))',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Capsule - Super Shiny Glass */}
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '950px',
          zIndex: 100,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), 0 8px 32px rgba(0, 0, 0, 0.15)',
            direction: 'rtl',
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
                color: '#1a1a2e',
                fontFamily: 'inherit',
                direction: 'rtl',
                textAlign: 'right',
              }}
            />

            <button
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
