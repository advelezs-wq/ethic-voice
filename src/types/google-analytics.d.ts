/**
 * Google Analytics 4 Type Definitions
 * Declaraciones de tipos para Google Analytics 4
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (
      command: 'config' | 'event' | 'set' | 'consent',
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Eventos recomendados de GA4
 * GA4 Recommended Events
 */
export type GA4RecommendedEvent =
  // E-commerce events
  | 'add_payment_info'
  | 'add_to_cart'
  | 'add_to_wishlist'
  | 'begin_checkout'
  | 'purchase'
  | 'refund'
  | 'remove_from_cart'
  | 'select_item'
  | 'select_promotion'
  | 'view_cart'
  | 'view_item'
  | 'view_item_list'
  | 'view_promotion'
  // Engagement events
  | 'earn_virtual_currency'
  | 'join_group'
  | 'login'
  | 'search'
  | 'select_content'
  | 'share'
  | 'sign_up'
  | 'spend_virtual_currency'
  | 'tutorial_begin'
  | 'tutorial_complete'
  // Lead generation
  | 'generate_lead'
  | 'page_view';

/**
 * Parámetros comunes para eventos de GA4
 */
export interface GA4EventParams {
  // E-commerce parameters
  currency?: string;
  value?: number;
  transaction_id?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    price?: number;
    quantity?: number;
    item_category?: string;
  }>;
  
  // Content parameters
  content_type?: string;
  content_id?: string;
  
  // Search parameters
  search_term?: string;
  
  // User parameters
  method?: string;
  user_id?: string;
  
  // Custom parameters
  [key: string]: any;
}

/**
 * Configuración de GA4
 */
export interface GA4Config {
  page_path?: string;
  page_title?: string;
  page_location?: string;
  send_page_view?: boolean;
  user_id?: string;
  user_properties?: Record<string, any>;
  [key: string]: any;
}

/**
 * Configuración de consentimiento de GA4
 */
export interface GA4ConsentConfig {
  ad_storage?: 'granted' | 'denied';
  ad_user_data?: 'granted' | 'denied';
  ad_personalization?: 'granted' | 'denied';
  analytics_storage?: 'granted' | 'denied';
  functionality_storage?: 'granted' | 'denied';
  personalization_storage?: 'granted' | 'denied';
  security_storage?: 'granted' | 'denied';
}

export {};

