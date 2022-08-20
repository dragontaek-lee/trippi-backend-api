const admin = require('firebase-admin');
const db = admin.firestore();
const crypto = require('crypto');
const TrippiException = require('../../Exceptions/TrippiExecption');
const helper = require('../../common/helper');
const { firestore } = require('firebase-admin');

function makeRegionSchema(uid, body, now) {
    const schema = {
        owner: uid,
        name: body.name,
        geoPoint: new firestore.GeoPoint(body.latitude, body.longitude),
        startDate: body.startDate,
        endDate: body.endDate,
        timestamp: now,
    };

    schema.name = schema.name.normalize();

    return schema;  
}

exports.regionList = async (req,res) => {
    const regionData = await db
        .collection('regions')
        .select('name','geopoint')
        .where('owner', '==', req.uid)
        .get()

    let regionList = [];
    for (let region of regionData.docs) {
        let regionId = region.id;
        region = region.data();

        let regionSet = {
            "_id": regionId,
            "name": region.name,
            "geoPoint": region.geopoint,
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
