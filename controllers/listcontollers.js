require('dotenv').config();
const {getFirestore} = require("../config/firebase");
const admin = require("firebase-admin");
const crypto = require('crypto');

const db = getFirestore();

// Helper function to generate unique invite code
const generateInviteCode = () => {
    return crypto.randomBytes(8).toString('hex'); // 16 character random string
};



const getLists = async(req, res) => {
    try{
        // For array structure: use array-contains
        const snapShot = await db.collection("lists").where("members", "array-contains", req.user.uid).get();
        const lists = snapShot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(lists);
    }
    catch(error){
        console.error("Error fetching lists:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}

const getOneList = async(req,res) =>{
    try{
        const listRef = db.collection("lists").doc(req.params.id);
        const doc = await listRef.get();

        if(!doc.exists){
            return res.status(404).json({ error: "List not found" });
        }
        res.status(200).json({id:doc.id,...doc.data()});
    }
    catch(error){
        console.error("Error fetching list:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}


const addList = async (req, res) => {
    try {
        const newList = {
            name: req.body.name,
            createdBy: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            members: [req.user.uid], // Array of member UIDs only
            inviteCode: generateInviteCode() // Generate unique invite code
        }
        const docRef = await db.collection("lists").add(newList);
        res.status(201).json({ id: docRef.id, ...newList });
    } catch (error) {
        console.error("Error adding list:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateList = async(req,res) => {
    try{
        const { id } = req.params;
        const name = req.body.name;

        const listRef = db.collection("lists").doc(id);
        await listRef.update({
            name,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: "List updated successfully" });
    } catch (error) {
        console.error("Error updating list:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const deleteList = async(req,res) => {
    try{
        const { id } = req.params;

        const ref = db.collection("lists").doc(id);
        await ref.delete();

        res.status(200).json({ message: "List deleted successfully" });
    } catch (error) {
        console.error("Error deleting list:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const addMemberToList = async (req, res) => {
    try {
        const { listId } = req.params;
        const { userId } = req.body;
        
        // Get the list document
        const listRef = db.collection("lists").doc(listId);
        const listDoc = await listRef.get();
        
        if (!listDoc.exists) {
            return res.status(404).json({ error: "List not found" });
        }
        
        const listData = listDoc.data();
        
        // Check if current user is admin (creator) of the list
        if (listData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: "Only the list creator can add members" });
        }
        
        // Check if user is already a member
        if (listData.members.includes(userId)) {
            return res.status(400).json({ error: "User is already a member" });
        }
        
        // Check if list already has 2 members (limit for lists)
        if (listData.members.length >= 2) {
            return res.status(400).json({ error: "List is full. Maximum 2 members allowed." });
        }
        
        // Add user to members array
        await listRef.update({
            members: admin.firestore.FieldValue.arrayUnion(userId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        res.status(200).json({ 
            message: "Member added successfully",
            newMember: { userId }
        });
    } catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Generate new invite link (only admin/creator can do this)
const generateInviteLink = async (req, res) => {
    try {
        const { listId } = req.params;
        const listRef = db.collection("lists").doc(listId);
        const doc = await listRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "List not found" });
        }

        const listData = doc.data();
        
        // Check if user is the creator (admin)
        if (listData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: "Only the list creator can generate invite links" });
        }

        // Generate new invite code
        const newInviteCode = generateInviteCode();
        
        await listRef.update({
            inviteCode: newInviteCode,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(process.env.FRONTEND_URL)
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${newInviteCode}`;
        
        res.status(200).json({ 
            inviteCode: newInviteCode,
            inviteLink: inviteLink,
            message: "New invite link generated successfully"
        });
    } catch (error) {
        console.error("Error generating invite link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Join list using invite code
const joinListByInvite = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        
        // Find list by invite code
        const snapshot = await db.collection("lists")
            .where("inviteCode", "==", inviteCode)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: "Invalid invite code" });
        }

        const listDoc = snapshot.docs[0];
        const listData = listDoc.data();

        // Check if user is already a member
        if (listData.members.includes(req.user.uid)) {
            return res.status(400).json({ error: "You are already a member of this list" });
        }

        // Check if list is full (2 members max)
        if (listData.members.length >= 2) {
            return res.status(400).json({ error: "Cannot join. List is full." });
        }

        // Add user to members
        await listDoc.ref.update({
            members: admin.firestore.FieldValue.arrayUnion(req.user.uid),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ 
            message: "Successfully joined the list",
            listId: listDoc.id,
            listName: listData.name
        });
    } catch (error) {
        console.error("Error joining list:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Remove member from list
const removeMemberFromList = async (req, res) => {
    try {
        const { listId, memberId } = req.params;

        const listRef = db.collection("lists").doc(listId);
        const doc = await listRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "List not found" });
        }

        const listData = doc.data();
        
        // Check if requester is the creator or removing themselves
        if (listData.createdBy !== req.user.uid && memberId !== req.user.uid) {
            return res.status(403).json({ error: "Only the list creator can remove members, or members can remove themselves" });
        }

        // Cannot remove the creator
        if (memberId === listData.createdBy) {
            return res.status(400).json({ error: "Cannot remove the list creator" });
        }

        // Remove user from members array
        await listRef.update({
            members: admin.firestore.FieldValue.arrayRemove(memberId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ 
            message: "Member removed successfully"
        });
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getLists,
    addList,
    getOneList,
    updateList,
    deleteList,
    addMemberToList,
    removeMemberFromList,
    generateInviteLink,
    joinListByInvite
};
