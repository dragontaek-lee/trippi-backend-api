const admin = require('firebase-admin');
const db = admin.firestore();
const TrippiException = require('../Exceptions/TrippiExecption');

/**
 * Is valid user
 */
exports.isValidUser = async (uid) => {
    let userData = await this.getSingleDoc(
        'users',
        ['state','level'],
        uid
    );

    if(userData == null || userData == false){
        throw new TrippiException(400,'invalid-user')
    }

    if(userData.state < 1) {
        throw new TrippiException(400,'invalid-user-state')
    }

    if(userData.level < 1) {
        throw new TrippiException(400,'invalid-user-level')
    }

    return true;
};

/**
 * get Single document
 */
exports.getSingleDoc = async (collectionId, selectField, documentId) => {
    let getDoc;
    try{
        getDoc = await db
            .collection(collectionId)
            .where(admin.firestore.FieldPath.documentId(),'==',documentId)
            .select(...selectField)
            .limit(1)
            .get()

    } catch(e) {
        getDoc = null;
        console.log('firebaseError', e);
    }

    if (getDoc == null) return false;

    if (!getDoc.empty && getDoc.docs[0].exists) return getDoc.docs[0].data();

    return null;
}