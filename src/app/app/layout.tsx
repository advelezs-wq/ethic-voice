import { MobileMenu } from "@/modules/app/components/layout/burger-menu/MobileMenu";
import { Sidebar } from "@/modules/app/components/layout/Sidebar";
import { MainContent } from "@/modules/app/components/layout/MainContent";
import { FrigadeProvider } from "@/modules/core/providers/FrigadeProvider";
import { OrganizationProvider } from "@/modules/core/providers/OrganizationProvider";
import { SubscriptionProvider } from "@/modules/core/providers/SubscriptionProvider";
import { ThemeProvider } from "@/modules/core/providers/ThemeProvider";
import DesignerContextProvider from "@/modules/forms/builder/context/DesignerContext";
import type { Metadata } from "next";
import { SidebarProvider } from "@/modules/app/context/SidebarContext";
import { AnalyticsProvider } from "@/modules/app/context/AnalyticsContext";
import { SubscriptionGuard } from "@/modules/core/components/SubscriptionGuard";

export const metadata: Metadata = {
  title: "EthicVoice | App",
  description: "EthicVoice website",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FrigadeProvider>
      <DesignerContextProvider>
        <SubscriptionProvider>
          <OrganizationProvider>
            <ThemeProvider>
              <SidebarProvider>
                <AnalyticsProvider>
                  <SubscriptionGuard>
                    <div className="h-screen w-screen overflow-hidden">
                      <div className="h-full flex min-w-0">
                        <div className="hidden lg:block">
                          <Sidebar />
                        </div>
                        <MobileMenu />
                        <MainContent>{children}</MainContent>
                      </div>
                    </div>
                  </SubscriptionGuard>
                </AnalyticsProvider>
              </SidebarProvider>
            </ThemeProvider>
          </OrganizationProvider>
        </SubscriptionProvider>
      </DesignerContextProvider>
    </FrigadeProvider>
  );
}
