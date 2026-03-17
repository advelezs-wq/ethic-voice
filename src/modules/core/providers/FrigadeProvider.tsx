import { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import * as Frigade from "@frigade/react";

export const FrigadeProvider = async ({
  children,
}: {
  children: ReactNode;
}) => {
  const user = await currentUser();

  return (
    <Frigade.Provider
      apiKey={process.env.FRIGADE_API_KEY as string}
      userId={user?.id}
    >
      <Frigade.Tour flowId={process.env.FRIGADE_TOUR_FLOW_ID as string} />
      {children}
    </Frigade.Provider>
  );
};
