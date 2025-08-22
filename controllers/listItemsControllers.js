const {getAdmin,getFirestore} = require("../config/firebase")

db = getFirestore()

const admin = getAdmin()

const getListItems = async (req, res) => {
  try {
    const listId = req.params.id;
    const snapShot = await db.collection('lists').doc(listId).collection('items').get();
    
    const items = snapShot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(items);
  } catch (error) {
    console.error("Error fetching list items:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const addItems = async(req,res) =>{
    try {
        const listId = req.params.id;
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

        const docRef = await db.collection('lists').doc(listId).collection('items').add(newItem);
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

const updateItem = async (req, res) => {
    try {
        const { listId, itemId } = req.params;
        const { name, completed, brandName, amount, quantity } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (completed !== undefined) updateData.completed = completed;
        if (brandName !== undefined) updateData.brandName = brandName;
        if (amount !== undefined) updateData.amount = amount;
        if (quantity !== undefined) updateData.quantity = quantity;
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('lists').doc(listId).collection('items').doc(itemId).update(updateData);
        
        res.status(200).json({ message: "Item updated successfully" });
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteItem = async (req, res) => {
    try {
        const { listId, itemId } = req.params;

        await db.collection('lists').doc(listId).collection('items').doc(itemId).delete();
        
        res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { getListItems, addItems, updateItem, deleteItem };

