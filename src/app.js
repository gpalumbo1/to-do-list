const express = require('express');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
require('../config/passport'); // Configurazione Passport

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connesso!'))
    .catch(err => console.log('Errore di connessione al database:', err));

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: true 
}));
app.use(passport.initialize());
app.use(passport.session());

const todoRoutes = require('../route/todoRoutes');
app.use('/todo', todoRoutes);

// Rotte di autenticazione
app.get('/', (req, res) => res.render('index', { user: req.user }));
app.get('/login', (req, res) => res.render('login'));
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/')
);
app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

// Avvio del server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server in ascolto su http://localhost:${PORT}`));
