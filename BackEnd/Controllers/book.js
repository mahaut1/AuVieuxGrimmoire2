const Book = require('../models/Book')
const fs= require('fs');
const sharp=require('sharp')

exports.createBook = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject.userId;
    const imagePath = `images/${req.file.filename}`;
    const outputPath = `images/compressed_${req.file.filename}`;
    await sharp(req.file.path)
      .resize({ width: 800 }) 
      .toFile(outputPath); 
    fs.unlinkSync(req.file.path);

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/${outputPath}`,
    });
    await book.save();

    res.status(201).json({ message: 'Objet enregistré !' });
  } catch (error) {
    res.status(400).json({ error });
  }
};


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
    bookId = req.params.id; 
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
  }
  exports.rateBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then((book) => {
        if (book.userId != req.auth.userId) {
          if (book.ratings.find((rating) => rating.userId === req.auth.userId)) {
            return res
              .status(401)
              .json({ message: "Vous avez déjà noté ce livre !" });
          }
          const newRating = {
            userId: req.auth.userId,
            grade: req.body.rating,
          };
          book.ratings.push(newRating);
          let averageRating =
            book.ratings.reduce((acc, rating) => {
              return acc + rating.grade;
            }, 0) / book.ratings.length;
          book.averageRating = averageRating;
          return book.save();
        }
      })
      .then((book) => res.status(200).json(book))
  
      .catch((error) => res.status(404).json({ error }));
  };

  
exports.getTopRatedBooks = async (req, res, next) => {
  try {
    const topRatedBooks = await Book.aggregate([
      { $sort: { averageRating: -1 } }, 
      { $limit: 3 } 
    ]);
    res.status(200).json(topRatedBooks);
  } catch (error) {
    res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des meilleurs livres.' });
  }
};
  

