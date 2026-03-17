/**
 * Facebook Pixel Type Definitions
 * Declaraciones de tipos para el píxel de Facebook
 */

declare global {
  interface Window {
    fbq?: (
      action: 'track' | 'trackCustom' | 'init',
      eventName: string,
      parameters?: Record<string, any>
    ) => void;
    _fbq?: Window['fbq'];
  }
}

/**
 * Eventos estándar de Facebook Pixel
 * Standard Facebook Pixel Events
 */
type FacebookStandardEvent =
  | 'AddPaymentInfo'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'InitiateCheckout'
  | 'Lead'
  | 'PageView'
  | 'Purchase'
  | 'Schedule'
  | 'Search'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'
  | 'ViewContent';

/**
 * Parámetros comunes para eventos de Facebook Pixel
 * Common parameters for Facebook Pixel events
 */
interface FacebookEventParams {
  content_category?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{
    id: string;
    quantity: number;
  }>;
  currency?: string;
  num_items?: number;
  predicted_ltv?: number;
  search_string?: string;
  status?: boolean;
  value?: number;
}

export { FacebookStandardEvent, FacebookEventParams };

