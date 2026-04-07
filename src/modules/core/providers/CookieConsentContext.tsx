"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CONSENT_POLICY_VERSION,
  type ConsentRecord,
  type ConsentSource,
} from "@/lib/cookie-consent/types";
import {
  needsRenewal,
  readConsentFromStorage,
  writeConsentToStorage,
} from "@/lib/cookie-consent/storage";

type CookieConsentContextValue = {
  consent: ConsentRecord | null;
  hydrated: boolean;
  needsInteraction: boolean;
  /** Modal de cookies visible (primera visita o “Cookies”) — bloquea scroll */
  isPrimaryBannerVisible: boolean;
  showCookieSettingsModal: boolean;
  setShowCookieSettingsModal: (v: boolean) => void;
  acceptAll: () => void;
  acceptEssentialOnly: () => void;
  /** Abre el modal para cambiar entre “todas” y “solo necesarias” */
  openCookieSettings: () => void;
  withdrawToEssential: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
);

function buildRecord(
  source: ConsentSource,
  overrides: Partial<
    Pick<
      ConsentRecord,
      "functional" | "analytics" | "marketing" | "saleOptOut"
    >
  >
): ConsentRecord {
  const now = new Date().toISOString();
  return {
    necessary: true,
    functional: overrides.functional ?? false,
    analytics: overrides.analytics ?? false,
    marketing: overrides.marketing ?? false,
    saleOptOut: overrides.saleOptOut ?? false,
    policyVersion: CONSENT_POLICY_VERSION,
    updatedAt: now,
    source,
  };
}

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showCookieSettingsModal, setShowCookieSettingsModal] = useState(false);

  useEffect(() => {
    const stored = readConsentFromStorage();
    setConsent(stored);
    setHydrated(true);
  }, []);

  const persist = useCallback((record: ConsentRecord) => {
    writeConsentToStorage(record);
    setConsent(record);
    setShowCookieSettingsModal(false);
  }, []);

  const acceptAll = useCallback(() => {
    persist(
      buildRecord("all", {
        functional: true,
        analytics: true,
        marketing: true,
        saleOptOut: false,
      })
    );
  }, [persist]);

  const acceptEssentialOnly = useCallback(() => {
    persist(
      buildRecord("essential", {
        functional: false,
        analytics: false,
        marketing: false,
        saleOptOut: false,
      })
    );
  }, [persist]);

  const withdrawToEssential = useCallback(() => {
    const record = buildRecord("essential", {
      functional: false,
      analytics: false,
      marketing: false,
      saleOptOut: false,
    });
    writeConsentToStorage(record);
    setConsent(record);
    setShowCookieSettingsModal(false);
  }, []);

  const openCookieSettings = useCallback(() => {
    setShowCookieSettingsModal(true);
  }, []);

  const needsInteraction =
    hydrated && (consent === null || needsRenewal(consent));

  const isPrimaryBannerVisible =
    hydrated && (needsInteraction || showCookieSettingsModal);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      hydrated,
      needsInteraction,
      isPrimaryBannerVisible,
      showCookieSettingsModal,
      setShowCookieSettingsModal,
      acceptAll,
      acceptEssentialOnly,
      openCookieSettings,
      withdrawToEssential,
    }),
    [
      consent,
      hydrated,
      needsInteraction,
      isPrimaryBannerVisible,
      showCookieSettingsModal,
      acceptAll,
      acceptEssentialOnly,
      openCookieSettings,
      withdrawToEssential,
    ]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent debe usarse dentro de CookieConsentProvider");
  }
  return ctx;
}

export function useCookieConsentOptional(): CookieConsentContextValue | null {
  return useContext(CookieConsentContext);
}

export {
  DEFAULT_CONSENT,
  effectiveMarketingAllowed,
} from "@/lib/cookie-consent/types";
