const admin = require('firebase-admin');

const skipAuthPath = [
    '/auth', 
];

module.exports = async (req, res, next) => {
    req.uid = 'Unauthorized';

    let authToken = req.headers.authorization ?? req.body.firebaseToken ?? '';

    if(authToken.startsWith('Bearer ')) authToken = authToken.substring(7);
    try {
        let decode = await admin.auth().verifyIdToken(authToken);
        req.uid = decode.uid;
        return next();
    } catch (e) {
        if(skipAuthPath.findIndex(x => req.path.startsWith(x)) !== -1) return next();

        console.log(e.code, e.message);

        return res.status(403).send('Unauthorized');
    }
};
