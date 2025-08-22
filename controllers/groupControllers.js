const {getFirestore} = require("../config/firebase");
const admin = require("firebase-admin");
const crypto = require('crypto');
require('dotenv').config();
const db = getFirestore();

// Helper function to generate unique invite code
const generateInviteCode = () => {
    return crypto.randomBytes(8).toString('hex'); // 16 character random string
};

const getGroups = async(req, res) => {
    try{
        const snapShot = await db.collection("groups").where("members", "array-contains", req.user.uid).get();
        const groups = snapShot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(groups);
    }
    catch(error){
        console.error("Error fetching groups:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}

const getOneGroup = async(req,res) =>{
    try{
        const groupRef = db.collection("groups").doc(req.params.id);
        const doc = await groupRef.get();

        if(!doc.exists){
            return res.status(404).json({ error: "Group not found" });
        }
        res.status(200).json({id:doc.id,...doc.data()});
    }
    catch(error){
        console.error("Error fetching group:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const addGroup = async (req, res) => {
    try {
        const newGroup = {
            name: req.body.name,
            createdBy: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            members: [req.user.uid], // Array of member UIDs
            inviteCode: generateInviteCode(), // Generate unique invite code
            scheduledDate: req.body.scheduledDate || null,
            scheduledTime: req.body.scheduledTime || null
        };

        const docRef = await db.collection("groups").add(newGroup);
        
        res.status(201).json({ 
            id: docRef.id,
            message: "Group created successfully",
            group: newGroup
        });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const groupRef = db.collection("groups").doc(id);
        const doc = await groupRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = doc.data();
        
        // Check if user is a member
        if (!groupData.members.includes(req.user.uid)) {
            return res.status(403).json({ error: "You are not a member of this group" });
        }

        await groupRef.update({
            name: name,
            scheduledDate: req.body.scheduledDate || null,
            scheduledTime: req.body.scheduledTime || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: "Group updated successfully" });
    } catch (error) {
        console.error("Error updating group:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const groupRef = db.collection("groups").doc(id);
        const doc = await groupRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = doc.data();
        
        // Only creator can delete
        if (groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: "Only the group creator can delete this group" });
        }

        await groupRef.delete();
        res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        console.error("Error deleting group:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const addMemberToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { userId } = req.body;

        const groupRef = db.collection("groups").doc(groupId);
        const doc = await groupRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = doc.data();
        
        // Check if requester is the creator
        if (groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: "Only the group creator can add members" });
        }

        // Check if user is already a member
        if (groupData.members.includes(userId)) {
            return res.status(400).json({ error: "User is already a member" });
        }

        // Add user to members array (no limit for groups)
        await groupRef.update({
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

const removeMemberFromGroup = async (req, res) => {
    try {
        const { groupId, memberId } = req.params;

        const groupRef = db.collection("groups").doc(groupId);
        const doc = await groupRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = doc.data();
        
        // Check if requester is the creator or removing themselves
        if (groupData.createdBy !== req.user.uid && memberId !== req.user.uid) {
            return res.status(403).json({ error: "Only the group creator can remove members, or members can remove themselves" });
        }

        // Cannot remove the creator
        if (memberId === groupData.createdBy) {
            return res.status(400).json({ error: "Cannot remove the group creator" });
        }

        // Remove user from members array
        await groupRef.update({
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

const generateInviteLink = async (req, res) => {
    try {
        const { groupId } = req.params;
        const groupRef = db.collection("groups").doc(groupId);
        const doc = await groupRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupData = doc.data();
        
        // Check if user is the creator
        if (groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: "Only the group creator can generate invite links" });
        }

        // Generate new invite code
        const newInviteCode = generateInviteCode();
        
        await groupRef.update({
            inviteCode: newInviteCode,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/joingroup/${newInviteCode}`;
        
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

const joinGroupByInvite = async (req, res) => {
    try {
        const { inviteCode } = req.params;
        
        // Find group by invite code
        const snapshot = await db.collection("groups")
            .where("inviteCode", "==", inviteCode)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: "Invalid invite code" });
        }

        const groupDoc = snapshot.docs[0];
        const groupData = groupDoc.data();

        // Check if user is already a member
        if (groupData.members.includes(req.user.uid)) {
            return res.status(400).json({ error: "You are already a member of this group" });
        }

        // Add user to members (no limit for groups)
        await groupDoc.ref.update({
            members: admin.firestore.FieldValue.arrayUnion(req.user.uid),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ 
            message: "Successfully joined the group",
            groupId: groupDoc.id,
            groupName: groupData.name
        });
    } catch (error) {
        console.error("Error joining group:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getGroups,
    addGroup,
    getOneGroup,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    generateInviteLink,
    joinGroupByInvite
};
