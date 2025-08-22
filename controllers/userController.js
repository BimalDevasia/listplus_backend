const {getFirestore} = require("../config/firebase");
const admin = require('firebase-admin');
const db = getFirestore();


const getUserByBatch = async (req,res)=>{
    try{
        const {ids} = req.body;
        const userSnapShot = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", ids).get();
        const users = userSnapShot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(users);
    }
    catch(error){
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = {
    getUserByBatch
};
