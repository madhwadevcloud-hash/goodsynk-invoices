const mongoose = require('mongoose');
const dns = require('dns');

// Apply the right DNS strategy based on which URI is configured:
//  - Atlas (mongodb+srv://): needs Google DNS (8.8.8.8) to resolve SRV records.
//  - Local  (localhost):     needs ipv4first so 'localhost' resolves to 127.0.0.1
//                            instead of ::1 (IPv6), which MongoDB doesn't listen on.
const uri = process.env.MONGO_URI || '';
if (uri.startsWith('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} else {
  dns.setDefaultResultOrder('ipv4first');
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri, {
      ...(uri.startsWith('mongodb+srv://') ? {} : { family: 4 }),
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`.red.bold);
    process.exit(1);
  }
};

module.exports = connectDB;
