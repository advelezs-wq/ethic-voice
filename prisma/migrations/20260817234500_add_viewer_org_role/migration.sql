-- AlterEnum: read-only oversight role (external auditor / board / compliance
-- viewer). Purely additive — no existing OrganizationMembership row uses it.
ALTER TYPE "OrganizationRole" ADD VALUE 'VIEWER';
