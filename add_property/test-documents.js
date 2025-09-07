const mongoose = require('mongoose');
require('dotenv').config();

const connectdb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
    
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
    const properties = await Property.find({ documents: { $exists: true, $ne: [] } }).limit(2);
    
    console.log('Properties with documents:', properties.length);
    properties.forEach((prop, index) => {
      console.log(`Property ${index + 1}:`);
      console.log('- Name:', prop.property_name);
      console.log('- Documents:', prop.documents ? prop.documents.length : 0, 'documents');
      if (prop.documents && prop.documents.length > 0) {
        console.log('- Document URLs:');
        prop.documents.forEach((url, i) => {
          console.log(`  ${i + 1}:`, url);
        });
      }
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectdb();
