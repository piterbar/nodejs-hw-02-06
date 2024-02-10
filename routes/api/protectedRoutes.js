const express = require('express');
const authenticate = require('../../middleware/authenticate');
const router = express.Router();

router.get('/protected', authenticate, (req, res) => {
  res.send('Ta trasa jest chroniona i wymaga autoryzacji');
});

module.exports = router;
