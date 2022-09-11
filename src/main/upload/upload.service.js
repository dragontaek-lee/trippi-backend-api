const admin = require('firebase-admin');
const db = admin.firestore();
const axios = require('axios')
const crypto = require('crypto');
const TrippiException = require('../../Exceptions/TrippiExecption');
const helper = require('../../common/helper');
const { firestore } = require('firebase-admin');
const validator = require('./UploadValidator');

const path = require('path');
const os = require('os');
const fs = require('fs');

const sharp = require('sharp');
const { filter } = require('domutils');

const PROJECT_ID = 'proj-trippi'
const bucket = admin.storage().bucket(PROJECT_ID);

async function createImg(filename){
    const TMP_DIR = os.tmpdir();

    let tmpFile = path.join(TMP_DIR, filename);

    let fileInfo = await sharp(tmpFile).metadata();

    if (fileInfo.format !== 'jpeg' && fileInfo.format !== 'png')
        throw 'invalid file';
    filename = filename + '.jpg';

    let filePathList = {
        thumb: path.join(TMP_DIR, 'thumb@' + filename),
        large: path.join(TMP_DIR, filename),
    };

    let taskList = [];
    let sharpObj = sharp(tmpFile)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({
            quality: 90,
            force: true,
        })
        .rotate();

    taskList.push(sharpObj.resize({ width: 800, height: 600 }).toFile(filePathList.large));
    taskList.push(sharpObj.resize({ width: 64 }).toFile(filePathList.thumb));

    await Promise.all(taskList);
    fs.unlinkSync(tmpFile);

    return filePathList;
}

exports.insert = async (req,res) => {
    if (req.files === undefined) return new TrippiException(400, 'invalid-file')
   
    let publicId = JSON.parse(JSON.stringify(req.body));
    let vali = validator.insert.validate(publicId);
    if (vali.error !== undefined) return new TrippiException(400, 'validation-erro')
    let filtered = vali.value;

    publicId = Number(filtered.publicId)
    const region = await db
        .collection('regions')
        .select('owner')
        .where('publicId','==',publicId)
        .get()

    const owner = region.docs[0].data().owner;

    if(owner !== req.uid) return new TrippiException(400, 'not-a-owner');

    for (let file of req.files) {
       
        let filename = file.path.substring(
            file.path.lastIndexOf('/') + 1,
            file.path.length
        )

        let fileList = await createImg(filename);

        let gcsOpt = {
            metadata: {
                metadata: { owner: req.uid },
                cacheControl: 'public, max-age=31536000'
            }
        };
    
        try {
            await Promise.all([
                bucket.upload(fileList.thumb, gcsOpt),
                bucket.upload(fileList.large, gcsOpt),
            ]);
        } catch (e) {
            console.error(e);
            return res.status(400).send(e);
        }
    
        fs.unlinkSync(fileList.large);
        fs.unlinkSync(fileList.thumb);
    
        let coverFileName = fileList.large.substring(
            fileList.large.lastIndexOf('/') + 1,
            fileList.large.length
        );
    
        await db.collection('uploads').add({
            owner: req.uid,
            regionId: publicId,
            url: coverFileName,
            timestamp: req.now,
            title: filtered.title
        })
    }

    return res.send('ok')
}

exports.delete = async (req, res) => {
    let vali = validator.delete.validate(req.body);
    if (vali.error !== undefined) return new TrippiException(400, vali.error);
    let filtered = vali.value;

    let getDoc = await db.collection('uploads').doc(filtered.id).get();

    if (!getDoc.exists) return new TrippiException(400, 'invalid-document'); 

    let docData = getDoc.data();

    if(docData.owner !== req.uid) return new TrippiException(400, 'not-a-owner');

    try {
        await Promise.all([
            bucket.file(filtered.filename).delete(),
            bucket.file('thumb@' + filtered.filename).delete(),
        ]);
    } catch (e) {
        console.log('delete-cover-fail: ' + filtered.filename);
    }

    let deleteDocId = await getDoc.ref.delete();

    return res.send(deleteDocId);
};