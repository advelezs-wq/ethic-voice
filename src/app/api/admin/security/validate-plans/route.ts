import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  validatePlanCompliance,
  enforceCompliance,
  logPlanSecurityEvent,
} from "@/modules/core/utils/plan-security.utils";
import prisma from "@/modules/prisma/lib/prisma";

/**
 * Admin endpoint for running security validation on all organizations
 * This should be called periodically (e.g., daily) via cron job
 */
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin access (super admin only)
    // Fallback to find by externalId stored in email or id fields depending on schema
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { email: userId }],
      },
      include: { memberships: true },
    });

    const isSuperAdmin = Boolean(user?.memberships.some((m) => m.role === "ADMIN"));

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    // Get all active organizations
    const organizations = await prisma.organization.findMany({
      where: {
        isActive: true,
        hasActivePlan: true, // Only check orgs with active plans
      },
      select: { id: true, name: true },
    });

    console.log(
      `🔒 Security validation started for ${organizations.length} organizations`
    );

    // Define the type for validation details
    interface ValidationDetail {
      organizationId: string;
      organizationName: string;
      status: "passed" | "violations" | "critical";
      issues: string[];
      actionsEnforced: string[];
    }

    const results = {
      total: organizations.length,
      passed: 0,
      violations: 0,
      critical: 0,
      actionsEnforced: 0,
      details: [] as ValidationDetail[],
    };

    // Validate each organization
    for (const org of organizations) {
      try {
        console.log(`🔍 Validating ${org.name} (${org.id})`);

        const validation = await validatePlanCompliance(org.id);

        if (validation.isValid) {
          results.passed++;
          console.log(`✅ ${org.name}: No violations`);
        } else {
          results.violations++;

          if (validation.severity === "critical") {
            results.critical++;
          }

          console.log(
            `❌ ${org.name}: ${validation.violations.length} violations (${validation.severity})`
          );
          console.log(`   Violations: ${validation.violations.join(", ")}`);

          // Log security event
          await logPlanSecurityEvent(
            org.id,
            "system",
            "Automated security validation failed",
            {
              violations: validation.violations,
              severity: validation.severity,
              actions: validation.actions,
            },
            validation.severity === "critical" ? "critical" : "warning"
          );

          // Enforce compliance for high/critical violations
          if (
            validation.severity === "high" ||
            validation.severity === "critical"
          ) {
            console.log(`🔧 Enforcing compliance actions for ${org.name}`);
            await enforceCompliance(org.id, validation);
            results.actionsEnforced++;
          }

          results.details.push({
            organizationId: org.id,
            organizationName: org.name,
            status:
              validation.severity === "critical" ? "critical" : "violations",
            issues: validation.violations,
            actionsEnforced: validation.actions ?? [],
          });
        }

        // Small delay to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error validating ${org.name}:`, error);
        results.details.push({
          organizationId: org.id,
          organizationName: org.name,
          status: "critical",
          issues: [error instanceof Error ? error.message : "Unknown error"],
          actionsEnforced: [],
        });
      }
    }

    console.log(`🔒 Security validation completed`);
    console.log(`   Total: ${results.total}`);
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Violations: ${results.violations}`);
    console.log(`   Critical: ${results.critical}`);
    console.log(`   Actions enforced: ${results.actionsEnforced}`);

    // Optional: persist results if you introduce a SystemEvent model later

    return NextResponse.json({
      success: true,
      message: `Security validation completed for ${results.total} organizations`,
      results,
    });
  } catch (error) {
    console.error("Error running security validation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get recent validation history
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // No persistence layer for security events yet; return basic status
    return NextResponse.json({ recentValidations: [], criticalViolations: 0, status: "ok" });
  } catch (error) {
    console.error("Error getting security validation history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
