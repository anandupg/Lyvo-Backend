# Cloudinary Setup for Lyvo

This guide will help you set up Cloudinary for profile picture uploads in the Lyvo application.

## What You Need from Cloudinary

To complete the setup, you'll need the following from your Cloudinary account:

1. **Cloud Name** - Your unique cloud identifier
2. **API Key** - For server-side uploads
3. **API Secret** - For server-side uploads

## How to Get These Credentials

1. **Sign up/Login to Cloudinary**: Go to [cloudinary.com](https://cloudinary.com) and create an account or login
2. **Access Dashboard**: Once logged in, go to your Dashboard
3. **Find Credentials**: In the Dashboard, you'll see:
   - **Cloud Name** (e.g., `my-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## Environment Variables

Add these variables to your `.env` file in the `user-service` directory:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

## Features Implemented

1. **Google OAuth Profile Pictures**: When users sign in with Google, their Google profile picture is automatically stored
2. **Manual Upload**: Users can upload their own profile pictures through the Profile page
3. **Image Optimization**: Images are automatically:
   - Resized to 400x400 pixels
   - Optimized for web delivery
   - Stored in a dedicated folder (`lyvo-profile-pictures`)
4. **File Validation**: Only image files under 5MB are accepted

## Security Features

- File type validation (images only)
- File size limits (5MB max)
- Secure uploads with authentication
- Automatic image optimization and compression

## Usage

1. **Google OAuth**: Profile pictures are automatically imported when users sign in with Google
2. **Manual Upload**: Users can click on their profile picture in the Profile page to upload a new image
3. **Preview**: Users can preview their image before uploading
4. **Automatic Updates**: Profile pictures are immediately updated across the application

## Troubleshooting

If you encounter issues:

1. **Check Environment Variables**: Ensure all Cloudinary credentials are correctly set
2. **Verify Cloudinary Account**: Make sure your Cloudinary account is active
3. **Check File Size**: Ensure uploaded images are under 5MB
4. **File Format**: Only JPG, PNG, GIF, and other image formats are supported

## Support

For Cloudinary-specific issues, refer to the [Cloudinary Documentation](https://cloudinary.com/documentation).
