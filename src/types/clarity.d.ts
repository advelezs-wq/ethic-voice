/**
 * Microsoft Clarity Type Definitions
 * Declaraciones de tipos para Microsoft Clarity
 */

declare global {
  interface Window {
    /**
     * Microsoft Clarity se expone como una única función invocable
     * (el snippet oficial la usa como cola de comandos), no como un
     * objeto con métodos nombrados. Uso: window.clarity('identify', ...),
     * window.clarity('set', key, value), window.clarity('event', name),
     * window.clarity('consent'[, false]), window.clarity('getSessionId', cb).
     */
    clarity?: {
      (...args: unknown[]): void;
      q?: unknown[];
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

