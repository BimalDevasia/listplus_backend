const admin = require('firebase-admin');

const serviceAccount = require('./listplus.json')

const initializeFirebase =()=>{
    try{
        admin.initializeApp({
        credential:admin.credential.cert(serviceAccount)
        })
        console.log("Firebase initialized successfully");
       
    }catch(error){
        console.error("Firebase initialization error:", error);
    }
}
const getAdmin = () => {
    return admin;
}

const getFirestore = () => {
    return admin.firestore();
}

const getAuth = () => {
    return admin.auth();
}

module.exports = { getFirestore, getAuth, initializeFirebase, getAdmin };