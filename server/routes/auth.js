const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Kullanıcı Kaydı Endpoint'i
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, username, avatar_url } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password and username are required.' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Bu data, SQL'deki handle_new_user trigger'ı tarafından kullanılacak.
      data: {
        username,
        avatar_url: avatar_url || `https://api.dicebear.com/9.x/adventurer/svg?seed=${username}`
      }
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Supabase, yeni kullanıcılar için default olarak bir session döner.
  if (data.session) {
    res.status(200).json({ 
        message: 'Signup successful! Please check your email for verification.', 
        session: data.session,
        user: data.user
    });
  } else {
    res.status(200).json({ message: 'Signup successful! Please check your email for verification.' });
  }
});

// Kullanıcı Girişi Endpoint'i
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  res.status(200).json({ session: data.session, user: data.user });
});

// Oturumu Kapatma Endpoint'i
// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    const { error } = await supabase.auth.signOut();
    if(error){
        return res.status(400).json({ error: error.message });
    }
    res.status(200).json({ message: 'Successfully logged out' });
});


module.exports = router;
