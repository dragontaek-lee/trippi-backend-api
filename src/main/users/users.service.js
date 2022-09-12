const admin = require('firebase-admin');
const db = admin.firestore();
const crypto = require('crypto');
const TrippiException = require('../../Exceptions/TrippiExecption');
const helper = require('../../common/helper');

exports.me = async (req, res) => {
    const user = await db
        .collection('users')
        .doc(req.uid)
        .get()

    if (!user.exists) throw new TrippiException(400, 'invalid-user');

    let userData = user.data();

    let regionList = [];
    const regions = await db
        .collection('regions')
        .where('owner', '==', req.uid)
        .get()

    if (!regions.empty) {
        for(let region of regions.docs){
            if(regionList.length == 10){
                break;
            }
            regionList.push(region.data().title)
        }
    }

    let userSet = {
        "_id": req.uid,
        "regionList": regionList,
        "name": userData.name,
        "profile": userData.profile,
        "joinDate": userData.joinDate,
        "email": userData.email
    }

    return res.send(userSet)

};
