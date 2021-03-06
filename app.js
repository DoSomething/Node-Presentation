const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const auth = require('basic-auth');
app.use(function(req, res, next) {
  const user = auth(req);
  if (!user || user.name != process.env.CLIENT_USERNAME || user.pass != process.env.CLIENT_PASSWORD) {
    res.set('WWW-Authenticate', 'Basic realm="dosomething-presentation"');
    return res.status(401).send();
  }

  return next();
});

const exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  partialsDir: [__dirname + '/views/partials'],
  helpers: {
  }
}));
app.set('view engine', 'handlebars');

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/@dosomething/forge/dist')));

const slides = require(__dirname + '/slides');
slides.addSlides(slides.readFiles('/slides', true, true));

// const rawLoop = slides.readFiles('/loop', false, false);
// slides.setLoop(slides.sortLoop(rawLoop));

const twitter = require(__dirname + '/twitter');
twitter.start(function(tweet) {
  if (liveState.type != 'twitter') {
    return;
  }

  io.emit('event', {state: 'live', type: 'tweet', data: tweet, keep: true});
});

var previewState = {};
var liveState = {};

var timerId;
function cancelExistingTimer() {
  if (timerId != undefined) {
    clearInterval(timerId);
  }
}

var loopIndex = 0;
function doSlideLoop() {
  if (liveState.type.indexOf('loop') == -1) {
    return;
  }

  cancelExistingTimer();

  var loop = slides.getLoop();
  io.emit('event', {state: 'live', type: 'loop', data: loop[loopIndex], keep: false});

  timerId = setInterval(function() {
    loopIndex++;
    if (loopIndex >= loop.length) {
      loopIndex = 0;
    }
    var img = loop[loopIndex];
    io.emit('event', {state: 'live', type: 'loop', data: img, keep: false});
  }, 15 * 1000);
}

app.get('/', function (req, res) {
  res.render('present');
});

app.get('/admin', function (req, res) {
  res.render('admin', {"slideGroups": slides.getSlides()});
});

io.on('connection', function (socket) {
  socket.emit('slides', slides.getSlides());
  socket.emit('event', {state: 'preview', type: previewState.type, data: previewState.data});
  socket.emit('event', {state: 'live', type: liveState.type, data: liveState.data});

  if (liveState.type == 'twitter') {
    io.emit('event', {state: 'live', type: 'tweet', data: twitter.getPastTweets(), keep: true});
  }

  socket.on('preview-event', function (data) {
    previewState.type = data.type;
    previewState.data = data.data;
    socket.broadcast.emit('event', {state: 'preview', type: previewState.type, data: previewState.data});
  });

  socket.on('golive', function (data) {
    cancelExistingTimer();

    liveState.type = previewState.type;
    liveState.data = previewState.data;
    io.emit('event', {state: 'live', type: liveState.type, data: liveState.data});

    if (liveState.type == 'twitter') {
      io.emit('event', {state: 'live', type: 'tweet', data: twitter.getPastTweets(), keep: true});
    }
    else if (liveState.type == 'loop') {
      doSlideLoop();
    }
  });

  socket.on('starttimer', function (data) {
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
});

server.listen(process.env.PORT, function() {
  console.log("Listening on " + process.env.PORT);
});
