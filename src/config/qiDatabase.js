const mongoose = require('mongoose');

// Create a separate connection for the QI database
const qiConnection = mongoose.createConnection(process.env.MONGODB_URI_QI || 'mongodb://localhost:27017/qi');

qiConnection.on('connected', () => {
    console.log('✅ Connected to QI MongoDB Database (localhost)');
});

qiConnection.on('error', (err) => {
    console.error('❌ QI MongoDB connection error:', err);
});

qiConnection.on('disconnected', () => {
    console.log('⚠️  Disconnected from QI MongoDB Database');
});

module.exports = qiConnection;
