const dns = require('dns');
const net = require('net');
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const cluster = uri.split('@')[1].split('/')[0];

console.log('--------------------------------------------------');
console.log('💉 MONGODB DIAGNOSTIC TOOL');
console.log('--------------------------------------------------\n');

async function checkInternet() {
    return new Promise((resolve) => {
        dns.lookup('google.com', (err) => {
            if (err) {
                console.log('❌ INTERNET: No internet access.');
                resolve(false);
            } else {
                console.log('✅ INTERNET: Online.');
                resolve(true);
            }
        });
    });
}

async function checkDNS() {
    console.log(`🔍 DNS: Resolving SRV records for ${cluster}...`);
    return new Promise((resolve) => {
        dns.resolveSrv(`_mongodb._tcp.${cluster}`, (err, addresses) => {
            if (err) {
                console.log(`❌ DNS: Could not resolve SRV records: ${err.message}`);
                resolve(null);
            } else {
                console.log('✅ DNS: Resolved shards:');
                addresses.forEach(a => console.log(`   - ${a.name}:${a.port}`));
                resolve(addresses);
            }
        });
    });
}

async function testPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
}

async function run() {
    const internet = await checkInternet();
    if (!internet) return;

    const shards = await checkDNS();
    if (!shards) return;

    console.log('\n🚢 TCP CONNECTIVITY (Port 27017):');
    for (const s of shards) {
        const ok = await testPort(s.name, s.port);
        console.log(`   ${ok ? '✅' : '❌'} ${s.name} is ${ok ? 'Reachable' : 'BLOCKED'}`);
    }

    console.log('\n🍃 MONGOOSE CONNECTION:');
    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('   ✅ Successfully Connected to Database!');
        process.exit(0);
    } catch (err) {
        console.log('   ❌ Connection Failed:', err.message);
        console.log('\n💡 RECOMMENDATION:');
        console.log('   Your current network is blocking Port 27017.');
        console.log('   1. Use a Mobile Hotspot.');
        console.log('   2. Disable VPN / Firewall.');
        process.exit(1);
    }
}

run();
