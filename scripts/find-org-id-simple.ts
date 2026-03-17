#!/usr/bin/env tsx

/**
 * Simple script to find Rebill Organization ID
 * Run with: npx tsx scripts/find-org-id-simple.ts
 */

const REBILL_SECRET_KEY = process.env.REBILL_SECRET_KEY;
const REBILL_API_URL = "https://api.rebill.com/v2";

async function findOrgId() {
  console.log("🔍 Finding Rebill Organization ID...");
  console.log("=====================================");

  if (!REBILL_SECRET_KEY) {
    throw new Error(
      "Missing REBILL_SECRET_KEY. Add it to your environment before running this script."
    );
  }

  try {
    // Try different endpoints that might not require org ID
    const endpoints = ["/profile", "/account", "/organization", "/me", "/user"];

    for (const endpoint of endpoints) {
      console.log(`\n🔄 Trying ${endpoint}...`);

      try {
        const response = await fetch(`${REBILL_API_URL}${endpoint}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${REBILL_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();

        if (response.ok) {
          console.log(
            `✅ ${endpoint} response:`,
            JSON.stringify(result, null, 2)
          );

          // Look for organization ID in various places
          const orgId =
            result.organizationId ||
            result.organization?.id ||
            result.orgId ||
            result.org?.id;

          if (orgId) {
            console.log(`\n🎉 FOUND Organization ID: ${orgId}`);
            console.log(`\nAdd this to your .env file:`);
            console.log(`REBILL_ORGANIZATION_ID=${orgId}`);
            return;
          }
        } else {
          console.log(`❌ ${endpoint} failed:`, result.message || result.error);
        }
      } catch (err) {
        console.log(
          `❌ ${endpoint} error:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    console.log("\n💡 Organization ID not found in API responses.");
    console.log("📋 Manual steps:");
    console.log("1. Go to https://dashboard.rebill.com");
    console.log("2. Look at the URL: dashboard.rebill.com/org/[ORG-ID]/...");
    console.log("3. Copy the ORG-ID from the URL");
    console.log("4. Add REBILL_ORGANIZATION_ID=[ORG-ID] to your .env file");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the script
findOrgId();
