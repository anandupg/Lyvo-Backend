const express = require('express');
const router = express.Router();
const {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  getDishesByUser,
  getDishesByMood,
  searchDishes,
  getDishesByIngredients
} = require('./foodController');

// Get all dishes with optional filters
// GET /api/food/dishes?mood=happy&difficulty=easy&search=pasta
router.get('/dishes', getAllDishes);

// Get dish by ID
// GET /api/food/dishes/:id
router.get('/dishes/:id', getDishById);

// Create new dish
// POST /api/food/dishes
router.post('/dishes', createDish);

// Update dish
// PUT /api/food/dishes/:id
router.put('/dishes/:id', updateDish);

// Delete dish
// DELETE /api/food/dishes/:id
router.delete('/dishes/:id', deleteDish);

// Get dishes by user
// GET /api/food/users/:userId/dishes
router.get('/users/:userId/dishes', getDishesByUser);

// Get dishes by mood
// GET /api/food/moods/:mood/dishes
router.get('/moods/:mood/dishes', getDishesByMood);

// Search dishes
// GET /api/food/search?q=chicken
router.get('/search', searchDishes);

// Get dishes by ingredients
// POST /api/food/dishes/by-ingredients
router.post('/dishes/by-ingredients', getDishesByIngredients);

module.exports = router;