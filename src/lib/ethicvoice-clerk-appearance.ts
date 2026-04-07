/**
 * Apariencia Clerk alineada con la marca EthicVoice (home / marketing):
 * verde #0a1f14, lima, beige #f5f3ee.
 */
export const ethicvoiceAuthAppearance = {
  variables: {
    colorPrimary: "#a3e635",
    colorTextOnPrimaryBackground: "#0a0a0a",
    colorBackground: "#ffffff",
    colorInputBackground: "#f5f3ee",
    colorInputText: "#0a1f14",
    colorText: "#0a1f14",
    colorTextSecondary: "#57534e",
    colorNeutral: "#e7e5e4",
    colorDanger: "#b91c1c",
    borderRadius: "1rem",
    fontFamily: "inherit",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    card: "shadow-[0_0_48px_rgba(10,31,20,0.1)] border border-[#0a1f14]/10 bg-white rounded-3xl w-full max-w-[420px] sm:max-w-[440px]",
    cardBox: "rounded-3xl",
    headerTitle: "text-2xl font-bold text-[#0a1f14] tracking-tight",
    headerSubtitle: "text-gray-600 text-[0.9375rem]",
    socialButtonsBlockButton:
      "border-[#0a1f14]/12 !bg-white hover:!bg-[#f5f3ee] !text-[#0a1f14] rounded-xl transition-colors",
    socialButtonsBlockButtonText: "font-semibold",
    socialButtonsProviderIcon: "size-5",
    dividerLine: "bg-[#0a1f14]/10",
    dividerText: "text-gray-500 text-sm",
    formFieldInput:
      "!rounded-xl !border-[#0a1f14]/15 !bg-[#f5f3ee]/95 !text-[#0a1f14] placeholder:!text-gray-400",
    formFieldLabel: "!text-[#0a1f14] font-semibold text-sm",
    formFieldSuccessText: "text-green-800",
    formFieldErrorText: "text-red-700",
    formButtonPrimary:
      "!rounded-full !font-bold !text-gray-950 !shadow-[0_0_24px_rgba(163,230,53,0.35)] hover:!brightness-95",
    formButtonReset:
      "text-[#0a1f14] hover:bg-[#f5f3ee] rounded-xl font-medium",
    footer: "bg-[#f5f3ee]/70 border-t border-[#0a1f14]/08 rounded-b-3xl",
    footerAction: "text-gray-600",
    footerActionLink:
      "!text-[#0a1f14] !font-bold hover:!text-lime-700 transition-colors",
    identityPreview: "border border-[#0a1f14]/10 rounded-xl bg-white",
    identityPreviewText: "text-[#0a1f14]",
    identityPreviewEditButton: "text-[#0a1f14] hover:text-lime-700",
    formHeaderTitle: "text-[#0a1f14] font-bold",
    formHeaderSubtitle: "text-gray-600",
    otpCodeFieldInput: "!rounded-xl !border-[#0a1f14]/15 !bg-[#f5f3ee]",
    alternativeMethodsBlockButton:
      "border-[#0a1f14]/12 rounded-xl hover:bg-[#f5f3ee]",
    formResendCodeLink: "text-[#0a1f14] font-semibold hover:text-lime-700",
    spinner: "text-lime-600",
    alertText: "text-[#0a1f14]",
    formFieldHintText: "text-gray-500",
    userButtonPopoverCard: "rounded-2xl border border-[#0a1f14]/10",
  },
} as const;
