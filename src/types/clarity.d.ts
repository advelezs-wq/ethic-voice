/**
 * Microsoft Clarity Type Definitions
 * Declaraciones de tipos para Microsoft Clarity
 */

declare global {
  interface Window {
    clarity?: {
      /**
       * Identifica un usuario con un ID personalizado
       * @param userId - ID único del usuario
       */
      identify: (userId: string, sessionId?: string, pageId?: string, friendlyName?: string) => void;
      
      /**
       * Establece tags personalizados para la sesión
       * @param key - Nombre del tag
       * @param value - Valor del tag (string o array de strings)
       */
      set: (key: string, value: string | string[]) => void;
      
      /**
       * Envía eventos personalizados a Clarity
       * @param eventName - Nombre del evento
       */
      event: (eventName: string) => void;
      
      /**
       * Actualiza el consentimiento del usuario
       * @param consent - 'granted' o 'denied'
       */
      consent: (consent: 'granted' | 'denied') => void;
      
      /**
       * Obtiene el ID de sesión actual
       */
      getSessionId: () => string | undefined;
      
      /**
       * Función para hacer push a la cola cuando Clarity aún no está cargado
       */
      q?: any[];
    };
  }
}

/**
 * Tipos de eventos personalizados de Clarity
 */
export type ClarityCustomEvent =
  | 'lead_generated'
  | 'report_submitted'
  | 'registration_completed'
  | 'checkout_initiated'
  | 'subscription_created'
  | 'form_completed'
  | string; // Permite eventos personalizados adicionales

/**
 * Opciones para identificar usuarios en Clarity
 */
export interface ClarityIdentifyOptions {
  userId: string;
  sessionId?: string;
  pageId?: string;
  friendlyName?: string;
}

/**
 * Tags personalizados para Clarity
 */
export interface ClarityTags {
  [key: string]: string | string[];
}

export {};

