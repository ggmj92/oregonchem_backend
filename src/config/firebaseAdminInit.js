const admin = require('firebase-admin');

let mainApp;
let analyticsApp;

// Use environment variables in production, JSON files in development
const getServiceAccount = () => {
    if (process.env.FIREBASE_PRIVATE_KEY) {
        // Production: use environment variables
        return {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };
    } else {
        // Development: use JSON file
        return require('./serviceAccountKey.json');
    }
};

const getAnalyticsServiceAccount = () => {
    if (process.env.FIREBASE_PRIVATE_KEY) {
        // For now, use the same credentials for analytics
        // You can add separate analytics credentials if needed
        return getServiceAccount();
    } else {
        return require('./analyticsServiceAccountKey.json');
    }
};

if (!admin.apps.length) {
    // Main app init
    mainApp = admin.initializeApp({
        credential: admin.credential.cert(getServiceAccount()),
    }, 'main');

    // Analytics app init
    analyticsApp = admin.initializeApp({
        credential: admin.credential.cert(getAnalyticsServiceAccount()),
    }, 'analytics');
} else {
    mainApp = admin.app('main');
    analyticsApp = admin.app('analytics');
}

module.exports = {
    admin,
    mainApp,
    analyticsApp,
};

