import { Organization, User } from "@prisma/client";

export type UserType = User & { organizations: Organization[] };
