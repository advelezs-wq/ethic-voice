/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/modules/prisma/lib/prisma";
import { createUser, deleteUser, updateUser } from "@/modules/prisma/lib/users";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Webhook } from "svix";

async function waitForUserSync(
  clerkUserId: string,
  maxRetries = 5,
  delay = 1000
) {
  for (let i = 0; i < maxRetries; i++) {
    const user = await prisma.user.findUnique({
      where: { id: clerkUserId },
    });

    if (user) {
      return user;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return null;
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw Error(
      "Please add WEBHOOK_SECRET from Clerk dashboard to .env or .env.local"
    );
  }

  const headerPayload = headers();
  const svix_id = (await headerPayload).get("svix-id");
  const svix_timestamp = (await headerPayload).get("svix-timestamp");
  const svix_signature = (await headerPayload).get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    if (!id || !email_addresses || !email_addresses.length) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    const email = email_addresses[0].email_address;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { id: id },
      });

      if (existingUser) {
        return new Response("User already exists", { status: 200 });
      }

      const user = {
        id: id,
        email: email,
        firstName: first_name,
        lastName: last_name,
      };

      const { error } = await createUser(user as User);
      if (error) throw error;

      revalidatePath("/");
      return new Response("User created", { status: 200 });
    } catch (error) {
      console.error("Error creating user:", error);
      return new Response("Error creating user", {
        status: 500,
      });
    }
  }

  if (eventType === "user.updated") {
    const { id, first_name, last_name } = evt.data;

    if (!id) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    const data: Partial<User> = {
      ...(first_name ? { firstName: first_name } : {}),
      ...(last_name ? { lastName: last_name } : {}),
    };

    try {
      await updateUser(id, data);
      return new Response("User updated", { status: 200 });
    } catch (error) {
      console.error("Error updating user:", error);
      return new Response("Error updating user", {
        status: 500,
      });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    try {
      const { error } = await deleteUser(id);
      if (error) throw error;
      await prisma.reportAssignment.deleteMany({
        where: {
          userId: id,
        },
      });
      revalidatePath("/");
      return new Response("User deleted", { status: 200 });
    } catch (error) {
      console.error("Error deleting user:", error);
      return new Response("Error deleting user", {
        status: 500,
      });
    }
  }

  if (eventType === "organization.created") {
    const { id, name, slug, created_by, image_url } = evt.data;

    if (!id || !name || !slug || !created_by) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    try {
      // Check if organization already exists
      const existingOrg = await prisma.organization.findUnique({
        where: { id: id },
      });

      if (existingOrg) {
      } else {
        // Wait for user to be synced before creating organization
        const user = await waitForUserSync(created_by);

        if (!user) {
          return new Response("User not found after sync", { status: 404 });
        }

        // Create organization in database
        await prisma.organization.create({
          data: {
            id: id,
            name,
            slug,
            logoUrl: image_url,
            User: {
              connect: {
                id: user.id,
              },
            },
          },
        });

        // Create admin membership for the creator
        await prisma.organizationMembership.upsert({
          where: {
            userId_orgId: {
              userId: user.id,
              orgId: id,
            },
          },
          update: {
            role: "ADMIN",
          },
          create: {
            userId: user.id,
            orgId: id,
            role: "ADMIN",
          },
        });
      }

      if (!existingOrg) {
        await prisma.department.create({
          data: {
            name: "General",
            slug: "general",
            orgId: id,
            isDefault: true,
          },
        });
      }

      const superAdminEmails =
        process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS?.split(",") || [];

      if (superAdminEmails.length === 0) {
        return new Response("Organization created", { status: 200 });
      }

      // Get Clerk client once
      const clerk = await clerkClient();

      // Add a small delay before processing super admins to allow for better sync
      await new Promise((resolve) => setTimeout(resolve, 2000));

      for (const superAdminEmail of superAdminEmails) {
        try {
          const trimmedEmail = superAdminEmail.trim();

          // Find the super admin user in database
          const superAdminUser = await prisma.user.findUnique({
            where: { email: trimmedEmail },
          });

          if (!superAdminUser) {
            // Try to send invitation anyway
            try {
              await clerk.organizations.createOrganizationInvitation({
                organizationId: id,
                emailAddress: trimmedEmail,
                role: "org:admin",
              });
            } catch {}
            continue;
          }

          // Skip if the creator is the super admin
          if (superAdminUser.id === created_by) {
            continue;
          }

          // Create membership in database first
          try {
            await prisma.organizationMembership.upsert({
              where: {
                userId_orgId: {
                  userId: superAdminUser.id,
                  orgId: id,
                },
              },
              update: {
                role: "ADMIN",
              },
              create: {
                userId: superAdminUser.id,
                orgId: id,
                role: "ADMIN",
              },
            });
          } catch {}

          // Try to create Clerk membership with retry logic
          try {
            let clerkMembershipCreated = false;
            let retryCount = 0;
            const maxRetries = 3;

            while (!clerkMembershipCreated && retryCount < maxRetries) {
              try {
                const existingMemberships =
                  await clerk.organizations.getOrganizationMembershipList({
                    organizationId: id,
                    limit: 100,
                  });

                const existingMembership = existingMemberships.data?.find(
                  (m) => m.publicUserData?.userId === superAdminUser.id
                );

                if (existingMembership) {
                  clerkMembershipCreated = true;
                  break;
                }

                await clerk.organizations.createOrganizationMembership({
                  organizationId: id,
                  userId: superAdminUser.id,
                  role: "org:admin",
                });

                clerkMembershipCreated = true;
              } catch {
                retryCount++;

                if (retryCount < maxRetries) {
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                } else {
                  // Last resort: send invitation
                  try {
                    await clerk.organizations.createOrganizationInvitation({
                      organizationId: id,
                      emailAddress: trimmedEmail,
                      role: "org:admin",
                    });
                  } catch {}
                }
              }
            }
          } catch {}
        } catch {}
      }

      // Update user's org setup status if needed
      if (!existingOrg) {
        const creator = await prisma.user.findUnique({
          where: { id: created_by },
        });

        if (creator) {
          await prisma.user.update({
            where: { id: creator.id },
            data: { hasCompletedOrgSetup: true },
          });
        }
      }

      revalidatePath("/app");
      revalidatePath("/");
      return new Response("Organization created", { status: 200 });
    } catch (error: any) {
      console.error("❌ Error handling organization.created:", error);

      if (error.code === "P2002") {
        return new Response("Organization already exists", { status: 200 });
      }

      return new Response("Error occurred", {
        status: 500,
      });
    }
  }

  if (eventType === "organization.updated") {
    const { id, name, slug, image_url } = evt.data;

    if (!id) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    try {
      // Check if organization exists before updating
      const existingOrg = await prisma.organization.findUnique({
        where: { id: id },
      });

      if (!existingOrg) {
        return new Response("Organization not found", { status: 200 });
      }

      await prisma.organization.update({
        where: { id: id },
        data: {
          ...(name ? { name } : {}),
          ...(slug ? { slug } : {}),
          ...(image_url !== undefined ? { logoUrl: image_url } : {}),
        },
      });

      revalidatePath("/app");
      return new Response("Organization updated", { status: 200 });
    } catch (error) {
      console.error("Error handling organization.updated:", error);
      return new Response("Error occurred", {
        status: 500,
      });
    }
  }

  if (eventType === "organization.deleted") {
    const { id } = evt.data;

    if (!id) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    try {
      // Check if organization exists before deleting
      const existingOrg = await prisma.organization.findUnique({
        where: { id: id },
      });

      if (!existingOrg) {
        return new Response("Organization already deleted", { status: 200 });
      }

      // Delete organization (forms will cascade delete due to your schema)
      await prisma.organization.delete({
        where: { id: id },
      });

      revalidatePath("/app");
      return new Response("Organization deleted", { status: 200 });
    } catch (error: any) {
      console.error("Error handling organization.deleted:", error);

      // If record not found, it's already deleted
      if (error.code === "P2025") {
        return new Response("Organization already deleted", { status: 200 });
      }

      return new Response("Error occurred", {
        status: 500,
      });
    }
  }

  if (eventType === "organizationMembership.created") {
    const { organization, public_user_data, role } = evt.data;

    if (!organization?.id || !public_user_data?.user_id) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    try {
      // Find default department
      const defaultDepartment = await prisma.department.findFirst({
        where: {
          orgId: organization.id,
          isDefault: true,
        },
      });

      // If no default department exists, create one
      let departmentId = defaultDepartment?.id;
      if (!departmentId) {
        const newDefaultDept = await prisma.department.create({
          data: {
            name: "General",
            slug: "general",
            orgId: organization.id,
            isDefault: true,
          },
        });
        departmentId = newDefaultDept.id;
      }

      await prisma.organizationMembership.upsert({
        where: {
          userId_orgId: {
            userId: public_user_data.user_id,
            orgId: organization.id,
          },
        },
        update: {
          role: role === "admin" || role === "org:admin" ? "ADMIN" : "MEMBER",
          departmentId:
            role === "admin" || role === "org:admin" ? null : departmentId, // Admins don't belong to departments
        },
        create: {
          userId: public_user_data.user_id,
          orgId: organization.id,
          role: role === "admin" || role === "org:admin" ? "ADMIN" : "MEMBER",
          departmentId:
            role === "admin" || role === "org:admin" ? null : departmentId,
        },
      });

      revalidatePath("/app");
      return new Response("Membership created", { status: 200 });
    } catch (error) {
      console.error("Error handling organizationMembership.created:", error);
      return new Response("Error occurred", {
        status: 500,
      });
    }
  }

  if (eventType === "organizationMembership.updated") {
    const { organization, public_user_data, role } = evt.data;

    if (!organization?.id || !public_user_data?.user_id) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    try {
      const existingMembership = await prisma.organizationMembership.findUnique(
        {
          where: {
            userId_orgId: {
              userId: public_user_data.user_id,
              orgId: organization.id,
            },
          },
        }
      );

      if (!existingMembership) {
        return new Response("Membership not found", { status: 200 });
      }

      await prisma.organizationMembership.update({
        where: {
          userId_orgId: {
            userId: public_user_data.user_id,
            orgId: organization.id,
          },
        },
        data: {
          role: role === "admin" || role === "org:admin" ? "ADMIN" : "MEMBER",
        },
      });

      revalidatePath("/app");
      return new Response("Membership updated", { status: 200 });
    } catch (error) {
      console.error("Error handling organizationMembership.updated:", error);
      return new Response("Error occurred", {
        status: 500,
      });
    }
  }

  if (eventType === "organizationMembership.deleted") {
    const { organization, public_user_data } = evt.data;

    if (!organization?.id || !public_user_data?.user_id) {
      return new Response("Error occurred -- missing data", {
        status: 400,
      });
    }

    try {
      const existingMembership = await prisma.organizationMembership.findUnique(
        {
          where: {
            userId_orgId: {
              userId: public_user_data.user_id,
              orgId: organization.id,
            },
          },
        }
      );

      if (!existingMembership) {
        return new Response("Membership already deleted", { status: 200 });
      }

      await prisma.organizationMembership.delete({
        where: {
          userId_orgId: {
            userId: public_user_data.user_id,
            orgId: organization.id,
          },
        },
      });

      await prisma.reportAssignment.deleteMany({
        where: {
          userId: public_user_data.user_id,
        },
      });

      await prisma.user.delete({
        where: {
          id: public_user_data.user_id,
        },
      });

      await (await clerkClient()).users.deleteUser(public_user_data.user_id);

      revalidatePath("/app");
      return new Response("Membership deleted", { status: 200 });
    } catch {
      return new Response("Error occurred", {
        status: 500,
      });
    }
  }

  // Add this at the end of your webhook handler, before the default return
  if (eventType === "organizationInvitation.accepted") {
    const { organization_id, email_address } = evt.data;

    try {
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: email_address },
      });

      if (user) {
        // Create/update database membership
        await prisma.organizationMembership.upsert({
          where: {
            userId_orgId: {
              userId: user.id,
              orgId: organization_id,
            },
          },
          update: {
            role: "ADMIN",
          },
          create: {
            userId: user.id,
            orgId: organization_id,
            role: "ADMIN",
          },
        });
      }
    } catch {}

    return new Response("Invitation processed", { status: 200 });
  }

  // Default response for unhandled events
  return new Response("Event not handled", { status: 200 });
}
