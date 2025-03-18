const express = require('express');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');

dotenv.config();
const app = express();

// Configurazione Passport
require('../config/passport'); 

// Connetti a MongoDB con opzioni di sicurezza
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: 'admin', // Specifica il database di autenticazione
    user: process.env.DB_USER, // Usa variabili d'ambiente per la sicurezza
    pass: process.env.DB_PASS
})
    .then(() => console.log('Database connesso in sicurezza!'))
    .catch(err => console.error('Errore di connessione al database:', err));

// Middleware di sicurezza
app.use(helmet()); // Protegge da vulnerabilità comuni
app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true })); // Restringe le richieste solo da domini fidati

// Configura Express per servire file statici
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configura la sessione con sicurezza avanzata
app.use(session({ 
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false,
    cookie: {
        httpOnly: true,   // Previene accesso ai cookie via JavaScript
        secure: process.env.NODE_ENV === 'production', // Usa solo HTTPS in produzione
        sameSite: 'strict', // Protegge da CSRF
        maxAge: 1000 * 60 * 60 // Sessione valida per 1 ora
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Validazione caricamento file JSON
function validateJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        JSON.parse(data);
        console.log('JSON valido!');
    } catch (error) {
        console.error('JSON non valido o corrotto:', error);
    }
}

// Rotte di autenticazione
app.get('/', (req, res) => res.render('index', { user: req.user }));
app.get('/login', (req, res) => res.render('login'));

// Autenticazione Google
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
