import type { ReactNode } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ClientProvider } from "@/modules/core/providers/ClientProvider";
import prisma from "@/modules/prisma/lib/prisma";

export async function DefaultRootProviders({
  children,
}: {
  children: ReactNode;
}) {
  let serverUser = null;
  const serverToken = "";

  try {
    const { userId: clerkId } = await auth();
    const clerkUser = await currentUser();

    if (clerkId && clerkUser) {
      serverUser = await prisma.user.upsert({
        where: { email: clerkUser.emailAddresses[0].emailAddress },
        create: {
          id: clerkId,
          email: clerkUser.emailAddresses[0].emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        },
        update: {
          id: clerkId,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        },
        include: {
          organizations: true,
        },
      });
    }
  } catch (error) {
    // Auth not available for public routes, continue without user
    console.log("Auth not available for this route:", error);
  }

  return (
    <ClientProvider serverUser={serverUser} serverToken={serverToken}>
      {children}
    </ClientProvider>
  );
}
