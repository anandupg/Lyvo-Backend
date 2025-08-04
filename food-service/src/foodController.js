const FoodModel = require('./foodModel');

// Get all dishes with optional filters
const getAllDishes = async (req, res) => {
  try {
    const filters = {
      mood: req.query.mood,
      user_id: req.query.user_id,
      difficulty: req.query.difficulty,
      search: req.query.search
    };

    const dishes = await FoodModel.getAllDishes(filters);
    res.json(dishes);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get dish by ID
const getDishById = async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await FoodModel.getDishById(id);
    
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    
    res.json(dish);
  } catch (error) {
    console.error('Error fetching dish:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new dish
const createDish = async (req, res) => {
  try {
    console.log('Received create dish request:', req.body);
    
    const {
      title,
      mood,
      cook_time,
      servings,
      difficulty,
      description,
      ingredients,
      instructions,
      tags,
      image_url,
      user_id
    } = req.body;

    // Validation
    if (!title || !mood || !user_id) {
      return res.status(400).json({ 
        message: 'Title, mood, and user_id are required' 
      });
    }

    // Prepare dish data
    const dishData = {
      title: title.trim(),
      mood: mood.trim(),
      cook_time: cook_time || null,
      servings: servings ? parseInt(servings) : null,
      difficulty: difficulty || null,
      description: description || null,
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      instructions: Array.isArray(instructions) ? instructions : [],
      tags: Array.isArray(tags) ? tags : [],
      image_url: image_url || null,
      user_id: user_id
    };

    console.log('Prepared dish data:', dishData);

    const newDish = await FoodModel.createDish(dishData);
    console.log('Successfully created dish:', newDish);
    res.status(201).json(newDish);
  } catch (error) {
    console.error('Error creating dish in controller:', error);
    res.status(500).json({ 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update dish
const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.user_id; // Prevent changing ownership

    const updatedDish = await FoodModel.updateDish(id, updateData);
    
    if (!updatedDish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    
    res.json(updatedDish);
  } catch (error) {
    console.error('Error updating dish:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete dish
const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    await FoodModel.deleteDish(id);
    res.json({ message: 'Dish deleted successfully' });
  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get dishes by user
const getDishesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const dishes = await FoodModel.getDishesByUser(userId);
    res.json(dishes);
  } catch (error) {
    console.error('Error fetching user dishes:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get dishes by mood
const getDishesByMood = async (req, res) => {
  try {
    const { mood } = req.params;
    const dishes = await FoodModel.getDishesByMood(mood);
    res.json(dishes);
  } catch (error) {
    console.error('Error fetching dishes by mood:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search dishes
const searchDishes = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const dishes = await FoodModel.searchDishes(q);
    res.json(dishes);
  } catch (error) {
    console.error('Error searching dishes:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get dishes by ingredients
const getDishesByIngredients = async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ message: 'Ingredients array is required' });
    }
    
    const dishes = await FoodModel.getDishesByIngredients(ingredients);
    res.json(dishes);
  } catch (error) {
    console.error('Error fetching dishes by ingredients:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  getDishesByUser,
  getDishesByMood,
  searchDishes,
  getDishesByIngredients
}; 