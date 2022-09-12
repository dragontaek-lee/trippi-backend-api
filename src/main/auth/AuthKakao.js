const axios = require('axios');
const admin = require('firebase-admin');
const db = admin.firestore();
const validator = require('./AuthValidator');
const TrippiException = require('../../Exceptions/TrippiExecption');

axios.interceptors.response.use(
    (response) => {
        delete response.config;
        delete response.request;
        delete response.headers;
        return response;
    },
    (error) => {
        delete error.response.config;
        delete error.response.request;
        delete error.response.headers;
        return Promise.reject(error);
    }
);

async function getKakaoProfile(accessToken){
    let profile = null;

    try {
        profile = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {Authorization: `Bearer ${accessToken}`}
        });   
    } catch(e) {
        console.log(e)
        throw new TrippiException(400, 'kakao-server-error')
    }

    if (!profile.data.id) throw new TrippiException(400, 'invalid-kakao-user')

    return profile.data;
}

async function chkExist(id){
    const userExist = await db
        .collection('users')
        .where('thirdPartyUID', '==', `kakao_${id}`)
        .where('state', '!=', 0)
        .get();

    if (!userExist.empty) {
        const uid = userExist.docs[0].id;
        return uid;
    }
    return false;
}

function makeAuthParams(kakaoProfile) {
    let kakaoAccount = kakaoProfile.kakao_account;

    let params = {};

    params.displayName = kakaoProfile.properties.nickname || '';
    params.displayName = params.displayName.normalize();

    if (kakaoAccount.profile.profile_image_url)
        params.photoURL = kakaoAccount.profile.profile_image_url;

    return params;
}

function makeUserSchema(kakaoprofile, now) {
    let kakaoAccount = kakaoprofile.kakao_account;

    let schema = {
        name: kakaoAccount.profile.nickname || '',
        phone: kakaoAccount.phone_number || '',
        email: kakaoAccount.email || '',
        profile: kakaoAccount.profile.profile_image_url || '',
        birthyear: kakaoAccount.birthyear || '',

        joinDate: now,
        editDate: now,
 
        state: 1,
        thirdPartyUID: `kakao_${kakaoprofile.id}`,
        authFrom: 'KAKAO',
    };

    // normalize string
    schema.name = schema.name.normalize();
    schema.email = schema.email.normalize();

    if (schema.name === '') schema.name = schema.email;

    return schema;
}

async function createUser(params,schema){
    let uid;
    while (true) {
        let latestUID = await db
            .collection('users')
            .where('level','==',1)
            .orderBy(admin.firestore.FieldPath.documentId(), 'desc')
            .limit(1)
            .get();

        let splitUID = latestUID.docs[0].id.split('_');
        let newNum = parseInt(splitUID[1]) + 1;
        newNum = String(newNum).padStart(8,'0');

        uid = `trippi_${newNum}`;
        try {
            await db.collection('users').doc(uid).create(schema);
            console.log(`Document created`);
            break;
        } catch (e) {
            console.log(`Failed to create document: ${e}`);
            continue;
        }
    }

    try {
        await admin.auth().createUser(params);
    } catch (e) {
        console.error(`errorCreateUser ==> ${JSON.stringify(e)}`);
        throw 'create-user-failed';
    }

    return uid;
}


async function updateUser(uid, params) {
    console.log(`updateUser ==> uid=${uid}, params=${JSON.stringify(params)}`);

    try {
        await admin.auth().updateUser(uid, params);
        return true;
    } catch (e) {
        console.error(`errorUpdateUser ==> ${JSON.stringify(e)}`);
        if (e.code !== 'auth/user-not-found') throw 'no-user-exist';
    }

    return false;
}

exports.authKakao = async (req, res) => {
    let filtered = req.body

    let kakaoProfile, uid, params;
    try {
        kakaoProfile = await getKakaoProfile(filtered.accessToken);

        params = makeAuthParams(kakaoProfile);

        uid = await chkExist(kakaoProfile.id);

        if (!uid) {
            const schema = makeUserSchema(kakaoProfile, req.now);
            uid = await createUser(params,schema);

            console.log(`[${uid}|${req.now}] ${req.path} ==> user create`);
        } else {
            await updateUser(uid, params);
            console.log(`[${uid}|${req.now}] ${req.path} ==> user update`);
        }

    } catch (e) {
        console.log(e);
        return res.status(400).send(e);
    }

    try {
        let get_user = await db.collection('users').doc(uid).get();
        if (!get_user.exists) {
            console.log('re-create user document');
            await get_user.ref.set(makeUserSchema(kakaoProfile, req.now));
            get_user = get_user.ref.get();
        }

        let firebaseToken = await admin
            .auth()
            .createCustomToken(uid, {provider: 'KAKAO'});

        return res.send(firebaseToken);
    } catch (e) {
        console.error(e);
        throw new TrippiException(400, 'login-failed')
    }
};