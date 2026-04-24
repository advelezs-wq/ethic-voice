/**
 * Apariencia Clerk alineada con la home V2 EthicVoice:
 * #0d212c / #273c46, lima CTA, bordes slate, anillo lima suave.
 */
export const ethicvoiceAuthAppearance = {
  layout: {
    logoImageUrl: "/brand/logo-nobg.png",
    logoLinkUrl: "/",
    privacyPageUrl: "/privacidad",
    termsPageUrl: "/terms",
  },
  variables: {
    colorPrimary: "#a3e635",
    colorTextOnPrimaryBackground: "#052b24",
    colorBackground: "#ffffff",
    colorInputBackground: "#f8fafc",
    colorInputText: "#0d212c",
    colorText: "#0d212c",
    colorTextSecondary: "#64748b",
    colorNeutral: "#e2e8f0",
    colorDanger: "#b91c1c",
    borderRadius: "1rem",
    fontFamily: "inherit",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full flex justify-center px-0 sm:px-2",
    card: [
      "w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200/90",
      "!bg-white bg-white shadow-[0_8px_32px_rgba(15,23,42,0.08)]",
      "ring-1 ring-lime-400/30 sm:max-w-[440px] sm:rounded-3xl",
    ].join(" "),
    cardBox: "rounded-2xl sm:rounded-3xl shadow-none",
    header: "gap-3 pb-2",
    logoBox: "flex justify-center [&_img]:h-9 [&_img]:w-auto [&_img]:object-contain",
    logoImage: "h-9 w-auto object-contain",
    headerTitle:
      "text-center text-2xl font-bold tracking-tight text-[#0d212c] sm:text-[1.65rem]",
    headerSubtitle: "text-center text-[0.9375rem] leading-snug text-[#273c46]",
    socialButtonsRoot: "gap-2.5",
    socialButtonsBlockButton:
      "rounded-xl border border-slate-200/90 !bg-white !text-[#0d212c] shadow-sm transition-colors hover:!bg-slate-50 hover:!border-slate-300",
    socialButtonsBlockButtonText: "font-semibold text-sm",
    socialButtonsProviderIcon: "size-5",
    dividerRow: "py-2",
    dividerLine: "bg-slate-200/90",
    dividerText: "text-xs font-medium uppercase tracking-wide text-slate-500",
    formFieldRow: "gap-2",
    formFieldInput: [
      "!rounded-xl !border-slate-200/90 !bg-slate-50 !text-[#0d212c]",
      "!shadow-none placeholder:!text-slate-400 focus:!border-lime-500/50 focus:!ring-2 focus:!ring-lime-400/25",
    ].join(" "),
    formFieldLabel: "!text-[#0d212c] text-sm font-semibold",
    formFieldSuccessText: "text-green-800 text-sm",
    formFieldErrorText: "text-red-700 text-sm",
    formButtonPrimary: [
      "!rounded-full !border-0 !bg-lime-400 !py-3 !text-sm !font-semibold !text-[#052b24]",
      "!shadow-[0_1px_2px_0_rgba(5,26,36,0.1),0_4px_4px_0_rgba(5,26,36,0.09),inset_0_1px_0_0_rgba(255,255,255,0.35)]",
      "hover:!bg-lime-500 active:!scale-[0.99]",
    ].join(" "),
    formButtonReset:
      "rounded-xl text-sm font-medium text-[#0d212c] hover:bg-slate-100",
    formFieldHintText: "text-slate-500 text-xs",
    footer: [
      "!bg-white rounded-b-2xl border-t border-slate-200/80",
      "px-4 py-4 sm:rounded-b-3xl sm:px-5",
    ].join(" "),
    footerAction: "!text-sm !text-slate-600",
    footerActionLink:
      "!font-semibold !text-[#0d212c] hover:!text-lime-700 !underline-offset-2 transition-colors",
    footerPages: "!bg-white text-slate-600",
    footerPagesLink: "!text-[#0d212c] hover:!text-lime-700",
    identityPreview: "rounded-xl border border-slate-200/90 bg-white",
    identityPreviewText: "text-[#0d212c]",
    identityPreviewEditButton: "text-[#0d212c] hover:text-lime-700",
    formHeaderTitle: "text-[#0d212c] font-bold",
    formHeaderSubtitle: "text-[#273c46]",
    otpCodeFieldInput:
      "!rounded-xl !border-slate-200/90 !bg-slate-50 !text-[#0d212c]",
    alternativeMethodsBlockButton:
      "rounded-xl border border-slate-200/80 hover:bg-slate-50",
    formResendCodeLink: "font-semibold text-[#0d212c] hover:text-lime-700",
    spinner: "text-lime-600",
    alert: "rounded-xl border border-slate-200 bg-white",
    alertText: "text-[#0d212c]",
    userButtonPopoverCard: "rounded-2xl border border-slate-200/90 shadow-xl",
    scrollBox: "rounded-2xl sm:rounded-3xl",
  },
} as const;
