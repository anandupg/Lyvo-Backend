# Admin Password Management Guide

## Issue: "Current password is incorrect" Error

If you're getting this error when trying to change your admin password, it means:
1. The password you're entering doesn't match what's in the database
2. Your admin account might not have a password set

---

## 🔍 Step 1: Check Admin Users

Run this command to see all admin users and their password status:

```bash
cd Lyvo-Backend/user-service
node check-admin-users.js
```

**Output will show:**
- Email addresses of all admins
- Whether each admin has a password set
- Account status (verified, active)

---

## 🔑 Step 2: Reset Admin Password

Once you know the admin email, reset the password:

```bash
node reset-admin-password.js <admin-email> <new-password>
```

**Example:**
```bash
node reset-admin-password.js admin@lyvo.com Admin@123456
```

**Password Requirements:**
- ✅ At least 8 characters
- ✅ Include uppercase letter (A-Z)
- ✅ Include lowercase letter (a-z)
- ✅ Include number (0-9)
- ✅ Include special character (!@#$%^&*...)

---

## 📋 Complete Example

### Check what admins exist:
```bash
$ node check-admin-users.js

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Searching for admin users...

✅ Found 1 admin user(s):

════════════════════════════════════════════════════════════════════════════════

1. Admin Details:
────────────────────────────────────────────────────────────────────────────────
   📧 Email:        admin@lyvo.com
   👤 Name:         Admin User
   🆔 ID:           507f1f77bcf86cd799439011
   🔑 Password Set: ❌ No (Need to set)
   ✓  Verified:     ✅ Yes
   🟢 Active:       ✅ Yes
   📅 Created:      10/20/2024

════════════════════════════════════════════════════════════════════════════════

💡 To reset an admin password, run:
   node reset-admin-password.js <admin-email> <new-password>
```

### Reset the password:
```bash
$ node reset-admin-password.js admin@lyvo.com Admin@123456

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Looking for admin with email: admin@lyvo.com
✅ Found admin: Admin User (admin@lyvo.com)
   Role: 2 (Admin)
   Current password set: No

🔐 Hashing new password...
💾 Updating password in database...
✅ Password updated successfully!

📋 Summary:
   Admin Email: admin@lyvo.com
   Admin Name: Admin User
   New Password: Admin@123456

✨ You can now login with the new password!
```

---

## ✅ Step 3: Test Password Change

1. **Go to Settings Page:** `/admin-settings`
2. **Fill in the form:**
   - Current Password: `Admin@123456` (the password you just set)
   - New Password: `NewAdmin@123`
   - Confirm Password: `NewAdmin@123`
3. **Click "Change Password"**
4. **Success!** ✅

---

## 🚨 Troubleshooting

### Error: "No user found with email"
- Check the email spelling
- Make sure the admin account exists in the database

### Error: "User is not an admin"
- The account exists but has role 1 (seeker) or 3 (owner), not 2 (admin)
- Only admin accounts (role: 2) can use these scripts

### Error: "Cannot connect to MongoDB"
- Make sure MongoDB is running
- Check your `.env` file has correct `MONGODB_URI`
- Run: `npm start` in user-service to verify connection

### Password still says "incorrect"
1. Restart the user service after resetting password
2. Make sure you're using the exact password you set
3. Try logging out and logging back in
4. Clear browser cache and cookies

---

## 🔒 Security Best Practices

1. **Strong Passwords:** Always use strong passwords with 8+ characters, mixed case, numbers, and symbols
2. **Don't Share:** Never share admin credentials
3. **Regular Changes:** Change passwords regularly
4. **Secure Storage:** Store passwords securely (use a password manager)

---

## 📝 Notes

- These scripts directly modify the database
- Always backup your database before running scripts
- Passwords are hashed using bcrypt with 10 rounds
- The scripts require the `.env` file to be properly configured

---

## 🆘 Still Having Issues?

If you continue to have problems:

1. Check backend logs for detailed errors
2. Verify MongoDB connection is working
3. Ensure user service is running on port 4002
4. Check that JWT token is valid
5. Try creating a new admin user from scratch

---

**Created:** October 2024  
**Last Updated:** October 2024

