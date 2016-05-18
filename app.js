var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  partialsDir: [__dirname + '/views/partials'],
  helpers: {
  }
}));
app.set('view engine', 'handlebars');

var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/@dosomething/forge/dist')));

var slides = require(__dirname + '/slides');
var twitter = require(__dirname + '/twitter');
var previewState = {};
var liveState = {};

var timerId;
function cancelExistingTimer() {
  if (timerId != undefined) {
    clearInterval(timerId);
  }
}

function verifyPassword(pass) {
  return pass == process.env.CLIENT_PASSWORD;
}

app.get('/', function (req, res) {
  res.render('present');
});

app.get('/admin', function (req, res) {
  res.render('admin', {"slides": slides.getSlides()});
});

io.on('connection', function (socket) {
  socket.emit('slides', slides.getSlides());
  socket.emit('event', {state: 'preview', type: previewState.type, data: previewState.data});
  socket.emit('event', {state: 'live', type: liveState.type, data: liveState.data});

  if (liveState.type == 'twitter') {
    io.emit('event', {state: 'live', type: 'tweet', data: twitter.getPastTweets(), keep: true});
  }

  socket.on('preview-event', function (data) {
    if (!verifyPassword(data.password)) {
      return;
    }

    previewState.type = data.type;
    previewState.data = data.data;
    socket.broadcast.emit('event', {state: 'preview', type: previewState.type, data: previewState.data});
  });

  socket.on('golive', function (data) {
    if (!verifyPassword(data.password)) {
      return;
    }

    cancelExistingTimer();

    liveState.type = previewState.type;
    liveState.data = previewState.data;
    io.emit('event', {state: 'live', type: liveState.type, data: liveState.data});

    if (liveState.type == 'twitter') {
      io.emit('event', {state: 'live', type: 'tweet', data: twitter.getPastTweets(), keep: true});
    }
  });

  socket.on('starttimer', function (data) {
    if (!verifyPassword(data.password)) {
      return;
    }

    if (liveState.type.indexOf('timer') == -1) {
      return;
    }

    cancelExistingTimer();

    var ticks = liveState.data;
    timerId = setInterval(function() {
      io.emit('event', {state: 'live', type: 'timer-tick', data: ticks, keep: true});

      if (ticks <= 0) {
        cancelExistingTimer();
        return;
      }

      if (ticks <= 5) {
        io.emit('event', {state: 'live', type: 'timer-pulse', data: {}, keep: true});
      }

      ticks--;
    }, 1000);
  });

  socket.on('login', function(password) {
    socket.emit('login-response', verifyPassword(password));
  });

});

twitter.start(function(tweet) {
  if (liveState.type != 'twitter') {
    return;
  }

  io.emit('event', {state: 'live', type: 'tweet', data: tweet, keep: true});
});

slides.readSlides();

server.listen(process.env.PORT, function() {
  console.log("Listening on " + process.env.PORT);
});
