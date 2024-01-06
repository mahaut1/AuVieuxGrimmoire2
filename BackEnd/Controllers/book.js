const Book = require('../models/Book')
const fs= require('fs');
const sharp=require('sharp')

exports.createBook= (req, res, next) => {
  const bookObject=JSON.parse(req.body.book)
    delete bookObject._id;
    delete bookObject.userId;
    
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    book.save()
      .then(() => res.status(201).json({ message: 'Objet enregistré !'}))
      .catch(error => res.status(400).json({ error }));
  }

  exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    delete bookObject._userId;
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };

 exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

  exports.getAllBooks= (req, res, next) => {
    Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
  }

  exports.getOneBook= (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
  }
  exports.rateBook = async (req, res, next) => {
    console.log('Body:', req.body); 
    console.log('Params ID:', req.params.id);
    console.log('BookID:', req.params.id);
    const { userId, rating } = req.body;
  
    try {
      const book = await Book.findOne({ _id: req.params.id });
      console.log('Book:', book);
      console.log('Retrieved Book:', book);
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }
  
      const userRating = book.ratings.find((r) => r.userId === userId);
      if (userRating) {
        return res.status(400).json({ message: 'L\'utilisateur a déjà noté ce livre' });
      }
  
      book.ratings.push({ userId, grade: rating });
      console.log('Updated Ratings:', book.ratings);
      const totalRatings = book.ratings.length;
      let totalRatingSum = 0;
  
      book.ratings.forEach((r) => {
        totalRatingSum += r.grade;
        console.log('Total Ratings Sum:', totalRatingSum);
      });
  
      const averageRating = totalRatingSum / totalRatings;
      console.log('New Average Rating:', averageRating);
      book.averageRating = averageRating;
      await book.save();
      console.log('Updated Book:', book);
      res.status(200).json({ message: 'Notation enregistrée avec succès', book });
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la notation du livre' });
    }
  };

  
exports.getTopRatedBooks = async (req, res, next) => {
  try {
    const topRatedBooks = await Book.aggregate([
      { $sort: { averageRating: -1 } }, // Trie par note moyenne décroissante
      { $limit: 3 } // Limite les résultats à 3 livres
    ]);
    res.status(200).json(topRatedBooks);
  } catch (error) {
    res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des meilleurs livres.' });
  }
};
  

