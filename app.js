var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
var cors = require("cors")
const session = require('express-session');
var hbs = require('hbs');
const fileUpload = require('express-fileupload');
var db = require("./database/index.js");

db.init()

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');
var dashboardRouter = require('./routes/dashboard');
var app = express();

var corsOptions = {
  origin: 'http://localhost:3000',
};

app.use(fileUpload());

app.use(cors(corsOptions));

app.use(session({
  secret: 'aaa',
  resave: true,
  saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

hbs.registerPartials(__dirname + "/views/partials");
hbs.registerHelper('dateFormat', function (date) {
  // hh:mm:ss dd/mm/yyyy
  let d = new Date(date);

  let h = d.getHours();
  let m = d.getMinutes();
  let s = d.getSeconds();
  let dd = d.getDate();
  let mm = d.getMonth() + 1;
  let yyyy = d.getFullYear();

  if (h < 10) {
    h = "0" + h;
  }
  if (m < 10) {
    m = "0" + m;
  }
  if (s < 10) {
    s = "0" + s;
  }
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  return h + ":" + m + ":" + s + " " + dd + "/" + mm + "/" + yyyy;
});
hbs.registerHelper('MsToS', function (ms) {
  return ms / 1000;
});




app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/dashboard', dashboardRouter)
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
