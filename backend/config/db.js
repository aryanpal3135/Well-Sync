const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localFallbackUri = 'mongodb://127.0.0.1:27017/wellsync';

  try {
    console.log('🔄 Connecting to MongoDB (Attempting Primary URI)...');
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ [MongoDB Atlas] Connected successfully: ${conn.connection.host}`);
    console.log(`🗄️  [MongoDB Atlas] Using Database: ${conn.connection.name}`);
  } catch (error) {
    console.warn(`⚠️  Primary MongoDB Connection Failed: ${error.message}`);
    console.warn(`💡 Tip: To enable Atlas connection, please whitelist IP '0.0.0.0/0' in MongoDB Atlas Network Access.`);
    
    // Attempt local fallback
    try {
      console.log('🔄 Attempting connection to Local MongoDB (mongodb://127.0.0.1:27017/wellsync)...');
      const localConn = await mongoose.connect(localFallbackUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`✅ [Local MongoDB] Connected successfully to: ${localConn.connection.host}`);
      console.log(`🗄️  [Local MongoDB] Using Database: ${localConn.connection.name}`);
    } catch (localErr) {
      console.error(`❌ [MongoDB Error]: Both Atlas and Local MongoDB connection failed: ${localErr.message}`);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
