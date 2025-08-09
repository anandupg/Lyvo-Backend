# Email Verification Update for Existing Users

## Overview

This update enhances the user registration system to handle existing users who haven't verified their email addresses. Previously, if a user tried to register with an email that already existed, they would receive a simple "User already exists" error. Now, the system intelligently handles different scenarios:

## New Functionality

### 1. Existing Unverified Users
- **Scenario**: User tries to register with an email that exists but is not verified (`isVerified: false`)
- **Action**: System generates a new verification token and sends a fresh verification email
- **Response**: Success message with email sent confirmation
- **Status Code**: 200 (OK)

### 2. Existing Verified Users
- **Scenario**: User tries to register with an email that exists and is verified (`isVerified: true`)
- **Action**: System blocks registration and suggests login instead
- **Response**: Error message directing user to login
- **Status Code**: 400 (Bad Request)

### 3. New Users
- **Scenario**: User registers with a completely new email
- **Action**: System creates new user account and sends verification email
- **Response**: Success message with email sent confirmation
- **Status Code**: 201 (Created)

## Code Changes

### Modified Function: `registerUser` in `controller.js`

The registration logic now includes:

```javascript
// Check if user already exists
const existingUser = await User.findOne({ email });
if (existingUser) {
    // If user exists but is not verified, allow them to request verification again
    if (!existingUser.isVerified) {
        // Generate new verification token and send email
        // ... implementation details
    } else {
        // User exists and is already verified
        return res.status(400).json({ 
            message: 'User already exists and is verified. Please log in instead.',
            existingUser: true,
            isVerified: true
        });
    }
}
```

## API Response Examples

### For Existing Unverified User:
```json
{
    "message": "Verification email sent! Please check your email to verify your account.",
    "user": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "isVerified": false
    },
    "emailSent": true,
    "existingUser": true
}
```

### For Existing Verified User:
```json
{
    "message": "User already exists and is verified. Please log in instead.",
    "existingUser": true,
    "isVerified": true
}
```

### For New User:
```json
{
    "message": "Registration successful! Please check your email to verify your account.",
    "user": {
        "_id": "user_id",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "isVerified": false
    },
    "emailSent": true
}
```

## Testing

### Manual Testing
1. Start the user service: `npm run dev`
2. Use the test script: `node test-verification.js`
3. Or test manually with API calls:

```bash
# First registration
curl -X POST http://localhost:4002/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Second registration with same email (should send verification email)
curl -X POST http://localhost:4002/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Automated Testing
Run the provided test script:
```bash
cd Lyvo microservices/user-service
node test-verification.js
```

## Frontend Integration

The frontend should handle the new response format:

```javascript
// Handle registration response
if (response.data.existingUser && !response.data.isVerified) {
    // Show message about verification email sent
    showMessage('Verification email sent! Please check your inbox.');
} else if (response.data.existingUser && response.data.isVerified) {
    // Redirect to login page
    showMessage('Account already exists. Please log in instead.');
    redirectToLogin();
} else {
    // New user registration
    showMessage('Registration successful! Please check your email.');
}
```

## Security Considerations

1. **Token Expiration**: Verification tokens expire after 24 hours
2. **Rate Limiting**: Consider implementing rate limiting for registration attempts
3. **Email Validation**: Ensure email addresses are properly validated
4. **Token Security**: Verification tokens are cryptographically secure random strings

## Environment Variables

Ensure these environment variables are set in your `.env` file:

```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@lyvo.com
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
MONGODB_URI=your-mongodb-connection-string
```

## Troubleshooting

### Common Issues:

1. **Emails not sending**: Check SendGrid API key and sender email verification
2. **Database errors**: Ensure MongoDB connection is working
3. **Frontend not receiving responses**: Check API endpoint configuration
4. **Token expiration**: Users can request new verification emails by re-registering

### Debug Steps:

1. Check server logs for detailed error messages
2. Verify SendGrid configuration
3. Test database connectivity
4. Check frontend API calls in browser developer tools

## Future Enhancements

1. **Resend Verification Email**: Add a dedicated endpoint for resending verification emails
2. **Email Templates**: Make email templates configurable
3. **Rate Limiting**: Implement proper rate limiting for registration attempts
4. **Analytics**: Track verification success rates and user behavior 