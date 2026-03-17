# Demo Mode Setup for Platform Screenshots

This guide explains how to enable demo mode to show realistic dummy data in the platform for taking screenshots and demos.

## What is Demo Mode?

Demo mode replaces real database data with realistic dummy data to make the platform look fully functional with:

- 247 total reports
- 23 new reports
- 18 in progress reports
- 206 closed reports
- Realistic charts and analytics
- Sample organizations (for super admin)
- Sample reports with different categories and severities

## How to Enable Demo Mode

### Option 1: Using npm scripts (Recommended)

1. **Start with demo mode enabled:**

   ```bash
   npm run dev
   ```

   (Demo mode is now enabled by default)

2. **Or use specific scripts:**

   ```bash
   npm run dev:demo    # For demo data
   npm run dev:real    # For real data
   ```

3. **Take your screenshots** - The platform will show dummy data

### Option 2: Using the provided scripts

1. **Enable demo mode:**

   ```bash
   ./enable-demo-mode.sh
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **To disable demo mode:**
   ```bash
   ./disable-demo-mode.sh
   ```

### Option 3: Manual environment variable

1. **Set the environment variable:**

   ```bash
   export NEXT_PUBLIC_DEMO_MODE=true
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **To disable:**
   ```bash
   export NEXT_PUBLIC_DEMO_MODE=false
   ```

## What Data is Shown in Demo Mode

### Organization Admin Dashboard

- **Stats Cards:**
  - Total Reports: 247
  - New Reports: 23
  - In Progress: 18
  - Closed Reports: 206
  - Critical Reports: 8
  - Anonymous Reports: 34
  - Average Resolution Time: 4.2 days
  - Percentage Change: +12.5%

- **Recent Reports:**
  - Violación de políticas de seguridad (HIGH)
  - Discriminación en el trabajo (MEDIUM)
  - Mal uso de recursos corporativos (LOW)
  - Conflicto de intereses (HIGH)
  - Acoso laboral (HIGH)

- **Charts:**
  - Monthly distribution with realistic data
  - Category distribution (HR, Security, Finance, Compliance, Operations)
  - Department analysis
  - Severity distribution
  - Weekly trends

### Super Admin Dashboard

- **System Stats:**
  - Total Organizations: 5
  - Total Reports: 744
  - Total Users: 139
  - Active Reports: 52
  - Average Resolution Time: 4.8 days
  - System Uptime: 99.9%

- **Sample Organizations:**
  - TechCorp Solutions (247 reports, 45 members)
  - Global Industries (189 reports, 32 members)
  - Innovate Labs (134 reports, 28 members)
  - Future Systems (98 reports, 19 members)
  - Digital Dynamics (76 reports, 15 members)

### Member Dashboard

- **Filtered Data:**
  - Only shows reports assigned to the current user
  - Reduced numbers but realistic proportions
  - 12 total assigned reports
  - 3 new, 2 in progress, 7 closed

## Demo Data Features

### Realistic Report Categories

- Recursos Humanos (HR)
- Seguridad (Security)
- Finanzas (Finance)
- Compliance
- Operaciones (Operations)

### Severity Levels

- HIGH (Critical)
- MEDIUM (Important)
- LOW (Minor)
- UNKNOWN

### Report Sources

- ETHIC_LINE (Anonymous reports)
- CUSTOM_FORM (Named reports)

### Departments

- Tecnología (Technology)
- Recursos Humanos (HR)
- Finanzas (Finance)
- Compliance
- Operaciones (Operations)
- Marketing

## Switching Between Demo and Real Data

### Quick Switch (Recommended)

```bash
npm run dev:demo    # For demo data
npm run dev:real    # For real data
```

### Using Scripts

1. **To enable demo mode:**

   ```bash
   ./enable-demo-mode.sh
   ```

2. **To disable demo mode:**

   ```bash
   ./disable-demo-mode.sh
   ```

3. **Restart the development server** after changing the mode

## Visual Indicators

When demo mode is active, you'll see:

- **"Modo Demo"** chip in the dashboard header
- Realistic data that looks professional
- All analytics and charts populated with dummy data

## Important Notes

- Demo mode only affects the analytics and dashboard data
- All other functionality (forms, submissions, etc.) remains unchanged
- The dummy data is generated client-side and doesn't affect your database
- You can switch between demo and real data by restarting the server
- Demo data is designed to look realistic and professional
- Demo mode is now enabled by default in the `npm run dev` script

## Troubleshooting

If demo mode isn't working:

1. **Check if the environment variable is set:**

   ```bash
   echo $NEXT_PUBLIC_DEMO_MODE
   ```

   Should return `true` when enabled

2. **Restart the development server** after enabling/disabling demo mode

3. **Clear browser cache** if you're still seeing old data

4. **Check browser console** for any errors

5. **Use the specific npm scripts:**
   ```bash
   npm run dev:demo    # Forces demo mode
   npm run dev:real    # Forces real data
   ```

## Files Modified for Demo Mode

- `src/modules/app/services/demo-analytics.service.ts` - Demo data generators
- `src/modules/app/services/analytics.service.ts` - Demo mode integration
- `src/modules/app/components/dashboard/super-admin/SuperAdminDashboard.tsx` - Super admin demo data
- `src/modules/app/components/dashboard/admin/AdminDashboard.tsx` - Admin demo indicator
- `package.json` - Updated scripts with demo mode
- `enable-demo-mode.sh` - Script to enable demo mode
- `disable-demo-mode.sh` - Script to disable demo mode
