# 📧 Email Digest Setup Guide

This guide explains how to set up and configure the email digest functionality for daily and weekly notification summaries.

## 🚀 Features

- **Daily Digests**: Automatic daily summary emails for users who enable them
- **Weekly Digests**: Automatic weekly summary emails (enabled by default for admins)
- **Role-based Defaults**: Different notification preferences based on user roles
- **Gentle UX**: Conservative email defaults to reduce notification fatigue

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Email Digest Configuration
DIGEST_CRON_TOKEN=your-secure-random-token-here
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### User Role Defaults

The system automatically sets gentle defaults based on user roles:

#### **Super Admin & Org Admin**
- ✅ Email: Report assigned (only)
- ✅ In-app: All notifications
- ✅ Weekly digest: Enabled
- ❌ Daily digest: Disabled
- ❌ Other email notifications: Disabled

#### **Org Member**
- ✅ Email: Report assigned (only)
- ✅ In-app: Assigned reports, status changes, comments
- ❌ In-app: New reports, system alerts
- ❌ All digests: Disabled
- ❌ Other email notifications: Disabled

## 📅 Scheduling

### Using Cron (Linux/Mac)

Add these entries to your crontab (`crontab -e`):

```bash
# Daily digest at 9:00 AM
0 9 * * * curl -X POST -H "Authorization: Bearer YOUR_DIGEST_CRON_TOKEN" https://yourapp.com/api/digest/daily

# Weekly digest on Mondays at 9:00 AM  
0 9 * * 1 curl -X POST -H "Authorization: Bearer YOUR_DIGEST_CRON_TOKEN" https://yourapp.com/api/digest/weekly
```

### Using GitHub Actions

Create `.github/workflows/digest.yml`:

```yaml
name: Email Digests

on:
  schedule:
    # Daily at 9:00 AM UTC
    - cron: '0 9 * * *'
    # Weekly on Mondays at 9:00 AM UTC
    - cron: '0 9 * * 1'
  workflow_dispatch: # Allow manual trigger

jobs:
  daily-digest:
    if: github.event.schedule == '0 9 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Send Daily Digest
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.DIGEST_CRON_TOKEN }}" \
            ${{ secrets.APP_URL }}/api/digest/daily

  weekly-digest:
    if: github.event.schedule == '0 9 * * 1'
    runs-on: ubuntu-latest
    steps:
      - name: Send Weekly Digest
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.DIGEST_CRON_TOKEN }}" \
            ${{ secrets.APP_URL }}/api/digest/weekly
```

### Using Vercel Cron

Add to your `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/digest/daily",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/digest/weekly", 
      "schedule": "0 9 * * 1"
    }
  ]
}
```

## 🛠️ API Endpoints

### Daily Digest

- **URL**: `/api/digest/daily`
- **Method**: `POST` (production) / `GET` (development)
- **Auth**: Bearer token in Authorization header
- **Response**: `{ success: true, message: string, timestamp: string }`

### Weekly Digest

- **URL**: `/api/digest/weekly`
- **Method**: `POST` (production) / `GET` (development)  
- **Auth**: Bearer token in Authorization header
- **Response**: `{ success: true, message: string, timestamp: string }`

## 🧪 Testing

### Development Mode

In development, you can test digests using GET requests:

```bash
# Test daily digest
curl http://localhost:3000/api/digest/daily

# Test weekly digest
curl http://localhost:3000/api/digest/weekly
```

### Production Testing

```bash
# Test daily digest
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" https://yourapp.com/api/digest/daily

# Test weekly digest
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" https://yourapp.com/api/digest/weekly
```

## 📊 Digest Content

### What's Included

- **New Reports**: Count and list of recent reports
- **Assigned Reports**: Reports assigned to the user
- **Status Changes**: Updates on reports the user is following
- **Activity Summary**: Overall activity statistics
- **Quick Actions**: Links to dashboard and relevant reports

### Email Format

- **Responsive HTML**: Works on all devices
- **Professional Design**: Branded with your organization
- **Actionable**: Direct links to relevant content
- **User-Friendly**: Clear sections and easy-to-read format

## 🔐 Security

- **Token Authentication**: All cron endpoints require valid bearer tokens
- **Environment Protection**: Production endpoints reject GET requests
- **Rate Limiting**: Built-in protection against abuse
- **Email Validation**: Only sends to verified user emails

## 📈 Monitoring

### Logs

Monitor digest execution:

```bash
# Check application logs for digest processing
tail -f logs/app.log | grep "digest"
```

### Success Metrics

- Users with digests enabled
- Successful digest deliveries
- Email delivery rates
- User engagement with digest emails

## 🎯 User Experience

### Profile Settings

Users can customize their digest preferences in:
- **Profile Page** → **Notification Preferences** tab
- Toggle daily/weekly digests
- Set preferred delivery time
- Control email vs in-app notifications

### Default Behavior

- **New Users**: Get gentle defaults based on their role
- **Existing Users**: Keep their current settings
- **Admins**: Weekly digest enabled by default
- **Members**: All digests disabled by default

## 🚨 Troubleshooting

### Common Issues

1. **Digests not sending**
   - Check RESEND_API_KEY is valid
   - Verify DIGEST_CRON_TOKEN matches
   - Check user email addresses exist

2. **Wrong content in digest**
   - Verify date range calculations
   - Check organization membership
   - Validate user permissions

3. **Cron not triggering**
   - Check cron schedule syntax
   - Verify server timezone
   - Test endpoint manually

### Support

For issues with digest functionality:
1. Check application logs
2. Verify environment variables
3. Test endpoints manually
4. Contact development team 