"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = void 0;
exports.envConfig = {
    port: process.env.PORT || 8080,
    databaseURL: process.env.DATABASE_URL,
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    typeform: {
        personalAccessToken: process.env.TYPEFORM_PERSONAL_ACCESS_TOKEN,
        formId: process.env.TYPEFORM_FORM_ID,
        webhookSecret: process.env.TYPEFORM_WEBHOOK_SECRET,
        baseUrl: process.env.TYPEFORM_EU_DATA_CENTER === 'true' ? 'https://api.eu.typeform.com' : 'https://api.typeform.com',
    },
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        clientCertUrl: process.env.FIREBASE_CLIENT_CERT_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    }
};
//# sourceMappingURL=env.config.js.map