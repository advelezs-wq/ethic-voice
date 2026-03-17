#!/usr/bin/env tsx

/**
 * Script to get Rebill Organization ID
 * Run with: npx tsx scripts/get-rebill-org-id.ts
 */

// Environment variables are loaded by Next.js from .env file

interface RebillConfig {
  secretKey: string;
  apiUrl: string;
}

class RebillOrgFinder {
  private config: RebillConfig;

  constructor() {
    this.config = {
      secretKey: process.env.REBILL_SECRET_KEY || "",
      apiUrl: process.env.REBILL_API_URL || "https://api.rebill.com/v2",
    };

    console.log("🔍 Rebill Organization ID Finder");
    console.log("================================");
    console.log(`API URL: ${this.config.apiUrl}`);
    console.log(
      `Secret Key: ${this.config.secretKey ? "✅ Set" : "❌ Missing"}`
    );
    console.log("");

    if (!this.config.secretKey) {
      console.error("❌ Missing REBILL_SECRET_KEY in .env file");
      console.error("Add: REBILL_SECRET_KEY=sk_test_your-secret-key");
      process.exit(1);
    }
  }

  async findOrganizationId(): Promise<void> {
    try {
      console.log("🔄 Trying method 1: Get user profile...");

      // Method 1: Try to get user profile (might contain org info)
      const profileResponse = await fetch(`${this.config.apiUrl}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        console.log("✅ Profile response:", JSON.stringify(profile, null, 2));

        if (profile.organizationId || profile.organization?.id) {
          const orgId = profile.organizationId || profile.organization.id;
          console.log(`🎉 Found Organization ID: ${orgId}`);
          console.log(`\nAdd this to your .env file:`);
          console.log(`REBILL_ORGANIZATION_ID=${orgId}`);
          return;
        }
      }

      console.log(
        "🔄 Trying method 2: Get plans (might show org in response)..."
      );

      // Method 2: Try to get plans (response headers might contain org info)
      const plansResponse = await fetch(`${this.config.apiUrl}/plans`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
        },
      });

      if (plansResponse.ok) {
        const plans = await plansResponse.json();
        console.log(
          "📋 Plans response (first plan):",
          JSON.stringify(plans[0] || plans, null, 2)
        );

        // Look for organization ID in the response
        const firstPlan = Array.isArray(plans) ? plans[0] : plans;
        if (firstPlan?.organizationId) {
          console.log(
            `🎉 Found Organization ID in plans: ${firstPlan.organizationId}`
          );
          console.log(`\nAdd this to your .env file:`);
          console.log(`REBILL_ORGANIZATION_ID=${firstPlan.organizationId}`);
          return;
        }
      }

      console.log(
        "🔄 Trying method 3: Test checkout request to extract org ID from error..."
      );

      // Method 3: Make a minimal checkout request that might fail but show us org info
      const testResponse = await fetch(`${this.config.apiUrl}/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.secretKey}`,
          "Content-Type": "application/json",
          // Intentionally missing organization_id to see if error reveals it
        },
        body: JSON.stringify({
          customer: {
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
          },
          transaction: {
            name: "Test Transaction",
            description: "Test to get org ID",
            amount: 100,
            currency: "USD",
            type: "fixed",
          },
          installments: { quantity: 1 },
        }),
      });

      const testResult = await testResponse.json();
      console.log("🔍 Test response:", JSON.stringify(testResult, null, 2));

      if (testResult.error || testResult.message) {
        console.log("\n💡 If you see an error about missing organization_id,");
        console.log("   check your Rebill dashboard for the Organization ID");
      }

      console.log("\n📋 Manual steps to find Organization ID:");
      console.log("1. Go to https://dashboard.rebill.com");
      console.log("2. Look in Settings > Organization");
      console.log("3. Or check the URL: dashboard.rebill.com/org/[ORG-ID]/...");
      console.log(
        "4. Or open DevTools > Network and look for 'organization_id' headers"
      );
    } catch (error) {
      console.error("❌ Error finding Organization ID:", error);
      console.log("\n📋 Manual steps to find Organization ID:");
      console.log("1. Go to https://dashboard.rebill.com");
      console.log("2. Look in Settings > Organization");
      console.log("3. Or check the URL: dashboard.rebill.com/org/[ORG-ID]/...");
    }
  }
}

// Run the script
async function main() {
  const finder = new RebillOrgFinder();
  await finder.findOrganizationId();
}

if (require.main === module) {
  main().catch(console.error);
}
