/**
 * Script to create all EthicVoice plans in Rebill
 * Run with: npm run create-rebill-plans
 */

import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const envLines = envContent.split("\n");

    for (const line of envLines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          process.env[key.trim()] = value;
        }
      }
    }
    console.log("✅ Loaded environment variables from .env file");
  } else {
    console.warn(
      "⚠️ .env file not found. Make sure to configure Rebill credentials."
    );
  }
}

// Load environment variables first
loadEnvFile();

interface RebillPlanRequest {
  name: string;
  description: string;
  frequency: {
    type: "months" | "years";
    quantity: number;
  };
  currencies: Array<{
    currency: string;
    amount: number;
  }>;
  type: "fixed";
  repetitions: null; // null = unlimited cycles
  metadata?: Record<string, any>;
}

interface EthicVoicePlanDefinition {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  metadata: {
    planType: string;
    maxUsers: number;
    maxInvestigators: number;
    maxEmployees: number;
    hasEmailChannel: boolean;
    hasAiProcessing: boolean;
  };
}

// ✅ EthicVoice Plans Configuration
const ETHIC_VOICE_PLANS: Record<string, EthicVoicePlanDefinition> = {
  STARTER: {
    name: "EthicVoice Starter",
    description:
      "Plan básico para organizaciones con hasta 50 empleados. Canal web básico y analíticas esenciales.",
    monthlyPrice: 150000, // 150,000 COP/mes
    yearlyPrice: 1500000, // 1,500,000 COP/año (10 meses - 20% descuento)
    metadata: {
      planType: "STARTER",
      maxUsers: 1,
      maxInvestigators: 4,
      maxEmployees: 50,
      hasEmailChannel: false,
      hasAiProcessing: false,
    },
  },
  GROW: {
    name: "EthicVoice Grow",
    description:
      "Plan popular para organizaciones con hasta 200 empleados. Incluye canal email y procesamiento IA.",
    monthlyPrice: 420000, // 420,000 COP/mes
    yearlyPrice: 4200000, // 4,200,000 COP/año (10 meses - 20% descuento)
    metadata: {
      planType: "GROW",
      maxUsers: 1,
      maxInvestigators: 10,
      maxEmployees: 200,
      hasEmailChannel: true,
      hasAiProcessing: true,
    },
  },
  GROW_PRO: {
    name: "EthicVoice Grow Pro",
    description:
      "Plan avanzado para organizaciones con hasta 500 empleados. Incluye chatbot, IA avanzada y analíticas completas.",
    monthlyPrice: 920000, // 920,000 COP/mes
    yearlyPrice: 9200000, // 9,200,000 COP/año (10 meses - 20% descuento)
    metadata: {
      planType: "GROW_PRO",
      maxUsers: 2,
      maxInvestigators: 20,
      maxEmployees: 500,
      hasEmailChannel: true,
      hasAiProcessing: true,
    },
  },
  PREMIUM: {
    name: "EthicVoice Premium",
    description:
      "Plan empresarial con funcionalidades ilimitadas. Consulta por precios corporativos.",
    monthlyPrice: 0, // Contact us
    yearlyPrice: 0, // Contact us
    metadata: {
      planType: "PREMIUM",
      maxUsers: -1, // Unlimited
      maxInvestigators: -1, // Unlimited
      maxEmployees: -1, // Unlimited
      hasEmailChannel: true,
      hasAiProcessing: true,
    },
  },
};

class RebillPlanCreator {
  private apiUrl: string;
  private secretKey: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.REBILL_API_URL || "https://api.rebill.com/v2";
    this.secretKey = process.env.REBILL_SECRET_KEY || "";
    this.apiKey = process.env.REBILL_API_KEY_TEST || "";

    console.log("🔍 Checking Rebill credentials...");
    console.log(`  API URL: ${this.apiUrl}`);
    console.log(`  Secret Key: ${this.secretKey ? "✅ Set" : "❌ Missing"}`);
    console.log(`  API Key: ${this.apiKey ? "✅ Set" : "❌ Missing"}`);

    if (!this.secretKey || !this.apiKey) {
      console.error("\n❌ Missing Rebill credentials in .env file:");
      console.error("Required variables:");
      console.error("  - REBILL_SECRET_KEY=sk_test_your-rebill-secret-key");
      console.error("  - REBILL_API_KEY_TEST=pk_test_your-rebill-api-key");
      console.error("  - REBILL_API_URL=https://api.rebill.com/v2 (optional)");
      throw new Error("Missing Rebill credentials. Check your .env file.");
    }
  }

  async createPlan(planData: RebillPlanRequest): Promise<any> {
    console.log(`🔄 Creating plan: ${planData.name}`);

    try {
      // ✅ Format request exactly like Rebill documentation
      const requestBody = {
        name: planData.name,
        description: planData.description,
        frequency: planData.frequency,
        type: planData.type,
        repetitions: planData.repetitions,
        currencies: planData.currencies,
        // ✅ Add required fields from Rebill docs
        debitDay: null,
        debitType: null,
        // ✅ Add metadata if provided
        ...(planData.metadata && { metadata: planData.metadata }),
      };

      console.log(`📡 Request payload:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.apiUrl}/plans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      console.log(`📥 Response status: ${response.status}`);
      console.log(`📥 Response body:`, JSON.stringify(result, null, 2));

      if (response.ok) {
        console.log(
          `✅ Plan created successfully: ${result.plan?.id || result.id}`
        );
        return result;
      } else {
        console.error(`❌ Failed to create plan ${planData.name}:`, result);

        // Provide more detailed error information
        if (result.message) {
          throw new Error(`Rebill API Error: ${result.message}`);
        } else if (result.error) {
          throw new Error(`Rebill API Error: ${result.error}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error creating plan ${planData.name}:`, error);
      throw error;
    }
  }

  async createAllPlans(): Promise<Record<string, string>> {
    const createdPlans: Record<string, string> = {};

    for (const [planKey, planDef] of Object.entries(ETHIC_VOICE_PLANS)) {
      try {
        // Skip PREMIUM if it's contact-us only
        if (planDef.monthlyPrice === 0) {
          console.log(`⏭️ Skipping ${planKey} (Contact us plan)`);
          continue;
        }

        // Create Monthly plan
        const monthlyPlan: RebillPlanRequest = {
          name: `${planDef.name} - Mensual`,
          description: `${planDef.description} (Facturación mensual)`,
          frequency: { type: "months", quantity: 1 },
          currencies: [{ currency: "COP", amount: planDef.monthlyPrice }],
          type: "fixed",
          repetitions: null,
          metadata: {
            ...planDef.metadata,
            billingCycle: "MONTHLY",
            ethicVoicePlan: planKey,
          },
        };

        const monthlyResult = await this.createPlan(monthlyPlan);
        createdPlans[`${planKey}_MONTHLY`] = monthlyResult.plan.id;

        // Create Yearly plan
        const yearlyPlan: RebillPlanRequest = {
          name: `${planDef.name} - Anual`,
          description: `${planDef.description} (Facturación anual - 20% descuento)`,
          frequency: { type: "months", quantity: 12 },
          currencies: [{ currency: "COP", amount: planDef.yearlyPrice }],
          type: "fixed",
          repetitions: null,
          metadata: {
            ...planDef.metadata,
            billingCycle: "YEARLY",
            ethicVoicePlan: planKey,
            discount: "20%",
          },
        };

        const yearlyResult = await this.createPlan(yearlyPlan);
        createdPlans[`${planKey}_YEARLY`] = yearlyResult.plan.id;

        // Wait between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to create plans for ${planKey}:`, error);
        // Continue with other plans
      }
    }

    return createdPlans;
  }

  generateEnvVariables(createdPlans: Record<string, string>): string {
    let envContent =
      "\n# ✅ Rebill Plan IDs - Generated by create-rebill-plans.ts\n";

    for (const [planKey, planId] of Object.entries(createdPlans)) {
      envContent += `REBILL_${planKey}_PLAN_ID=${planId}\n`;
    }

    return envContent;
  }
}

async function main() {
  console.log("🚀 Creating EthicVoice plans in Rebill...\n");

  try {
    const creator = new RebillPlanCreator();
    const createdPlans = await creator.createAllPlans();

    console.log("\n✅ Plan creation completed!");
    console.log("\n📋 Created Plans:");
    Object.entries(createdPlans).forEach(([key, id]) => {
      console.log(`  ${key}: ${id}`);
    });

    console.log("\n🔧 Environment Variables:");
    console.log(creator.generateEnvVariables(createdPlans));

    console.log("\n📝 Next Steps:");
    console.log("1. Copy the environment variables above to your .env file");
    console.log("2. Restart your development server");
    console.log("3. Test the subscription flow");
    console.log(
      '4. Verify in Rebill dashboard that plans appear in "Plans" section'
    );
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
