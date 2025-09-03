const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_JWT_SECRET = process.env.USER_SERVICE_JWT_SECRET || process.env.JWT_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase env missing: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const verifyJWT = (req, res, next) => {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please login' });
    const decoded = jwt.verify(token, USER_JWT_SECRET);
    if (!decoded?.id) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.get('/api/behaviour/questions', verifyJWT, (req, res) => {
  const questions = [
    { id: 'dailyRoutine', text: "What’s your daily routine like?", options: ['Night Owl', 'Early Riser', 'Flexible'] },
    { id: 'socialLevel', text: 'How social are you?', options: ['Prefer private, less interaction', 'Enjoy occasional socializing', 'Very outgoing'] },
    { id: 'smokeDrink', text: 'Do you smoke/drink?', options: ['Yes', 'No'] },
    { id: 'cleanliness', text: 'How do you prefer your living space?', options: ['Very clean & organized', 'Average clean', 'Not too strict about it'] },
    { id: 'foodType', text: 'Your food type?', options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'] },
    { id: 'foodSource', text: 'Do you cook or order food?', options: ['Cook myself', 'Order outside', 'Mix of both'] },
    { id: 'noisePref', text: 'Do you prefer a quiet or lively place?', options: ['Quiet', 'Don’t mind some noise'] },
    { id: 'privacyLevel', text: 'How much personal space do you need?', options: ['High privacy', 'Balanced', 'Don’t mind sharing'] },
    { id: 'budget', text: 'Budget range (₹ per month)?', type: 'range', min: 2000, max: 15000 },
    { id: 'stayDuration', text: 'How long do you plan to stay?', options: ['Short-term (up to 6 months)', 'Long-term (6+ months)'] },
    { id: 'visitorRules', text: 'Do you prefer strict visitor rules?', options: ['Yes, prefer restrictions', 'No, I’m flexible'] },
    { id: 'compatOnly', text: 'Show only compatible roommates?', options: ['Yes', 'No'] }
  ];
  res.json({ questions });
});

app.post('/api/behaviour/answers', verifyJWT, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') return res.status(400).json({ message: 'answers required' });
    const payload = {
      user_id: req.user.id,
      answers,
      completed_at: new Date().toISOString()
    };
    const { error } = await supabase.from('behaviour_answers').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ message: 'Failed to save answers', detail: error.message || error.hint || null });
    }
    res.json({ message: 'Saved' });
  } catch (e) {
    console.error('POST /answers error:', e);
    res.status(500).json({ message: 'Server error', detail: e?.message || null });
  }
});

app.get('/', (req, res) => res.send('Behaviour Questions Service Running'));

const PORT = process.env.PORT || 4010;
app.listen(PORT, () => console.log(`Behaviour Questions Service listening on port ${PORT}`));


