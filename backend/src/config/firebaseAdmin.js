const admin = require('firebase-admin');

let firebaseApp = null;

function getFirebaseAdmin() {
  if (!firebaseApp) {
    if (admin.apps.length === 0) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('[FirebaseAdmin] Initialized Firebase Admin SDK successfully.');
    } else {
      firebaseApp = admin.apps[0];
    }
  }
  return admin;
}

const db = () => getFirebaseAdmin().firestore();
const auth = () => getFirebaseAdmin().auth();

module.exports = {
  getFirebaseAdmin,
  db,
  auth
};
