const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const bookRoutes = require('./routes/book');
const userRoutes = require('./routes/user');
const path=require('path');


mongoose.connect('mongodb+srv://windalmahaut:qoFUyirNbEXYefZ8@cluster0.cczpfwg.mongodb.net/?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

  app.use(cors({
    origin: 'http://localhost:3000', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    exposedHeaders: ['Authorization'],
  }));

  
  app.use(express.json());
  
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

  app.use('/images', express.static(path.join(__dirname, 'images')));
  app.use('/api/books', bookRoutes)
  app.use('/api/auth', userRoutes);
  module.exports = app;