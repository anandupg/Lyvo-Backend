# MongoDB Atlas Setup Guide for Lyvo

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Sign Up"
3. Create an account or sign in with Google/GitHub

## Step 2: Create a New Cluster

1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your users
5. Click "Create"

## Step 3: Set Up Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Set Up Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add your specific IP addresses
5. Click "Confirm"

## Step 5: Get Your Connection String

1. Go back to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<database>` with your database name (e.g., "lyvo")

## Step 6: Update Your Environment Variables

1. Copy `env.example` to `.env` in the user-service directory
2. Replace the placeholder values:

```env
MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/lyvo?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
GOOGLE_CLIENT_ID=your-google-client-id-here
FRONTEND_URL=http://localhost:5173
PORT=4002
NODE_ENV=development
```

## Step 7: Test the Connection

1. Start your user service: `npm run dev`
2. Check the console for "MongoDB connected" message
3. If successful, your Atlas setup is complete!

## Troubleshooting

### Common Issues:

1. **Connection Timeout**: Check your network access settings
2. **Authentication Failed**: Verify username/password in connection string
3. **Database Not Found**: The database will be created automatically when you first save data

### Security Best Practices:

1. Use strong passwords for database users
2. Restrict network access to specific IPs in production
3. Use environment variables for sensitive data
4. Enable MongoDB Atlas security features like encryption at rest

## Next Steps

After setting up MongoDB Atlas, proceed to the Google OAuth setup guide to complete the authentication system. 