const admin = require('firebase-admin');
const db = admin.firestore();
const axios = require('axios')
const crypto = require('crypto');
const TrippiException = require('../../Exceptions/TrippiExecption');
const helper = require('../../common/helper');
const { firestore } = require('firebase-admin');
const { number } = require('joi');

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

function isInteger(str) {
    if (typeof str !== 'string') {
      return false;
    }
  
    const num = Number(str);
  
    if (Number.isInteger(num)) {
      return true;
    }
  
    return false;
  }

async function makeRegionSchema(uid, body, now) {
    
    const schema = {
        title: await getRegionName(body.latitude, body.longitude),
        owner: uid,
        geoPoint: new firestore.GeoPoint(body.latitude, body.longitude),
        timestamp: now,
    };

    return schema;  
}

async function getRegionName(lat,lng) {
    lat = Number(lat)
    lng = Number(lng)
    let res;
    try {
        res = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_API_KEY}`,
        ) 
        
    } catch(e) {
        console.log(e)
    }

    let result = res.data.results[1] || null;

    if (result === null) {
        result = 'ocean';
    } else {
        const regionFullName = result.formatted_address.split(',');
        let firstAddr = regionFullName[regionFullName.length-2];
        let secondAddr = regionFullName[regionFullName.length-1]
        
        let isEmpty = true;
        if (isInteger(firstAddr)) {
            firstAddr = " ";
            isEmpty = false;
        }
        if (isInteger(secondAddr)) {
            secondAddr = " ";
            isEmpty = false;
        }
        
        let regionName;
        if(isEmpty) {
            regionName = firstAddr + ',' + secondAddr;
        } else {
            regionName = firstAddr + secondAddr;
        }

        regionName = regionName.replace(" ","")
        result = regionName;
    }

    return result;
}

exports.regionList = async (req,res) => {
    const regionData = await db
        .collection('regions')
        .select('geoPoint','publicId','title')
        .where('owner', '==', req.uid)
        .get()

    let regionList = [];
    for (let region of regionData.docs) {
        let regionData = region.data();

        let regionSet = {
            "_id": regionData.publicId,
            "title":regionData.title,
            "lat": regionData.geoPoint._latitude,
            "lng": regionData.geoPoint._longitude,
            "size": 15
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

            const schema = await makeRegionSchema(req.uid, req.body, req.now);

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

exports.regionImgList = async (req,res) => {
    const regionImgData = await db
        .collection('uploads')
        .where('regionId','==',req.query.publicId)
        .where('owner', '==', req.uid)
        .get()

    let imgList = [];
    for (let regionImg of regionImgData.docs) {
        let data = regionImg.data();
        imgList.push(data.url)
    }

    return res.send(imgList);
}