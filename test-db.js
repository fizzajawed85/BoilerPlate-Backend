const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing connection to:', process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ Connection Successful!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection Failed:', err.message);
        if (err.message.includes('querySrv ECONNREFUSED')) {
            console.log('\n🔍 Tip: Yeh DNS ka masla hai. Aapka network MongoDB ke srv address ko resolve nahi kar paa raha.');
            console.log('Fix: MongoDB Atlas se "Standard Connection String" (Node.js 2.2.12 or later) copy karein.');
        }
        process.exit(1);
    });
