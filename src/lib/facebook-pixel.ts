/**
 * Facebook Pixel Helper
 * Utilidades para rastrear eventos con Facebook Pixel
 */

import { readConsentFromStorage } from '@/lib/cookie-consent/storage';
import { effectiveMarketingAllowed } from '@/lib/cookie-consent/types';
import type { FacebookStandardEvent, FacebookEventParams } from '@/types/facebook-pixel';

function marketingPixelAllowed(): boolean {
  const c = readConsentFromStorage();
  return !!c && effectiveMarketingAllowed(c);
}

/**
 * Rastrea un evento estándar de Facebook Pixel
 * @param eventName - Nombre del evento estándar
 * @param params - Parámetros opcionales del evento
 * 
 * @example
 * // Rastrear cuando alguien completa un registro
 * trackFacebookEvent('CompleteRegistration', { value: 1, currency: 'USD' });
 * 
 * @example
 * // Rastrear cuando alguien genera un lead
 * trackFacebookEvent('Lead');
 */
export const trackFacebookEvent = (
  eventName: FacebookStandardEvent,
  params?: FacebookEventParams
): void => {
  if (!marketingPixelAllowed()) return;
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      if (params) {
        window.fbq('track', eventName, params);
      } else {
        window.fbq('track', eventName);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Facebook Pixel] Event tracked: ${eventName}`, params || '');
      }
    } catch (error) {
      console.error('[Facebook Pixel] Error tracking event:', error);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('[Facebook Pixel] fbq is not available. Event not tracked:', eventName);
  }
};

/**
 * Rastrea un evento personalizado de Facebook Pixel
 * @param eventName - Nombre del evento personalizado
 * @param params - Parámetros opcionales del evento
 * 
 * @example
 * // Rastrear cuando alguien envía un reporte
 * trackFacebookCustomEvent('ReportSubmitted', { category: 'harassment' });
 */
export const trackFacebookCustomEvent = (
  eventName: string,
  params?: Record<string, any>
): void => {
  if (!marketingPixelAllowed()) return;
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      if (params) {
        window.fbq('trackCustom', eventName, params);
      } else {
        window.fbq('trackCustom', eventName);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Facebook Pixel] Custom event tracked: ${eventName}`, params || '');
      }
    } catch (error) {
      console.error('[Facebook Pixel] Error tracking custom event:', error);
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('[Facebook Pixel] fbq is not available. Custom event not tracked:', eventName);
  }
};

/**
 * Verifica si Facebook Pixel está disponible
 * @returns true si el píxel está cargado y disponible
 */
export const isFacebookPixelAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
};

