const mongoose = require('mongoose');
require('dotenv').config();

const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
    const properties = await Property.find({ documents: { $exists: true, $ne: [] } });
    
    console.log('Found properties with documents:', properties.length);
    
    for (const prop of properties) {
      if (prop.documents && prop.documents.length > 0) {
        console.log(`\nUpdating property: ${prop.property_name}`);
        
        const updatedDocuments = prop.documents.map(url => {
          // Keep the original URLs but add proper parameters for PDF access
          if (url.includes('/image/upload/') && url.endsWith('.pdf')) {
            // Add parameters to make PDF accessible
            const newUrl = url + '?f_pdf';
            console.log('Adding PDF parameters:');
            console.log('  From:', url);
            console.log('  To:  ', newUrl);
            return newUrl;
          }
          return url;
        });
        
        // Update the property with corrected URLs
        await Property.updateOne(
          { _id: prop._id },
          { $set: { documents: updatedDocuments } }
        );
        
        console.log('✅ Updated property documents');
      }
    }
    
    console.log('\n✅ All PDF URLs have been corrected');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectdb();
