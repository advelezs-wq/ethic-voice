"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { ReactNode } from "react";
import { UserProvider } from "./UserProvider";
import { CookieConsentRoot } from "./CookieConsentRoot";
import { UserType } from "@/types/user";
import { esMX } from "@clerk/localizations";

interface ClientProviderProps {
  children: ReactNode;
  serverUser: UserType | null;
  serverToken: string;
}

export const ClientProvider = ({
  children,
  serverUser,
  serverToken,
}: ClientProviderProps) => {
  return (
    <HeroUIProvider disableRipple={false}>
      <ToastProvider />
      <ClerkProvider
        afterSignOutUrl={"/"}
        signInFallbackRedirectUrl={"/app"}
        waitlistUrl="/auth/waitlist"
        localization={esMX}
        appearance={{
          variables: {
            colorBackground: "hsl(var(--accent))",
          },
        }}
      >
        <UserProvider serverUser={serverUser} serverToken={serverToken}>
          <CookieConsentRoot>{children}</CookieConsentRoot>
        </UserProvider>
      </ClerkProvider>
    </HeroUIProvider>
  );
};
