const express = require('express');
const router = express.Router();
const bookCtrl=require('../Controllers/book')
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

router.post('/',auth, multer, bookCtrl.createBook);
router.get('/bestrating', auth, bookCtrl.getTopRatedBooks);
router.get('/:id', auth, bookCtrl.getOneBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.get('/', auth, bookCtrl.getAllBooks);
router.post('/:id/rating', auth, bookCtrl.rateBook);


module.exports = router;
