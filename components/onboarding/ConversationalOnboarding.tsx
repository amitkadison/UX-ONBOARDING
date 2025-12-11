/**
 * ConversationalOnboarding Component
 * Complete conversational flow following Agent B prompt structure
 * Screens: 1) Product/Services Selection → 2) Customer Mapping → 3) Category Questions
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, User, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  services?: string[];
  selectedServices?: string[];
  serviceCustomerPairs?: Array<{ service: string; customers: string[] }>;
  showCustomerMapping?: boolean;
  servicesForMapping?: string[];
}

interface ConversationalOnboardingProps {
  onComplete: (data: any) => void;
}

export function ConversationalOnboarding({ onComplete }: ConversationalOnboardingProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<'initial' | 'screen1' | 'screen2' | 'screen3' | 'complete'>('initial');
  const [sessionData, setSessionData] = useState<any>({});

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start conversation
  useEffect(() => {
    if (messages.length === 0) {
      handleInitialGreeting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInitialGreeting = async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setMessages([{
      role: 'assistant',
      content: 'היי! אני כאן כדי להכיר את העסק שלך.\n\nקודם כל - יש לך אתר אינטרנט?'
    }]);

    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
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
      console.error('[ConversationalOnboarding] Error:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'סליחה, יש בעיה טכנית. אפשר לנסות שוב?'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const [tempSelectedServices, setTempSelectedServices] = useState<string[]>([]);
  const [customerMappings, setCustomerMappings] = useState<Record<string, string>>({});

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
        handleSendMessage();
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
    // Format: service1:customers1|service2:customers2
    const mappingString = services
      .map(service => `${service}:${customerMappings[service] || ''}`)
      .join('|');

    setInputValue(mappingString);
    setTimeout(() => {
      handleSendMessage();
      setCustomerMappings({});
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Owl image base64
  const owlImage = "data:image/webp;base64,UklGRjAUAABXRUJQVlA4WAoAAAAgAAAAVgEAVgEASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZWUDggQhIAANB9AJ0BKlcBVwE+USiRRaOioZNbRNQ4BQSxt3C5hCKkFi7OL/R7UDankf7P6f1e/sP4x/tXH9Wt5onkH7J/0v8T+anzn9HX6t9gb9XP2N9b71P/870B+cR6bv269hX+T/+XraPQ18u32gv2z/XPMLWnf7jl9JtpyX8h/KseO8i32COcdfl3ngFuGG3PALcMGJEOU6EBbauA0IYXwd8Nq7zdIOOe1Z+zJbgAAmLXgHqo5r6swSR1f0HESEWnrrvmVj3b1AwXdnCAXIEjFXiDFfvVQZ8RxNVU9+Ov98z1zS+81zFuuEH7ShyAGYnNFC6OWd5Oacs9Q1w5Gv6Wnwq0QEen/leDS5NH6Tc8vzZsOTpGrGfkBgCE3L5Q8D/64WAvfrikY+BzMczCLKA147P9ybMpDKijUgWrAFt0uJ9kcruRX9rrlCHhCTss8RSOj3DzQOQQoCOF5q5HpmUXVS7N2hHnjOwQlDxWjatfev3rkzO0XJYf1jTcwlzoGoSF7y/aHR/fQbLKROsAkioDCCYj7h7MnyUlEJeUHWW+gnIog+Ek0c6urJW1Z3I7FdlWHK+N+rdz/gNHdxUzJe5hPV8qoaoQVU7TV2iW7pg9gNdBD2NOrmQ+re/TuvbXWZf+du8clhQpynAszREdMNE9MCPkUtkQoqUTQik8zHNK+bSCxsJPKYYJTK599Rm5etNFAiN9rDOEicL6pckNVgLtWHpgbkFB07oQk5T75tmVBaJvfN/81Y/mn7duOegiWVTKplQBK8ex5vsERf857zQa70upiAkOeDlJQ26KKp+eb+/G+pOdgS1+Pd5Hle24YaP5/uOP6cyNk7DKrJjH4J5NrAAVvZLsG/KJfz/XrxLrRLaCdBg2aqj5YoC3Q+5ZGRr9ZkUNoFk3nR9Slr8u5o8falx/gV9A+75oN8ut2BZUUiy4+syvvxciyWZrjlL35aumGG15r5Z6FMsnA/QLD216rjnPWnsMn05nnLKoxYpE5xhWROEebBFdTmGmnAekscd4wKX7ptBQRtL6melolneWDT7e8hB+FbmYFcRvJdyKX4urtcNvKIAg6/Lt7TYbNVm1JX7KU7UJzJUoIZpGQIdG989umXt8nzBtyhA2NcW4vvjDTb+dBw/9AiLq5sxHw4Ce+AW2+7DvDisAWoHcukwPo1DhBr3kZeAHtH+Ec+aHhTJeOObZr/rofNHeYXkdXOVC7paJ2S7zvvNGhTr26+QQ2gNhy2v1TTGi7bsAH1V0x3oXBmJG55F5ji6KRPfmDa9AbH8runSDPBmYhNT+rTFcbiHOakVx1+XeeAW4YbdAcW4YbdCQFS3/LvPALcMNueAW4Ybc8Atww2533AAA/v+TfAAA4UJ9MEsFoRkFfURJUbFhp2LVnCiPF/dQUDFAPoCGUKv8ijtuT8fn7i/YMai1iNnOsTihK+bLcGEr5CeQiHZfH+Qf0JfsB4Z499rYRXvSjuRlU3EF+avhIbsKiXSDwP2J3KdUdged6XgMg2aOYNjlEhfNku3nqm+8vrvlwi6UpVkccNdQU0+HJg+Wll4lTbzAOnJ2WU8nMqLynIvx0KyEi6ySPwF38MLR+b/YPp/VD6tMGGfxxeiuri/o1Qder35QWBMdwGafsvHqoIoM8LiK6ZrzlD6um3BLr4PtLGtvG3AHLdpnEkUm6dsoBmOKWQUx03l4ADU/GE6I5XdS7Ds82D43/KqZ8DdiqJFuR2BbjEJ/dXkyR98oEhx2xX30qN6cpypzg+xIYYTvyARUxoID/ugioOJjDO/SZS8LdvtAqBdlEyQJuUkyEVzAPz+6yziHXKPoaDucTNsdoWYYUaLKAHOxAqYUxfwbSLTzAMpLcToHArSAiSfHJ8Wt7pqqGx5SUi+3d3VouW0phiRkQypPWcrfdY45neD646YgCTvVU0fuka+X8LAzvEbN5TxfZCQsyO4UsczH04/U9PWkKMUDDDP9MoBk8Rgk1rDHWUCxsY6YvVI/uxhBfYEfEPbY24QkSvt0o2V33j4z2kf12fuutepFmDYg9MK+tA7PuGTIOszlQAqV1I+8sri8nlK8+fl0BfTHdeNs1Q3D4xWiEfaWP7poevGCyTb0y9hVvpDR3g9xFkJwSwFde3E83Jb8YlDk1CopCa1c9PplFiG6SQDhjSOM4lsKxGslZmz6XbQ01iervvbpiYZ0F/dtXKnulLS0UCmMqDrM4NcJvanohwwTresR9NIpK5vCpR5oQI0ie8ybmIg5NuE+Zj7v+lgwKrGZrz9Orqd1LgQIgw8xq1NEvX7GD39GSTbAkL+Tp7WEgEQszQVCNuVjSA3nu3N3h5sQB6eCHljcrxvM76Nnpv0NL9i8TY96BYqdEWEcSsGn2s2KBGifnaANpgLnP+YRugw54NIgyRGUYkl9rckCd+1sl08gRExgKVlinqGF0igRN5g9IDmFtR/tgRQYCQ2qL85fQeJPzwACv+RBYBMTyxtM8i7rAPyvRjjX/yo/YRADvMr9sNEzY4VKMsciiXsch7NWcrDvlAVhPmx/GCu5sEfxkr1XWUYZA1q/bLEYsw3TroshGNQ2FV/E+vp7zscu9cd2/YzA0CCb9z7bCqLnvqX/sNkZdazqDZjDbjrGRbV6APgrdgtqmPRUyHaOEfJsoUtOcpHukvWmosiken2///j/HIa5v5kY/skaBe1fpoWBM1WDUy/bnS/nmozz9snrw2wxB2skOj+7vtiezEit50nXFXzLL3SWN6HxR0/1FdI1YecyWgjGDNIqRRMoWDxw12lJqy7MP4dc3rYcmuTTBF/nOape2SXm3WgLvDDLvW1SqhrXMYtQfEYVBJwh0pDrhEamXWmXXABp7nF9ThHk6ChxEi4hmlfFQyNqJ/IXgGxVxhR7cuXMRo0MowiRtzLw8LeVIfXSYZeVRqk6Ny+OgK53ppY2aDOnPFAI3/zEujlscjKTyEM9/mk2tKvZ1uSidI9PDw2IhgKFkXhn8lVjUzbTlQmgpjqVgE/FsLobTvsN+JS+VVSVA+fnGcoFEPqB+x6ZbHUSPlk4vTr+VfjvfeyEd2RXcVEIdC3LWCeGivAd2bxfsYZ+KUqZEH7b8mRlK6HDoV5kkEBXHw1UUMKdavhHT7Nvj+n1tN2KhCb+CSwklSdMZto69JpXFbOPvwP2Zcazl26NpexRe5+l31BFsQDJ2mRtDoPppm8ucPoVd0qQZxHu8KstIBvmcXKz2K+DL7rEBnaSiMn+bNLZLPAPng0urd6MOC7f2V488oTM2ubvt6dunfWpo16DumBfUhZ+T9+goDAS6MMtkTy0T8o3ZCysJYjs8JiQ+boa9b4giERYxqkfA9O+pxsIYWypYqpXKQQ5iQk19z/ZQ4bX36uYHr4ttmFEkqcyFHdgRT9l8IxwF1Ec5LKrx3QZtlnkcbsDSJ8ykIK8cHlLPV6r618PmAmdLZEhiwy9dNqKsT0GUf8s1jH8cY4LO2bDiTAIIuKi65Dj3D5LLr/aymkhESz/ojedHprpMh/Cd3ZaHTCPCwNqsadW4Y3wLB/15k/Vw+LGL/NaIi3jSk0/Kznh2ifA47bsieymDJphH4Bk7YVUZCpZhq4IVD9oXEb2Cc862geL/xjeyqQ/OoiOFMtBf27wxkp8oy6Jdi0Z6HJ7dsENnC4NrHtpUNzjoqNEkwHxivMh3ox/IcFfhlh6GWqj4ddEsWMvuxTP06d3/rarCAeMuBEqvwev4uQCvOhwiWvqJITN8Bc64oiV34ZFU6TIbbN9RAPb34PKkeBO9YViv0zLWEAANuUMQEtIyJOZQBnI3R8UbtH8emGcqEzdlmzPjVq4+pLqEfFHeQcjZa3jUFUUNID6qD4PTCKEUnrepBcMLrmJtEPKgVtuIBPxFCIfewrM0UcEQTWumDOrJ1ygaNloHL/21XOsU40fsuWrxQXQjc/48WaUGKqhcpPW+6devy8Qi25I2IJ6mQRGIVe5kqOv48f88BcfoLMQhEWqYluJTad0KhuLs/wAiQpA8TVw/bvHzwaFaW8UZ3VRDcxqareiI21MONU2LqWVgO0w/EjEQeRWne48ECTxpo8ui0NKGsWG54iq7HC6NjlapZRswGs0Yp/xn7cslVmd+qFuRUpxj/TRsRR1mTc/C1TFtDnsGovPcF4YUUt3tf96GIWnFT3ZtznUIqWZzPE3lLWxj5eirs230KU8elq7Qgiur0mMdt5QAoeQ2bR1Ff3GT6bgECplBZRy2u3NJDrlGQdSSVJWqlqMX11KPmnqiO+Z1ELLIE1YQPUtZLqo4OnncM2vj/Y7pDqyD9sA8LtEZYVpB+9A94OPaEC9vtXlAWL1BR8jUv1ZWYlTg+do9+iHOvH1HcLyBBukyViTde4BaJd6xjfcrvcIh/kzbT1NSJdp2K0LdymAOHETPtWqaGZ5yr7pEKV3+z6hCCKDvdFm6I7Mua3NuSsphnyQRX/7zODaMHNonv3ZvBoS5c1f51R6mzJKipvSjQnLol9fEjp0+2txfRkYhAqJy/VNHSG6W1onUetjXj/QH/GBj3X7ptA9MD42DXFTkzfLAWCsD4qE6lRBgV5jz736QkqjY1/zpTCJda1rOX/8IRGg//wI6FYYESfJ+5C6+bjMdczMX/18TKP0wMfvcefH3G1vTpQxLYwGtFmg/Y3RbRNm0ukmX/86Z4IvAcZXcqxHFTXP+RtVM/bnWNVIL2ea3AJGCvFXTNuKG9BgoNQaGOv7aTrSFjU32uzkGQvu7DVgd+LmrgWontrM9NXn+wE0GIC9Tlj7gNZrvtHI2AvO9KjyUAcr87pHL7FI2BYIuk/l+4Iu446ht4ioZVCgpU4Xd04I6/ivHpgaPTmcbmoKYkCSFAonxgBG+tvzARRa23B64DmDwzVD/PuR4+wmbQxaPqfQ5Em44W6b9BhWJzXlgLpqwNWBl+ixXxLPpLNBOHfOMQB9jKJ6QkuBhI+tEMRdN5xcnILe4BSamWBRTYrHwe6aH0yg6VYPNWx2rw/PqWWS8L+mOC2/iO2Wdxp5KRAgOx81jv2+KtngEiWyrc7MAuSWXX6y6/fcUGkLoIOalZHp6uBC26y0ZhTmDarsKD9gkB798TgsbHv6k5Eyq4FIhSrn8pOkPy4VbGMbCng3dfXffMv5rOi8azyFvV9ge8jjp231z2+WUc/ZMtoXFYvmoVPV8Sm0bQa5458TlIQZLg9TWg+gPPHrte6KUTGnmAQ/JKpEhCB1NWQCnb9Q48kW6erwS+64lAbBqI3zXnFpBrZXUhhRN0IgjK+YAFuZ4ISLjqnSdtbNFMhqx8UIcBtlNcFvsn4tKvl35AG63xzECrsUjeJz6goR0KlCBpv192pMYpVFIfs93Vp8XUXRqrL6WxroVScZUeTh+6cNCOpe2GtoB43JrT80pOgry0KNJXDPZ1WhwORXYvzFNharD2eAt0NCXdomcvgc8dBCz8AyG6SR+1CLzf5n+OFSUOqdw11S9rQtp0tIh0RujTKnRPmSoN5pIEQ5+fLTcF6eocy9ABs2iL2HlLSe1Vno0qHN7RkVHPcYbWfXeb8cyGYv8ThYn+pZFKzB5J26lh5Om5jrzpGlPkfEG9gH7lM1PPia9HrgQINEsHZZF+uipH2Ujbc7eNI636YPZF+8TYU/Y+kXOEuDCN7bxtZz/ruebCaS4AmAxXfAAjvTBD6OvlvUyqTpBOa1vtEMwsvK8KTH02Cvhtl81kvUcMfb2+cVyTRne6sEZ6GlrUyXxTNWOQVVuOX/zkgiF4Ed+0zfU6EAk3pi8Nhxwg5T6q1sJL8TbEjsBCmuS1sN2tkvDWMifeeu/2ajMjxF7pcrDNvJqE+T5zpLqEqzwskB3CPpglcB0CVCW5yur6VUat9r7yoaE9qtIYwWnqJlr+tv9I8/Z4C183EVesBtDY5BOvvr2fH+DKBKKCpATVnaL2uB+6ZxApfJ9mbgZg0gx4Vb/r97UqQY1PFeN9W7xLoFKQJLkkp3mh+CFD272eLrddsjhCU4ABrkbF3GrglKrn109tW+eeGlsX6XKHABEfI3GV2tn8V/aUOH1kXWKeVflLPLKZm3jsSxq0vO2dTNQ0T1dS06jx5Z54yH27A4/LJwqPk+0qXRfn2NL6Fk/0BAQ14c4CiXDOilJte9M7K6SYh9AOQ+ettVf1aRM+KXRbnX6NX527ez7W34Dt0vBy3GXAD28nl7WzcRjEO1McaBEwi77lMcx81fx9HZPJUDTIdqeuZzgh8AACYQBBnQAawAAAAAAA==";

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #fdfbfb 0%, #f2f0fc 25%, #e8f4fc 50%, #f5f0fa 75%, #fdfbfb 100%)',
      padding: '40px 24px',
      fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      gap: '28px',
    }} dir="rtl">

      {/* Google Font Import */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@600;700&display=swap');
        `}
      </style>

      {/* Background gradient blobs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '45%',
        height: '50%',
        background: 'radial-gradient(ellipse at center, rgba(198, 80, 214, 0.5) 0%, rgba(198, 80, 214, 0.2) 40%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        position: 'absolute',
        top: '-5%',
        right: '-10%',
        width: '40%',
        height: '45%',
        background: 'radial-gradient(ellipse at center, rgba(149, 173, 229, 0.55) 0%, rgba(149, 173, 229, 0.2) 40%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Title */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
      }}>
        <h1 style={{
          margin: 0,
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(38px, 7vw, 62px)',
          letterSpacing: '0.02em',
          lineHeight: '1.1',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #8B2A9B 0%, #5B3A8C 50%, #4A6FA5 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          padding: '8px 0',
        }}>
          בואו נכיר!
        </h1>
      </div>

      {/* Glassmorphism Chat Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1,
        width: '100%',
        maxWidth: '900px',
        height: '600px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.4) 100%)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        borderRadius: '28px',
        border: '2px solid rgba(255, 255, 255, 0.7)',
        boxShadow: `
          0 8px 32px rgba(198, 80, 214, 0.15),
          0 4px 16px rgba(149, 173, 229, 0.1),
          inset 0 2px 4px rgba(255, 255, 255, 0.9),
          inset 0 -1px 2px rgba(198, 80, 214, 0.05)
        `,
        overflow: 'hidden',
      }}>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/10">
          {messages.map((message, index) => (
            <div key={index}>
              <div
                className={cn(
                  'flex gap-3 animate-fade-in',
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    message.role === 'assistant'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3',
                    message.role === 'assistant'
                      ? 'bg-card border text-foreground rounded-tr-sm shadow-sm'
                      : 'bg-primary text-primary-foreground rounded-tl-sm shadow-md'
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Service Selection UI */}
                  {message.services && message.services.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        לחץ על השירותים שתרצה לפרסם (1-3):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {message.services.map((service, idx) => {
                          const isSelected = tempSelectedServices.includes(service);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleServiceToggle(service)}
                              disabled={!isSelected && tempSelectedServices.length >= 3}
                              className={cn(
                                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
                                !isSelected && tempSelectedServices.length >= 3 && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                              {service}
                            </button>
                          );
                        })}
                      </div>
                      {tempSelectedServices.length > 0 && (
                        <Button
                          onClick={handleConfirmServices}
                          className="w-full mt-2"
                          size="sm"
                        >
                          המשך עם {tempSelectedServices.length} שירותים שנבחרו
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Customer Mapping Form */}
                  {message.showCustomerMapping && message.servicesForMapping && message.servicesForMapping.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground mb-3">
                        למלא עבור כל שירות מי הלקוחות:
                      </p>
                      {message.servicesForMapping.map((service, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="text-sm font-medium block">
                            {service}
                          </label>
                          <input
                            type="text"
                            placeholder="למשל: זוגות, מנהלי HR, בעלי עסקים קטנים..."
                            value={customerMappings[service] || ''}
                            onChange={(e) => handleCustomerMappingChange(service, e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            dir="rtl"
                          />
                        </div>
                      ))}
                      <Button
                        onClick={() => handleConfirmCustomerMappings(message.servicesForMapping!)}
                        disabled={message.servicesForMapping.some(s => !customerMappings[s]?.trim())}
                        className="w-full mt-3"
                        size="sm"
                      >
                        המשך
                      </Button>
                    </div>
                  )}

                  {/* Service-Customer Pairs Table */}
                  {message.serviceCustomerPairs && message.serviceCustomerPairs.length > 0 && (
                    <div className="mt-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-right py-2 font-semibold">שירות</th>
                            <th className="text-right py-2 font-semibold">לקוחות</th>
                          </tr>
                        </thead>
                        <tbody>
                          {message.serviceCustomerPairs.map((pair, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="py-2">{pair.service}</td>
                              <td className="py-2 text-muted-foreground">
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
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-card border rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-card">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הקלד את התשובה שלך..."
              className="min-h-[50px] max-h-32 resize-none"
              disabled={isLoading}
              dir="rtl"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              className="h-[50px] w-[50px] flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 rotate-180" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
