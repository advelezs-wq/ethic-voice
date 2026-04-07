/**
 * Microsoft Clarity Helper
 * Utilidades para rastrear eventos y sesiones con Microsoft Clarity
 */

import { readConsentFromStorage } from '@/lib/cookie-consent/storage';
import type { ClarityCustomEvent, ClarityIdentifyOptions, ClarityTags } from '@/types/clarity';

function clarityAnalyticsAllowed(): boolean {
  return !!readConsentFromStorage()?.analytics;
}

/**
 * Verifica si Microsoft Clarity está disponible
 * @returns true si Clarity está cargado y disponible
 */
export const isClarityAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.clarity !== 'undefined';
};

/**
 * Identifica un usuario en Clarity para rastrear su comportamiento
 * Útil para vincular sesiones con usuarios específicos
 * 
 * @param options - Opciones de identificación del usuario
 * 
 * @example
 * // Identificar usuario después del login
 * identifyClarityUser({
 *   userId: 'user_123',
 *   friendlyName: 'John Doe'
 * });
 */
export const identifyClarityUser = (options: ClarityIdentifyOptions): void => {
  if (!clarityAnalyticsAllowed()) return;
  if (isClarityAvailable() && window.clarity) {
    try {
      window.clarity.identify(
        options.userId,
        options.sessionId,
        options.pageId,
        options.friendlyName
      );
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Clarity] User identified:', options.userId);
      }
    } catch (error) {
      console.error('[Clarity] Error identifying user:', error);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('[Clarity] Not available. User not identified:', options.userId);
  }
};

/**
 * Establece tags personalizados para la sesión actual
 * Los tags ayudan a filtrar y segmentar sesiones en el dashboard de Clarity
 * 
 * @param key - Nombre del tag
 * @param value - Valor del tag (puede ser string o array)
 * 
 * @example
 * // Etiquetar el tipo de usuario
 * setClarityTag('user_type', 'premium');
 * 
 * @example
 * // Etiquetar múltiples características
 * setClarityTag('features', ['reports', 'analytics', 'ai']);
 */
export const setClarityTag = (key: string, value: string | string[]): void => {
  if (!clarityAnalyticsAllowed()) return;
  if (isClarityAvailable() && window.clarity) {
    try {
      window.clarity.set(key, value);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Clarity] Tag set: ${key} =`, value);
      }
    } catch (error) {
      console.error('[Clarity] Error setting tag:', error);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(`[Clarity] Not available. Tag not set: ${key}`);
  }
};

/**
 * Establece múltiples tags a la vez
 * 
 * @param tags - Objeto con pares clave-valor de tags
 * 
 * @example
 * setClarityTags({
 *   plan: 'enterprise',
 *   industry: 'healthcare',
 *   features: ['reports', 'ai']
 * });
 */
export const setClarityTags = (tags: ClarityTags): void => {
  Object.entries(tags).forEach(([key, value]) => {
    setClarityTag(key, value);
  });
};

/**
 * Rastrea un evento personalizado en Clarity
 * Los eventos ayudan a identificar acciones importantes en tu sitio
 * 
 * @param eventName - Nombre del evento a rastrear
 * 
 * @example
 * // Rastrear cuando alguien envía un reporte
 * trackClarityEvent('report_submitted');
 * 
 * @example
 * // Rastrear cuando alguien completa el checkout
 * trackClarityEvent('checkout_initiated');
 */
export const trackClarityEvent = (eventName: ClarityCustomEvent): void => {
  if (!clarityAnalyticsAllowed()) return;
  if (isClarityAvailable() && window.clarity) {
    try {
      window.clarity.event(eventName);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Clarity] Event tracked: ${eventName}`);
      }
    } catch (error) {
      console.error('[Clarity] Error tracking event:', error);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(`[Clarity] Not available. Event not tracked: ${eventName}`);
  }
};

/**
 * Actualiza el consentimiento del usuario para el rastreo
 * 
 * @param consent - 'granted' para permitir rastreo, 'denied' para negarlo
 * 
 * @example
 * // Usuario acepta cookies de analytics
 * updateClarityConsent('granted');
 * 
 * @example
 * // Usuario rechaza cookies
 * updateClarityConsent('denied');
 */
export const updateClarityConsent = (consent: 'granted' | 'denied'): void => {
  if (isClarityAvailable() && window.clarity) {
    try {
      window.clarity.consent(consent);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Clarity] Consent updated: ${consent}`);
      }
    } catch (error) {
      console.error('[Clarity] Error updating consent:', error);
    }
  }
};

/**
 * Obtiene el ID de sesión actual de Clarity
 * Útil para vincular sesiones con otros sistemas de analytics
 * 
 * @returns Session ID o undefined si no está disponible
 * 
 * @example
 * const sessionId = getClaritySessionId();
 * if (sessionId) {
 *   console.log('Session ID:', sessionId);
 * }
 */
export const getClaritySessionId = (): string | undefined => {
  if (!clarityAnalyticsAllowed()) return undefined;
  if (isClarityAvailable() && window.clarity && window.clarity.getSessionId) {
    try {
      return window.clarity.getSessionId();
    } catch (error) {
      console.error('[Clarity] Error getting session ID:', error);
      return undefined;
    }
  }
  return undefined;
};

