import type { ReactNode } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
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
      // Clerk does not guarantee emailAddresses[0] is the primary address —
      // prefer primaryEmailAddress, falling back only if it's somehow absent.
      const email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0].emailAddress;

      try {
        serverUser = await prisma.user.upsert({
          where: { email },
          create: {
            id: clerkId,
            email,
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
      } catch (upsertError) {
        // The row matched by email can already have a different id than
        // clerkId (e.g. a leftover/duplicate account) while another row
        // already owns clerkId — the update's `id: clerkId` then collides
        // with that other row's primary key. Rather than losing serverUser
        // entirely for the rest of this request, fall back to the row that
        // already has the correct id.
        if (
          upsertError instanceof Prisma.PrismaClientKnownRequestError &&
          upsertError.code === "P2002"
        ) {
          serverUser = await prisma.user.findUnique({
            where: { id: clerkId },
            include: { organizations: true },
          });
        } else {
          throw upsertError;
        }
      }
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
