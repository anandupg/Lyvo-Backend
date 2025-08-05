# Lyvo Backend Services

This directory contains the backend microservices for the Lyvo application.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- Google Cloud Console account

### 1. Run Setup Script
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Manual Setup (if script fails)

#### Install Dependencies
```bash
cd user-service
npm install
```

#### Create Environment Files
```bash
# Backend
cp env.example .env

# Frontend (from Lyvo frontend directory)
cp env.example .env
```

## 📋 Configuration

### Backend Environment Variables (.env)
```env
# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# App Configuration
FRONTEND_URL=http://localhost:5173
PORT=4002
NODE_ENV=development
```

### Frontend Environment Variables (.env)
```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# API
VITE_API_URL=http://localhost:4002/api

# App
VITE_APP_NAME=Lyvo
VITE_APP_VERSION=1.0.0
```

## 🗄️ MongoDB Atlas Setup

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Create Cluster**: Choose FREE tier (M0)
3. **Database Access**: Create user with read/write permissions
4. **Network Access**: Allow access from anywhere (0.0.0.0/0) for development
5. **Get Connection String**: Copy from "Connect" button

See [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md) for detailed instructions.

## 🔐 Google OAuth Setup

1. **Google Cloud Console**: Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create Project**: New project or select existing
3. **Enable APIs**: Google+ API and Google Identity API
4. **OAuth Consent**: Configure consent screen
5. **Credentials**: Create OAuth 2.0 Client ID
6. **Authorized Origins**: Add `http://localhost:5173`
7. **Authorized Redirects**: Add `http://localhost:5173`

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed instructions.

## 🏃‍♂️ Running the Services

### Backend (User Service)
```bash
cd user-service
npm run dev
```

### Frontend
```bash
cd "Lyvo frontend"
npm run dev
```

## 📡 API Endpoints

### Authentication
- `POST /api/user/register` - Register new user
- `POST /api/user/login` - Login user
- `POST /api/user/google-signin` - Google OAuth sign-in
- `POST /api/user/forgot-password` - Send password reset email
- `POST /api/user/reset-password` - Reset password
- `GET /api/user/verify-email/:token` - Verify email address

### User Management
- `GET /api/user/profile/:userId` - Get user profile
- `PUT /api/user/profile/:userId` - Update user profile
- `POST /api/user/change-password` - Change password

## 🔧 Development

### Project Structure
```
user-service/
├── src/
│   ├── index.js          # Server entry point
│   ├── controller.js     # Request handlers
│   ├── model.js          # User model
│   ├── routes.js         # API routes
│   └── middleware.js     # Custom middleware
├── package.json
└── .env                  # Environment variables
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MONGO_URI in .env
   - Verify network access in Atlas
   - Ensure username/password are correct

2. **Google OAuth Not Working**
   - Verify GOOGLE_CLIENT_ID in both frontend and backend
   - Check authorized origins in Google Cloud Console
   - Ensure HTTPS in production

3. **Email Not Sending**
   - Check SENDGRID_API_KEY and SENDGRID_FROM_EMAIL
   - Verify sender email is verified in SendGrid
   - Check SendGrid dashboard for errors

### Debug Mode
Set `NODE_ENV=development` in your .env file for detailed error messages.

## 🔒 Security

- Use strong JWT secrets
- Enable HTTPS in production
- Validate all inputs
- Use environment variables for secrets
- Implement rate limiting
- Enable CORS properly

## 📚 Documentation

- [MongoDB Atlas Setup](./MONGODB_ATLAS_SETUP.md)
- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md)
- [API Documentation](./API.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 