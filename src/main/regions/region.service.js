const admin = require('firebase-admin');
const db = admin.firestore();
const crypto = require('crypto');
const TrippiException = require('../../Exceptions/TrippiExecption');
const helper = require('../../common/helper');
const { firestore } = require('firebase-admin');

function makeRegionSchema(uid, body, now) {
    const schema = {
        owner: uid,
        geoPoint: new firestore.GeoPoint(body.latitude, body.longitude),
        timestamp: now,
    };

    return schema;  
}

exports.regionList = async (req,res) => {
    const regionData = await db
        .collection('regions')
        .select('geoPoint')
        .where('owner', '==', req.uid)
        .get()

    let regionList = [];
    for (let region of regionData.docs) {
        region = region.data();

        let regionSet = {
            "lat": region.geoPoint._latitude,
            "lng": region.geoPoint._longitude,
            "size": 15,
            "color": ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
        }
        regionList.push(regionSet)
    }

    return res.send(regionList);
}

exports.addRegion = async (req,res) => {
    await helper.isValidUser(req.uid);
    
    let publicId, docId;
    try {
        await db.runTransaction(async t => {

            const schema = makeRegionSchema(req.uid, req.body, req.now);

            while (true) {
                publicId = parseInt('0x' + crypto.randomBytes(3).toString('hex'), 16) + 1024;

                let chkDupe = await t.get(db.collection('regions').select('publicId')
                    .where('publicId', '==', publicId)
                    .limit(1));

                if (chkDupe.empty) break;
            }

            schema.publicId = publicId;

            const docRef = db.collection('regions').doc();

            await t.set(docRef, schema);
            docId = docRef.id;
        })
    } catch(e) {
        console.log(e)
        throw new TrippiException(400, 'transaction-failed');
    }

    const getRegion = await db.collection('regions').doc(docId).get();

    return res.send(getRegion.id);
}
