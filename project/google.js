const express = require('express');
const passport = require('passport');
const path = require('path');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();

// Set up sessions
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use('/project', express.static(path.join(__dirname, 'project',)));
// Set up Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: '336948209396-r75nrckqvqai9ra5j67sbleg1iml5lch.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: 'http://localhost:3000/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  // Save user to database or perform other operations as needed
  return done(null, profile);
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'htmlpages', 'google.html'));
  });

// Google authentication route
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google authentication callback route
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Logout route
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Profile route (example, you can customize this)
app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
      const displayName = req.user.displayName;
      const profilePicUrl = req.user.photos && req.user.photos.length > 0 ? req.user.photos[0].value : null;
  
      // Display profile picture and welcome message
      res.send(`
        <h1>Welcome, ${displayName}!</h1>
        ${profilePicUrl ? `<img src="${profilePicUrl}" alt="Profile Picture">` : ''}
        <a href="/logout">Logout</a>
      `);
    } else {
      res.redirect('/');
    }
  });
  
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
