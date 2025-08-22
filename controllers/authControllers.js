const { getAuth, getFirestore } = require('../config/firebase');
const admin = require('firebase-admin');

const db = getFirestore();

// Store user data after frontend creates the user
const storeUserData = async (req, res) => {
  try {
    const { uid, email, name, phone } = req.body;
    
    // Input validation
    if (!uid || !email || !name) {
      return res.status(400).json({ error: "UID, email, and name are required" });
    }

    // Check if user already exists (for social auth)
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      // User exists, update only if needed
      await db.collection('users').doc(uid).set({
        email,
        name,
        ...(phone && { phone }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true }); // Use merge to preserve existing data
      
      return res.status(200).json({ message: "User data updated successfully" });
    } else {
      // New user, create fresh record
      await db.collection('users').doc(uid).set({
        email,
        name,
        ...(phone && { phone }),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.status(201).json({ message: "User data stored successfully" });
    }
  } catch (error) {
    console.error("Error storing user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ id: uid, ...userDoc.data() });
  } catch (error) {
    console.error("Error fetching  user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


const updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { email, password, name, phone } = req.body;

    await db.collection('users').doc(uid).update({
      email,
      name,
      ...(phone && { phone }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({ id: uid, email, name, phone });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    await userRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  storeUserData,
  getProfile,
  updateProfile,
  deleteProfile
};