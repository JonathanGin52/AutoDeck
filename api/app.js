var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var soundRouter = require('./routes/sound');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use('/', soundRouter);

// static
app.use(express.static('public'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname+'index.html'));
});

//init socket connection for real time text display
app.post('/api/record', (req, res) => {
  const transcript = req.params.transcript;
  console.log(transcript);
  res.status(200);
});

//server
const port = 8080;
app.listen(port, function () {
  console.log('Example app listening on http://localhost:'+port);
});

module.exports = app;