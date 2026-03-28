const mongoose = require('mongoose');

// Use MONGODB_URI_PROD in production, MONGODB_URI_QI or localhost in development
const mongoUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI_QI || 'mongodb://localhost:27017/qi';

// Serverless-friendly connection with connection pooling
const options = {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
};

// Create a separate connection for the QI database
const qiConnection = mongoose.createConnection(mongoUri, options);

qiConnection.on('connected', () => {
    console.log('✅ Connected to QI MongoDB Database');
});

qiConnection.on('error', (err) => {
    console.error('❌ QI MongoDB connection error:', err);
});

qiConnection.on('disconnected', () => {
    console.error('⚠️  Disconnected from QI MongoDB Database — exiting for clean restart');
    process.exit(1);
});

module.exports = qiConnection;
