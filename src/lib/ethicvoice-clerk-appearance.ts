/**
 * Apariencia de Clerk alineada con el sistema de marca (BRAND.md):
 * papel, tinta #0B1D21, línea #DCDAD1, botón primario en tinta.
 * El logo vive en el panel de marca de AuthPageChrome, no en la tarjeta.
 */
export const ethicvoiceAuthAppearance = {
  layout: {
    logoLinkUrl: "/",
    privacyPageUrl: "/privacidad",
    termsPageUrl: "/terms",
  },
  variables: {
    colorPrimary: "#0B1D21",
    colorTextOnPrimaryBackground: "#ffffff",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#0B1D21",
    colorText: "#0B1D21",
    colorTextSecondary: "#5A6D70",
    colorNeutral: "#16323A",
    colorDanger: "#B23A28",
    colorSuccess: "#44731A",
    borderRadius: "0.875rem",
    fontFamily: "var(--font-display), system-ui, sans-serif",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    card: "w-full max-w-[420px] rounded-[1.5rem] border border-[#DCDAD1] !bg-white shadow-[0_40px_80px_-40px_rgba(11,29,33,0.35)]",
    cardBox: "rounded-[1.5rem] shadow-none",
    header: "gap-2 pb-2",
    headerTitle: "text-left text-[1.75rem] font-semibold tracking-[-0.04em] text-[#0B1D21]",
    headerSubtitle: "text-left text-[0.9375rem] leading-snug text-[#5A6D70]",
    socialButtonsBlockButton:
      "rounded-full border border-[#DCDAD1] !bg-white !text-[#0B1D21] shadow-none transition-colors hover:!border-[#0B1D21]/40",
    socialButtonsBlockButtonText: "font-medium text-sm",
    dividerLine: "bg-[#DCDAD1]",
    dividerText: "font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[#8FA2A5]",
    formFieldInput:
      "!rounded-xl !bg-white !text-[#0B1D21] !shadow-[0_0_0_1px_#DCDAD1] placeholder:!text-[#8FA2A5] focus:!border-[#0B1D21]/50 focus:!ring-2 focus:!ring-[#98D050]/40",
    formFieldLabel: "!text-[#0B1D21] text-sm font-medium",
    formFieldErrorText: "text-[#B23A28] text-sm",
    formButtonPrimary:
      "!rounded-full !bg-[#0B1D21] !py-3 !text-sm !font-medium !text-white !shadow-none hover:!bg-[#244850] active:!scale-[0.97] transition-transform",
    footer: "!bg-[#F4F3EE] border-t border-[#DCDAD1]",
    footerActionText: "!text-sm !text-[#5A6D70]",
    footerActionLink:
      "!font-medium !text-[#0B1D21] underline decoration-[#98D050] decoration-2 underline-offset-4",
    identityPreview: "rounded-xl border border-[#DCDAD1] bg-white",
    identityPreviewEditButton: "text-[#0B1D21]",
    otpCodeFieldInput: "!rounded-xl !border-[#DCDAD1] !text-[#0B1D21]",
    formResendCodeLink: "font-medium text-[#0B1D21]",
    alert: "rounded-xl border border-[#DCDAD1] bg-white",
  },
} as const;
