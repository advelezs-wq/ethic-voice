#!/bin/bash

# Script to enable demo mode for platform screenshots
echo "Enabling demo mode for platform screenshots..."

# Set the environment variable for demo mode
export NEXT_PUBLIC_DEMO_MODE=true

echo "Demo mode enabled! The platform will now show dummy data."
echo "To disable demo mode, run: ./disable-demo-mode.sh"
echo ""
echo "You can now start the development server with: npm run dev"
echo "The analytics dashboard will show realistic dummy data."
echo ""
echo "Or use the specific scripts:"
echo "- npm run dev:demo (for demo data)"
echo "- npm run dev:real (for real data)" 