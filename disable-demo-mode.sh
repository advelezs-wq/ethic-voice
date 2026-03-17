#!/bin/bash

# Script to disable demo mode and return to real data
echo "Disabling demo mode..."

# Unset the environment variable for demo mode
export NEXT_PUBLIC_DEMO_MODE=false

echo "Demo mode disabled! The platform will now show real data from the database."
echo "To enable demo mode again, run: ./enable-demo-mode.sh"
echo ""
echo "You can now start the development server with: npm run dev:real"
echo "The analytics dashboard will show actual data from your database."
echo ""
echo "Or use the specific scripts:"
echo "- npm run dev:demo (for demo data)"
echo "- npm run dev:real (for real data)" 