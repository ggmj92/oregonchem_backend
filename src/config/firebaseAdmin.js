const admin = require('firebase-admin');

// Check if using environment variables for Firebase credentials
let serviceAccount;

if (process.env.FIREBASE_TYPE) {
    // Use environment variables to create the service account object
    serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };
} else {
    // Fallback to using the serviceAccountKey.json file if environment variables are not set
    serviceAccount = require('../utils/serviceAccountKey.json');
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
    });
}

const bucket = admin.storage().bucket();
const auth = admin.auth();

module.exports = { admin, bucket, auth };
