# Email Setup Guide for User Service

## Problem
The email verification is not working because the SendGrid API key and other environment variables are not configured.

## Solution

### Step 1: Create a .env file
Create a `.env` file in the `Lyvo microservices/user-service/` directory with the following content:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/lyvo-user-service

# SendGrid Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@lyvo.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Step 2: Get SendGrid API Key

1. Go to [SendGrid](https://sendgrid.com/) and create a free account
2. Navigate to Settings > API Keys
3. Create a new API Key with "Mail Send" permissions
4. Copy the API key and replace `your-sendgrid-api-key-here` in the .env file

### Step 3: Verify Sender Email

1. In SendGrid, go to Settings > Sender Authentication
2. Verify your sender domain or at least verify a single sender email
3. Use the verified email address as your `SENDGRID_FROM_EMAIL`

### Step 4: Update JWT Secret

Replace `your-super-secret-jwt-key-change-this-in-production` with a strong, random string.

### Step 5: Restart the Server

After creating the .env file, restart your user service:

```bash
cd Lyvo microservices/user-service
npm run dev
```

## Testing

1. Try registering a new user
2. Check the console logs for email sending status
3. Check your email inbox for the verification email

## Troubleshooting

### If emails still don't send:

1. **Check SendGrid API Key**: Make sure the API key is correct and has "Mail Send" permissions
2. **Check Sender Email**: Ensure the sender email is verified in SendGrid
3. **Check Console Logs**: Look for any error messages in the server console
4. **Test SendGrid**: Try sending a test email directly from SendGrid dashboard

### Common Error Messages:

- `"SendGrid error: Unauthorized"` - Invalid API key
- `"SendGrid error: Forbidden"` - Sender email not verified
- `"SendGrid error: Bad Request"` - Invalid email format

## Alternative: Use a Different Email Service

If SendGrid doesn't work, you can replace it with:

- **Nodemailer with Gmail**: Use Gmail SMTP
- **Mailgun**: Another popular email service
- **AWS SES**: Amazon's email service

Let me know if you need help setting up any of these alternatives! 