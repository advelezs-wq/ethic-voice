"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Card } from '@heroui/react';

interface IntelligentCaptchaProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  required?: boolean;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact' | 'invisible';
  className?: string;
}

interface SecurityMetrics {
  pageLoadTime: number;
  mouseMovements: number;
  keyboardEvents: number;
  timeOnPage: number;
  suspiciousScore: number;
}

export function IntelligentCaptcha({
  siteKey,
  onVerify,
  onError,
  required = false,
  theme = 'light',
  size = 'invisible',
  className = '',
}: IntelligentCaptchaProps) {
  const [showCaptcha, setShowCaptcha] = useState(required);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    pageLoadTime: Date.now(),
    mouseMovements: 0,
    keyboardEvents: 0,
    timeOnPage: 0,
    suspiciousScore: 0,
  });
  
  const captchaRef = useRef<HCaptcha>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Track user behavior for intelligent captcha activation
  useEffect(() => {
    let mouseEventCount = 0;
    let keyboardEventCount = 0;
    const startTime = Date.now();

    const handleMouseMove = () => {
      mouseEventCount++;
      if (mouseEventCount % 10 === 0) {
        setMetrics(prev => ({ ...prev, mouseMovements: mouseEventCount }));
      }
    };

    const handleKeyDown = () => {
      keyboardEventCount++;
      setMetrics(prev => ({ ...prev, keyboardEvents: keyboardEventCount }));
    };

    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - startTime;
      setMetrics(prev => ({ ...prev, timeOnPage }));
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Interval to update time on page
    const timeInterval = setInterval(() => {
      const timeOnPage = Date.now() - startTime;
      setMetrics(prev => ({ ...prev, timeOnPage }));
    }, 1000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(timeInterval);
    };
  }, []);

  // Calculate suspicion score based on behavior
  const calculateSuspicionScore = useCallback((currentMetrics: SecurityMetrics): number => {
    let score = 0;
    
    // Very fast form submission (less than 10 seconds)
    if (currentMetrics.timeOnPage < 10000) {
      score += 30;
    }
    
    // No mouse movements (automated)
    if (currentMetrics.mouseMovements < 5 && currentMetrics.timeOnPage > 5000) {
      score += 40;
    }
    
    // No keyboard events (copy-paste or automated)
    if (currentMetrics.keyboardEvents < 3 && currentMetrics.timeOnPage > 15000) {
      score += 25;
    }
    
    // Extremely rapid typing (more than 10 keys per second)
    const typingSpeed = currentMetrics.keyboardEvents / (currentMetrics.timeOnPage / 1000);
    if (typingSpeed > 10) {
      score += 20;
    }

    // Pattern detection: exactly the same intervals
    if (currentMetrics.mouseMovements > 0 && currentMetrics.mouseMovements % 10 === 0) {
      score += 15;
    }

    return Math.min(score, 100);
  }, []);

  // Monitor metrics and decide if captcha should be shown
  useEffect(() => {
    const suspiciousScore = calculateSuspicionScore(metrics);
    setMetrics(prev => ({ ...prev, suspiciousScore }));

          // Show captcha if suspicious score is high (threshold: 50)
      if (suspiciousScore >= 50 && !showCaptcha && !isVerified) {
        setShowCaptcha(true);
      }
  }, [metrics.timeOnPage, metrics.mouseMovements, metrics.keyboardEvents, calculateSuspicionScore, showCaptcha, isVerified]);

      const handleVerify = (token: string) => {
      setIsVerified(true);
      setShowCaptcha(false);
      onVerify(token);
    };

    const handleError = (error: string) => {
      onError?.(error);
    };

    const handleExpire = () => {
      setIsVerified(false);
    };

  // Force show captcha (can be called externally)
  const forceCaptcha = useCallback(() => {
    setShowCaptcha(true);
  }, []);

  // Expose force captcha method
  useEffect(() => {
    if (captchaRef.current) {
      (captchaRef.current as HCaptcha & { forceCaptcha?: () => void }).forceCaptcha = forceCaptcha;
    }
  }, [forceCaptcha]);

  // Don't render anything if captcha is not needed
  if (!showCaptcha) {
    return null;
  }

  return (
    <Card className={`p-4 border-2 border-orange-200 bg-orange-50 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <i className="icon-[lucide--shield-alert] size-5 text-orange-600" />
          <h3 className="text-sm font-medium text-orange-800">
            Verificación de Seguridad
          </h3>
        </div>
        
        <p className="text-xs text-orange-700">
          Por favor, completa la verificación para continuar. Esto nos ayuda a proteger la plataforma contra el uso automatizado.
        </p>

        <div className="flex justify-center">
          <HCaptcha
            ref={captchaRef}
            sitekey={siteKey}
            onVerify={handleVerify}
            onError={handleError}
            onExpire={handleExpire}
            theme={theme}
            size={size === 'invisible' ? 'normal' : size} // Invisible mode not supported in this context
          />
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            <strong>Debug Info:</strong> 
            Suspicion Score: {metrics.suspiciousScore}/100 | 
            Time: {Math.round(metrics.timeOnPage / 1000)}s | 
            Mouse: {metrics.mouseMovements} | 
            Keys: {metrics.keyboardEvents}
          </div>
        )}
      </div>
    </Card>
  );
}

// Hook for using intelligent captcha
export function useIntelligentCaptcha() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setCaptchaError(null);
  }, []);

  const handleCaptchaError = useCallback((error: string) => {
    setCaptchaError(error);
    setCaptchaToken(null);
  }, []);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    setCaptchaError(null);
    setCaptchaRequired(false);
  }, []);

  const requireCaptcha = useCallback(() => {
    setCaptchaRequired(true);
  }, []);

  return {
    captchaToken,
    captchaRequired,
    captchaError,
    handleCaptchaVerify,
    handleCaptchaError,
    resetCaptcha,
    requireCaptcha,
  };
} 