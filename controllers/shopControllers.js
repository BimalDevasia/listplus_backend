const {getFirestore} = require("../config/firebase");
const admin = require("firebase-admin");

const db = getFirestore();

const getShops = async(req, res) => {
    try{
        const snapShot = await db.collection("shops").where("createdBy", "==", req.user.uid).get();
        const shops = snapShot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(shops);
    }
    catch(error){
        console.error("Error fetching shops:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
}

const getOneShop = async(req,res) =>{
    try{
        const shopRef = db.collection("shops").doc(req.params.id);
        const doc = await shopRef.get();

        if(!doc.exists){
            return res.status(404).json({ error: "Shop not found" });
        }
        res.status(200).json({id:doc.id,...doc.data()});
    }
    catch(error){
        console.error("Error fetching shop:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const addShop = async (req, res) => {
    try {
        const { name, type, place, distance } = req.body;

        // Validation
        if (!name || !type || !place) {
            return res.status(400).json({ error: "Name, type, and place are required" });
        }

        const newShop = {
            name,
            type,
            place,
            distance: distance || null,
            createdBy: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("shops").add(newShop);
        
        res.status(201).json({ 
            id: docRef.id,
            message: "Shop created successfully",
            shop: newShop
        });
    } catch (error) {
        console.error("Error creating shop:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, place, distance } = req.body;

        const shopRef = db.collection("shops").doc(id);
        const doc = await shopRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Shop not found" });
        }

        const shopData = doc.data();
        
        // Check if user is the creator
        if (shopData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: "You are not authorized to update this shop" });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (place !== undefined) updateData.place = place;
        if (distance !== undefined) updateData.distance = distance;
        
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await shopRef.update(updateData);

        res.status(200).json({ message: "Shop updated successfully" });
    } catch (error) {
        console.error("Error updating shop:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteShop = async (req, res) => {
    try {
        const { id } = req.params;

        const shopRef = db.collection("shops").doc(id);
        const doc = await shopRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Shop not found" });
        }

        const shopData = doc.data();
        
        // Check if user is the creator
        if (shopData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: "You are not authorized to delete this shop" });
        }

        // Delete shop items first
        const itemsSnapshot = await db.collection('shops').doc(id).collection('items').get();
        const batch = db.batch();
        
        itemsSnapshot.docs.forEach((itemDoc) => {
            batch.delete(itemDoc.ref);
        });

        // Delete the shop
        batch.delete(shopRef);
        await batch.commit();

        res.status(200).json({ message: "Shop deleted successfully" });
    } catch (error) {
        console.error("Error deleting shop:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get user's favourite shops
const getFavouriteShops = async (req, res) => {
    try {
        const favouritesSnapshot = await db.collection('favourites')
            .where('userId', '==', req.user.uid)
            .where('type', '==', 'shop')
            .get();

        if (favouritesSnapshot.empty) {
            return res.status(200).json([]);
        }

        const shopIds = favouritesSnapshot.docs.map(doc => doc.data().shopId);
        
        // Get shop details in batches (Firestore limit is 10 for 'in' queries)
        const shops = [];
        for (let i = 0; i < shopIds.length; i += 10) {
            const batch = shopIds.slice(i, i + 10);
            const shopsSnapshot = await db.collection('shops')
                .where(admin.firestore.FieldPath.documentId(), 'in', batch)
                .get();
            
            const batchShops = shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            shops.push(...batchShops);
        }

        res.status(200).json(shops);
    } catch (error) {
        console.error("Error fetching favourite shops:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Add shop to favourites
const addToFavourites = async (req, res) => {
    try {
        const { shopId } = req.body;

        if (!shopId) {
            return res.status(400).json({ error: "Shop ID is required" });
        }

        // Check if shop exists
        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists) {
            return res.status(404).json({ error: "Shop not found" });
        }

        // Check if already in favourites
        const existingFavourite = await db.collection('favourites')
            .where('userId', '==', req.user.uid)
            .where('shopId', '==', shopId)
            .where('type', '==', 'shop')
            .get();

        if (!existingFavourite.empty) {
            return res.status(400).json({ error: "Shop is already in favourites" });
        }

        // Add to favourites
        await db.collection('favourites').add({
            userId: req.user.uid,
            shopId,
            type: 'shop',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ message: "Shop added to favourites successfully" });
    } catch (error) {
        console.error("Error adding to favourites:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Remove shop from favourites
const removeFromFavourites = async (req, res) => {
    try {
        const { shopId } = req.params;

        const favouriteSnapshot = await db.collection('favourites')
            .where('userId', '==', req.user.uid)
            .where('shopId', '==', shopId)
            .where('type', '==', 'shop')
            .get();

        if (favouriteSnapshot.empty) {
            return res.status(404).json({ error: "Shop not found in favourites" });
        }

        // Delete the favourite record
        const batch = db.batch();
        favouriteSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        res.status(200).json({ message: "Shop removed from favourites successfully" });
    } catch (error) {
        console.error("Error removing from favourites:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getShops,
    addShop,
    getOneShop,
    updateShop,
    deleteShop,
    getFavouriteShops,
    addToFavourites,
    removeFromFavourites
};
