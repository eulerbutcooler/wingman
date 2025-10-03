#!/bin/bash

# Inngest Setup Verification Script
# Run this to verify everything is set up correctly

echo "🔍 Verifying Inngest Setup..."
echo ""

# Check if Inngest is installed
echo "✓ Checking Inngest package..."
if grep -q '"inngest"' package.json; then
    echo "  ✅ Inngest package found in package.json"
else
    echo "  ❌ Inngest package NOT found!"
    exit 1
fi

# Check if client exists
echo "✓ Checking Inngest client..."
if [ -f "src/inngest/client.ts" ]; then
    echo "  ✅ Inngest client found"
else
    echo "  ❌ Inngest client NOT found!"
    exit 1
fi

# Check if function exists
echo "✓ Checking process-document function..."
if [ -f "src/inngest/functions/process-document.ts" ]; then
    echo "  ✅ Process document function found"
else
    echo "  ❌ Process document function NOT found!"
    exit 1
fi

# Check if API route exists
echo "✓ Checking Inngest API route..."
if [ -f "src/app/api/inngest/route.ts" ]; then
    echo "  ✅ Inngest API route found"
else
    echo "  ❌ Inngest API route NOT found!"
    exit 1
fi

# Check if status API exists
echo "✓ Checking status API..."
if [ -f "src/app/api/files/status/route.ts" ]; then
    echo "  ✅ Status API found"
else
    echo "  ❌ Status API NOT found!"
    exit 1
fi

# Check environment variables
echo "✓ Checking environment variables..."
if [ -f ".env.local" ]; then
    if grep -q "INNGEST_EVENT_KEY" .env.local; then
        echo "  ✅ INNGEST_EVENT_KEY found in .env.local"
    else
        echo "  ⚠️  INNGEST_EVENT_KEY not found (optional for local dev)"
    fi
else
    echo "  ⚠️  .env.local not found (optional for local dev)"
fi

echo ""
echo "🎉 Setup verification complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Go to: http://localhost:3000"
echo "  3. Create a course with files"
echo "  4. Watch Inngest process them!"
echo ""
echo "📊 Monitor at: https://app.inngest.com"
echo ""
