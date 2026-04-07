import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { FrigadeConsentClient } from "./FrigadeConsentClient";

export const FrigadeProvider = async ({
  children,
}: {
  children: ReactNode;
}) => {
  const user = await currentUser();
  const apiKey = process.env.FRIGADE_API_KEY ?? "";
  const flowId = process.env.FRIGADE_TOUR_FLOW_ID ?? "";

  if (!apiKey || !flowId) {
    return <>{children}</>;
  }

  return (
    <FrigadeConsentClient userId={user?.id} apiKey={apiKey} flowId={flowId}>
      {children}
    </FrigadeConsentClient>
  );
};
