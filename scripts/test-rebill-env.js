#!/usr/bin/env node

// Load environment variables
require("dotenv").config({ path: ".env" });

console.log("🔍 Testing Rebill Environment Configuration\n");

// Backend variables
console.log("📡 Backend Configuration:");
const backendVars = {
  REBILL_ENVIRONMENT: process.env.REBILL_ENVIRONMENT,
  REBILL_API_KEY_TEST: process.env.REBILL_API_KEY_TEST,
  REBILL_API_KEY_PROD: process.env.REBILL_API_KEY_PROD,
  REBILL_SECRET_KEY: process.env.REBILL_SECRET_KEY,
  REBILL_WEBHOOK_SECRET: process.env.REBILL_WEBHOOK_SECRET,
  REBILL_API_URL: process.env.REBILL_API_URL,
};

Object.entries(backendVars).forEach(([key, value]) => {
  const status = value ? "✅" : "❌";
  const displayValue = value
    ? key.includes("KEY") || key.includes("SECRET")
      ? value.substring(0, 8) + "..."
      : value
    : "NOT SET";
  console.log(`  ${status} ${key}: ${displayValue}`);
});

// Frontend variables
console.log("\n🌐 Frontend Configuration:");
const frontendVars = {
  NEXT_PUBLIC_REBILL_ENVIRONMENT: process.env.NEXT_PUBLIC_REBILL_ENVIRONMENT,
  NEXT_PUBLIC_REBILL_API_KEY_TEST: process.env.NEXT_PUBLIC_REBILL_API_KEY_TEST,
  NEXT_PUBLIC_REBILL_API_KEY_PROD: process.env.NEXT_PUBLIC_REBILL_API_KEY_PROD,
};

Object.entries(frontendVars).forEach(([key, value]) => {
  const status = value ? "✅" : "❌";
  const displayValue = value
    ? key.includes("KEY")
      ? value.substring(0, 8) + "..."
      : value
    : "NOT SET";
  console.log(`  ${status} ${key}: ${displayValue}`);
});

// Summary
const backendConfigured = Object.values(backendVars).filter(Boolean).length;
const frontendConfigured = Object.values(frontendVars).filter(Boolean).length;

console.log("\n📊 Summary:");
console.log(`  Backend: ${backendConfigured}/6 variables configured`);
console.log(`  Frontend: ${frontendConfigured}/3 variables configured`);

if (backendConfigured < 6 || frontendConfigured < 3) {
  console.log("\n❌ Missing configuration detected!");
  console.log("📖 Please check REBILL_ENV_SETUP.md for setup instructions");
  process.exit(1);
} else {
  console.log("\n✅ Rebill configuration looks good!");
  console.log("🚀 You should be able to use the checkout functionality");
}
