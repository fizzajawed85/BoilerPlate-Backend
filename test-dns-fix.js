const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();

// Force Google DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

console.log('🔍 Testing connection with Forced Google DNS...');

dns.resolveSrv('_mongodb._tcp.cluster0.nhcgfb7.mongodb.net', (err, addr) => {
    if (err) {
        console.log('❌ SRV Resolution still failed:', err.message);
    } else {
        console.log('✅ SRV Resolved successfully with Google DNS!');
        console.log('Shards:', addr);
    }

    console.log('\n🚢 Attempting Mongoose connect...');
    mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
        .then(() => {
            console.log('🚀 SUCCESS! Backend is connected to MongoDB Atlas.');
            process.exit(0);
        })
        .catch(e => {
            console.log('❌ Mongoose still failed:', e.message);
            process.exit(1);
        });
});
