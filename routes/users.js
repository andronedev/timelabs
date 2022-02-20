var express = require('express');
var router = express.Router();
var db = require('../database/index.js');
/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

router.get('/login', async function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect('/dashboard');
  }
  res.render('login')
})
router.get('/register', async function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect('/dashboard');
  }
  res.render('register')
})
router.post("/login", async function (req, res, next) {
  var user = await db.models.Users.findOne({
    where: {
      email: req.body.email,
      password: req.body.password
    }
  })
  if (user) {
    req.session.userid = user.id
    req.session.loggedIn = true
    res.redirect('/dashboard')

  } else {
    res.send("error")
  }
})

router.post('/register', async function (req, res, next) {
  var user = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name
  }
  // check if user exists
  var userExists = await db.models.Users.findOne({
    where: {
      email: user.email
    }
  })
  if (userExists) {
    res.send("Cette adresse email est déjà utilisée")
  } else {
    // create user
    var newUser = await db.models.Users.create({
      email: user.email,
      password: user.password,
      name: user.name
    })
    // create session
    let userid = await db.models.Users.findOne({
      where: {
        email: user.email
      }
    })

    req.session.userid = userid.id
    req.session.loggedIn = true
    res.redirect('/dashboard')
  }
})
router.get('/logout', async function (req, res, next) {
  req.session.destroy()
  res.redirect('/')
})
module.exports = router;
