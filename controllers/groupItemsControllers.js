const {getAdmin,getFirestore} = require("../config/firebase")

db = getFirestore()

const admin = getAdmin()

const getGroupItems = async (req, res) => {
  try {
    const groupId = req.params.id;
    const snapShot = await db.collection('groups').doc(groupId).collection('items').get();
    
    const items = snapShot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) {
    console.error("Error fetching group items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getCancelledGroupItems = async (req, res) => {
  try {
    const groupId = req.params.id;
    const snapShot = await db.collection('groups').doc(groupId).collection('cancelledItems').get();
    
    const cancelledItems = snapShot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(cancelledItems);
  } catch (error) {
    console.error("Error fetching cancelled group items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addGroupItems = async(req,res) =>{
    try {
        const groupId = req.params.id;
        const { name, completed = false, brandName = '', amount = '', quantity = '' } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({ error: "Item name is required" });
        }

        const newItem = {
            name,
            completed,
            brandName,
            amount,
            quantity,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.uid
        };

        const docRef = await db.collection('groups').doc(groupId).collection('items').add(newItem);
        res.status(201).json({ 
            id: docRef.id,
            message: "Item added successfully",
            item: newItem
        });
    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

const updateGroupItem = async (req, res) => {
    try {
        const { groupId, itemId } = req.params;
        const { name, completed, brandName, amount, quantity } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (completed !== undefined) updateData.completed = completed;
        if (brandName !== undefined) updateData.brandName = brandName;
        if (amount !== undefined) updateData.amount = amount;
        if (quantity !== undefined) updateData.quantity = quantity;
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('groups').doc(groupId).collection('items').doc(itemId).update(updateData);
        
        res.status(200).json({ message: "Item updated successfully" });
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteGroupItem = async (req, res) => {
    try {
        const { groupId, itemId } = req.params;

        // First, get the item to check if it's completed
        const itemDoc = await db.collection('groups').doc(groupId).collection('items').doc(itemId).get();
        
        if (!itemDoc.exists) {
            return res.status(404).json({ error: "Item not found" });
        }

        const itemData = itemDoc.data();
        
        // If item is not completed, add it to cancelled items
        if (!itemData.completed) {
            const cancelledItem = {
                name: itemData.name,
                brandName: itemData.brandName || '',
                amount: itemData.amount || '',
                quantity: itemData.quantity || '',
                originalCreatedAt: itemData.createdAt,
                originalCreatedBy: itemData.createdBy,
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                cancelledBy: req.user.uid
            };
            
            // Add to cancelled items subcollection
            await db.collection('groups').doc(groupId).collection('cancelledItems').add(cancelledItem);
        }

        // Delete the original item
        await db.collection('groups').doc(groupId).collection('items').doc(itemId).delete();
        
        res.status(200).json({ 
            message: itemData.completed ? "Item deleted successfully" : "Item cancelled and moved to cancelled items"
        });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { getGroupItems, getCancelledGroupItems, addGroupItems, updateGroupItem, deleteGroupItem };
