/**
 * Google Analytics 4 Helper
 * Utilidades para rastrear eventos con Google Analytics 4
 */

import { readConsentFromStorage } from '@/lib/cookie-consent/storage';
import type {
  GA4RecommendedEvent,
  GA4EventParams,
  GA4Config,
  GA4ConsentConfig,
} from '@/types/google-analytics';

function analyticsConsentGranted(): boolean {
  return !!readConsentFromStorage()?.analytics;
}

/**
 * Verifica si Google Analytics está disponible
 * @returns true si GA4 está cargado y disponible
 */
export const isGA4Available = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Rastrea un evento en Google Analytics 4
 * 
 * @param eventName - Nombre del evento (puede ser recomendado o personalizado)
 * @param params - Parámetros del evento
 * 
 * @example
 * // Rastrear un lead generado
 * trackGA4Event('generate_lead', {
 *   value: 1,
 *   currency: 'USD'
 * });
 * 
 * @example
 * // Rastrear un evento personalizado
 * trackGA4Event('report_submitted', {
 *   content_type: 'ethical_report',
 *   content_id: 'report_123'
 * });
 */
export const trackGA4Event = (
  eventName: GA4RecommendedEvent | string,
  params?: GA4EventParams
): void => {
  if (!analyticsConsentGranted()) return;
  if (isGA4Available() && window.gtag) {
    try {
      if (params) {
        window.gtag('event', eventName, params);
      } else {
        window.gtag('event', eventName, {});
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GA4] Event tracked: ${eventName}`, params || '');
      }
    } catch (error) {
      console.error('[GA4] Error tracking event:', error);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn(`[GA4] Not available. Event not tracked: ${eventName}`);
  }
};

/**
 * Actualiza la configuración de GA4
 * Útil para actualizar propiedades del usuario o cambiar configuraciones
 * 
 * @param measurementId - ID de medición de GA4
 * @param config - Configuración a actualizar
 * 
 * @example
 * // Actualizar el user_id después del login
 * updateGA4Config('G-XXXXXXXXXX', {
 *   user_id: 'user_123',
 *   user_properties: {
 *     plan: 'enterprise'
 *   }
 * });
 */
export const updateGA4Config = (
  measurementId: string,
  config: GA4Config
): void => {
  if (!analyticsConsentGranted()) return;
  if (isGA4Available() && window.gtag) {
    try {
      window.gtag('config', measurementId, config);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[GA4] Config updated:', config);
      }
    } catch (error) {
      console.error('[GA4] Error updating config:', error);
    }
  }
};

/**
 * Establece valores globales en GA4
 * Los valores se aplicarán a todos los eventos subsiguientes
 * 
 * @param params - Parámetros a establecer globalmente
 * 
 * @example
 * setGA4Parameters({
 *   user_type: 'premium',
 *   organization: 'acme-corp'
 * });
 */
export const setGA4Parameters = (params: Record<string, any>): void => {
  if (!analyticsConsentGranted()) return;
  if (isGA4Available() && window.gtag) {
    try {
      window.gtag('set', 'user_properties', params);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[GA4] Parameters set:', params);
      }
    } catch (error) {
      console.error('[GA4] Error setting parameters:', error);
    }
  }
};

/**
 * Actualiza el consentimiento del usuario para GA4
 * Cumple con GDPR y otras regulaciones de privacidad
 * 
 * @param consent - Configuración de consentimiento
 * 
 * @example
 * // Usuario acepta todas las cookies
 * updateGA4Consent({
 *   ad_storage: 'granted',
 *   analytics_storage: 'granted'
 * });
 * 
 * @example
 * // Usuario rechaza cookies de publicidad
 * updateGA4Consent({
 *   ad_storage: 'denied',
 *   analytics_storage: 'granted'
 * });
 */
export const updateGA4Consent = (consent: GA4ConsentConfig): void => {
  if (isGA4Available() && window.gtag) {
    try {
      window.gtag('consent', 'update', consent as any);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[GA4] Consent updated:', consent);
      }
    } catch (error) {
      console.error('[GA4] Error updating consent:', error);
    }
  }
};

/**
 * Helpers específicos para eventos comunes
 */

/**
 * Rastrea un login de usuario
 */
export const trackGA4Login = (method: string = 'email'): void => {
  trackGA4Event('login', { method });
};

/**
 * Rastrea un registro de usuario
 */
export const trackGA4SignUp = (method: string = 'email'): void => {
  trackGA4Event('sign_up', { method });
};

/**
 * Rastrea una búsqueda
 */
export const trackGA4Search = (searchTerm: string): void => {
  trackGA4Event('search', { search_term: searchTerm });
};

/**
 * Rastrea la generación de un lead
 */
export const trackGA4Lead = (value?: number, currency: string = 'USD'): void => {
  trackGA4Event('generate_lead', {
    value,
    currency,
  });
};

/**
 * Rastrea una compra
 */
export const trackGA4Purchase = (
  transactionId: string,
  value: number,
  currency: string = 'USD',
  items?: GA4EventParams['items']
): void => {
  trackGA4Event('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
  });
};

/**
 * Rastrea el inicio del checkout
 */
export const trackGA4BeginCheckout = (
  value: number,
  currency: string = 'USD',
  items?: GA4EventParams['items']
): void => {
  trackGA4Event('begin_checkout', {
    value,
    currency,
    items,
  });
};

/**
 * Rastrea una vista de página personalizada
 */
export const trackGA4PageView = (
  pagePath: string,
  pageTitle?: string
): void => {
  if (!analyticsConsentGranted()) return;
  if (isGA4Available() && window.gtag) {
    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (measurementId) {
      updateGA4Config(measurementId, {
        page_path: pagePath,
        page_title: pageTitle || document.title,
      });
    }
  }
};

