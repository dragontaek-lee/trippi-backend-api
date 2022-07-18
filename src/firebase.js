const admin = require('firebase-admin');

admin.initializeApp({
    storageBucket: `${process.env.PROJECT_ID}.appspot.com`,
    credential: admin.credential.applicationDefault(),
    projectId: process.env.PROJECT_ID
});

console.info('firebase initialize completed');
module.exports = admin;
