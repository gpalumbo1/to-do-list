const express = require('express');
const User = require('../models/User');
const router = express.Router();
const fs = require('fs'); // Per gestire i file
const multer = require('multer');

// Configurazione di multer per gestire il caricamento del file
const storage = multer.memoryStorage(); // Usa la memoria per salvare il file
const upload = multer({ storage: storage });

// Visualizzare la lista delle attività
router.get('/', async (req, res) => {
    if (!req.user) return res.redirect('/');

    // Trova l'utente nel database e prendi le sue attività
    const user = await User.findById(req.user._id);
    res.render('todo', { user: user, tasks: user.tasks });
});

// Aggiungere una nuova attività
router.post('/add', async (req, res) => {
    if (!req.user) return res.redirect('/');

    const user = await User.findById(req.user._id);
    user.tasks.push({ text: req.body.task, done: false });
    await user.save();  
    res.redirect('/todo');  
});

// Completare un'attività
router.post('/complete', async (req, res) => {
    if (!req.user) return res.redirect('/');

    const user = await User.findById(req.user._id);
    const task = user.tasks.id(req.body.taskId);  
    if (task) {
        task.done = true;  
        await user.save();  
    }
    res.redirect('/todo');  
});

// Eliminare un'attività
router.post('/delete', async (req, res) => {
    if (!req.user) return res.redirect('/');

    const user = await User.findById(req.user._id);
    user.tasks = user.tasks.filter(task => task._id.toString() !== req.body.taskId);  
    await user.save();  
    res.redirect('/todo');  
});

// ✅ Esportare la lista attività (scaricare un file JSON)
router.get('/export', async (req, res) => {
    if (!req.user) return res.status(401).send("Non autorizzato");

    const user = await User.findById(req.user._id);
    const tasksJSON = JSON.stringify(user.tasks, null, 2);

    res.setHeader('Content-Disposition', 'attachment; filename=tasks.json');
    res.setHeader('Content-Type', 'application/json');
    res.send(tasksJSON);
});

// ✅ Importare una lista attività da un file JSON
router.post('/import', upload.single('tasksFile'), async (req, res) => {
    if (!req.user || !req.file) {
        return res.status(400).send("File non valido o nessun file caricato");
    }

    try {
        // Verifica che il file contenga dati
        if (!req.file.buffer) {
            return res.status(400).send("Il file non contiene dati.");
        }

        const importedTasks = JSON.parse(req.file.buffer.toString());

        if (!Array.isArray(importedTasks)) {
            return res.status(400).send("Formato JSON non valido");
        }

        // Verifica che i task abbiano la struttura corretta
        const validTasks = importedTasks.every(task => task.text && typeof task.text === 'string' && (task.done === false || task.done === true));

        if (!validTasks) {
            return res.status(400).send("I dati nel file non sono nel formato corretto");
        }

        const user = await User.findById(req.user._id);
        user.tasks.push(...importedTasks);
        await user.save();
        
        res.redirect('/todo');
    } catch (error) {
        console.error("Errore nel parsing del file JSON:", error);
        res.status(400).send("Errore nel parsing del file JSON");
    }
});

module.exports = router;
