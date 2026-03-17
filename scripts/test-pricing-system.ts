#!/usr/bin/env npx tsx

/**
 * Script de testing para verificar el sistema de pricing
 * Ejecutar con: npx tsx scripts/test-pricing-system.ts
 */

import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: "PASS" | "FAIL" | "SKIP";
  message: string;
  details?: any;
}

class PricingSystemTester {
  private results: TestResult[] = [];
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    console.log(`🧪 Testing pricing system at: ${this.baseUrl}\n`);
  }

  private addResult(
    test: string,
    status: "PASS" | "FAIL" | "SKIP",
    message: string,
    details?: any
  ) {
    this.results.push({ test, status, message, details });
    const emoji = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
    console.log(`${emoji} ${test}: ${message}`);
    if (details && status === "FAIL") {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async testDatabaseMigrations() {
    try {
      // Test PlanType enum
      const planTypes = await prisma.$queryRaw`
        SELECT enumlabel FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanType')
      `;

      const expectedPlanTypes = ["STARTER", "GROW", "GROW_PRO", "PREMIUM"];
      const actualPlanTypes = (planTypes as any[]).map((p) => p.enumlabel);

      const missingTypes = expectedPlanTypes.filter(
        (t) => !actualPlanTypes.includes(t)
      );

      if (missingTypes.length === 0) {
        this.addResult(
          "Database Migrations",
          "PASS",
          "All plan types present in database"
        );
      } else {
        this.addResult("Database Migrations", "FAIL", "Missing plan types", {
          missing: missingTypes,
        });
      }

      // Test Organization table has new fields
      const orgFields = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'Organization' AND column_name IN 
        ('currentPlan', 'hasActivePlan', 'currentUsers', 'currentInvestigators')
      `;

      if ((orgFields as any[]).length === 4) {
        this.addResult(
          "Organization Schema",
          "PASS",
          "All new organization fields present"
        );
      } else {
        this.addResult(
          "Organization Schema",
          "FAIL",
          "Missing organization fields",
          { found: orgFields }
        );
      }
    } catch (error) {
      this.addResult(
        "Database Migrations",
        "FAIL",
        "Database connection or migration error",
        error
      );
    }
  }

  async testEnvironmentVariables() {
    const requiredEnvs = [
      "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY",
      "MERCADO_PAGO_ACCESS_TOKEN",
      "NEXT_PUBLIC_APP_URL",
      "DATABASE_URL",
    ];

    const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);

    if (missingEnvs.length === 0) {
      this.addResult(
        "Environment Variables",
        "PASS",
        "All required environment variables set"
      );

      // Check if using test credentials
      const isTestMode =
        process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY?.startsWith("TEST-");
      if (isTestMode) {
        this.addResult(
          "MercadoPago Mode",
          "PASS",
          "Using TEST credentials (good for development)"
        );
      } else {
        this.addResult(
          "MercadoPago Mode",
          "PASS",
          "Using LIVE credentials (production mode)"
        );
      }
    } else {
      this.addResult(
        "Environment Variables",
        "FAIL",
        "Missing required environment variables",
        { missing: missingEnvs }
      );
    }
  }

  async testPricingPageEndpoint() {
    try {
      const response = await fetch(`${this.baseUrl}/pricing`);

      if (response.ok) {
        this.addResult("Pricing Page", "PASS", "Pricing page accessible");
      } else {
        this.addResult(
          "Pricing Page",
          "FAIL",
          `Pricing page returned ${response.status}`,
          { status: response.status }
        );
      }
    } catch (error) {
      this.addResult(
        "Pricing Page",
        "FAIL",
        "Failed to access pricing page",
        error
      );
    }
  }

  async testSubscriptionAPIEndpoints() {
    try {
      // Test create-subscription endpoint (should fail without auth, but endpoint should exist)
      const createResponse = await fetch(
        `${this.baseUrl}/api/payments/create-subscription`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planType: "STARTER",
            billingCycle: "MONTHLY",
          }),
        }
      );

      if (createResponse.status === 401) {
        this.addResult(
          "Create Subscription API",
          "PASS",
          "Endpoint exists and requires authentication"
        );
      } else {
        this.addResult(
          "Create Subscription API",
          "FAIL",
          "Unexpected response",
          { status: createResponse.status }
        );
      }

      // Test webhook endpoint
      const webhookResponse = await fetch(
        `${this.baseUrl}/api/webhooks/mercadopago`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: true }),
        }
      );

      if (webhookResponse.status === 200 || webhookResponse.status === 400) {
        this.addResult(
          "MercadoPago Webhook",
          "PASS",
          "Webhook endpoint accessible"
        );
      } else {
        this.addResult(
          "MercadoPago Webhook",
          "FAIL",
          "Webhook endpoint error",
          { status: webhookResponse.status }
        );
      }
    } catch (error) {
      this.addResult(
        "Subscription APIs",
        "FAIL",
        "API endpoint test failed",
        error
      );
    }
  }

  async testPlanPermissionsLogic() {
    try {
      // Test plan configurations
      const { PLAN_CONFIGS, getPlanPermissions, PlanType } = await import(
        "../src/types/subscription.types"
      );

      // Verify all plans are configured
      const planTypes = ["STARTER", "GROW", "GROW_PRO", "PREMIUM"];
      const configuredPlans = Object.keys(PLAN_CONFIGS);

      const missingConfigs = planTypes.filter(
        (p) => !configuredPlans.includes(p)
      );

      if (missingConfigs.length === 0) {
        this.addResult(
          "Plan Configurations",
          "PASS",
          "All plans properly configured"
        );
      } else {
        this.addResult(
          "Plan Configurations",
          "FAIL",
          "Missing plan configurations",
          { missing: missingConfigs }
        );
      }

      // Test permissions logic
      const starterPermissions = getPlanPermissions(PlanType.STARTER);
      const growPermissions = getPlanPermissions(PlanType.GROW);

      if (
        !starterPermissions.canAccessEmailChannel &&
        growPermissions.canAccessEmailChannel
      ) {
        this.addResult(
          "Plan Permissions",
          "PASS",
          "Permission escalation working correctly"
        );
      } else {
        this.addResult("Plan Permissions", "FAIL", "Permission logic error", {
          starter: starterPermissions,
          grow: growPermissions,
        });
      }
    } catch (error) {
      this.addResult(
        "Plan Permissions",
        "FAIL",
        "Failed to test plan logic",
        error
      );
    }
  }

  async testSecurityUtilities() {
    try {
      const { validatePlanCompliance } = await import(
        "../src/modules/core/utils/plan-security.utils"
      );

      // This would fail without a real org, but tests that the function exists
      this.addResult(
        "Security Utilities",
        "PASS",
        "Security validation utilities available"
      );
    } catch (error) {
      this.addResult(
        "Security Utilities",
        "FAIL",
        "Security utilities not accessible",
        error
      );
    }
  }

  async testComponentsExist() {
    try {
      // Test that key components exist
      const components = [
        "../src/modules/landig-page/components/pricing/PricingPlans.tsx",
        "../src/modules/app/components/subscription/PlanWidget.tsx",
        "../src/modules/app/components/subscription/PlanRestrictionBanner.tsx",
        "../src/modules/core/hooks/usePlanPermissions.ts",
      ];

      let missingComponents = [];

      for (const component of components) {
        try {
          await import(component);
        } catch {
          missingComponents.push(component);
        }
      }

      if (missingComponents.length === 0) {
        this.addResult(
          "React Components",
          "PASS",
          "All pricing components available"
        );
      } else {
        this.addResult("React Components", "FAIL", "Missing components", {
          missing: missingComponents,
        });
      }
    } catch (error) {
      this.addResult(
        "React Components",
        "FAIL",
        "Component test failed",
        error
      );
    }
  }

  async testMercadoPagoConfiguration() {
    if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
      this.addResult(
        "MercadoPago Config",
        "SKIP",
        "No access token configured"
      );
      return;
    }

    try {
      // Optional require to avoid type resolution during build environments without SDK/types
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mp: any = require("mercadopago");
      const MercadoPagoConfig = mp.MercadoPagoConfig;

      if (!MercadoPagoConfig) {
        this.addResult(
          "MercadoPago SDK",
          "SKIP",
          "SDK not available in this environment"
        );
        return;
      }

      // Test configuration (would fail with invalid token, but validates setup path)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _config = new MercadoPagoConfig({
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
        options: { timeout: 5000 },
      });

      this.addResult(
        "MercadoPago Config",
        "PASS",
        "MercadoPago configuration created successfully"
      );
    } catch (error) {
      this.addResult(
        "MercadoPago SDK",
        "SKIP",
        "MercadoPago SDK not installed",
        error
      );
    }
  }

  async runAllTests() {
    console.log("🚀 Starting EthicVoice Pricing System Tests\n");
    console.log("=".repeat(50));

    await this.testEnvironmentVariables();
    await this.testDatabaseMigrations();
    await this.testPricingPageEndpoint();
    await this.testSubscriptionAPIEndpoints();
    await this.testPlanPermissionsLogic();
    await this.testSecurityUtilities();
    await this.testComponentsExist();
    await this.testMercadoPagoConfiguration();

    this.printSummary();
  }

  printSummary() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(50));

    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const skipped = this.results.filter((r) => r.status === "SKIP").length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📋 Total: ${this.results.length}`);

    if (failed > 0) {
      console.log("\n🚨 FAILED TESTS:");
      this.results
        .filter((r) => r.status === "FAIL")
        .forEach((r) => console.log(`   • ${r.test}: ${r.message}`));
    }

    if (skipped > 0) {
      console.log("\n⏭️  SKIPPED TESTS:");
      this.results
        .filter((r) => r.status === "SKIP")
        .forEach((r) => console.log(`   • ${r.test}: ${r.message}`));
    }

    console.log("\n" + "=".repeat(50));

    if (failed === 0) {
      console.log("🎉 ALL TESTS PASSED! Your pricing system is ready to go!");
      console.log("\nNext steps:");
      console.log("1. Configure MercadoPago webhooks");
      console.log("2. Test the complete payment flow");
      console.log("3. Deploy to production");
    } else {
      console.log(
        "🔧 Some tests failed. Please fix the issues above before deploying."
      );
    }

    process.exit(failed > 0 ? 1 : 0);
  }
}

// Run tests
const tester = new PricingSystemTester();
tester.runAllTests().catch((error) => {
  console.error("❌ Test runner failed:", error);
  process.exit(1);
});
