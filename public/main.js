// Modified from http://stackoverflow.com/a/7873401/2129670
function getOptimalFontSize($container) {
  var fontSize = 14;
  var changes = 0;
  var success = true;
  var div = $container[0];

  while (div.scrollWidth <= div.clientWidth && div.scrollHeight <= div.clientHeight) {
    div.style.fontSize = fontSize + 'px';
    fontSize++;
    changes++;
    if (changes > 500) {
        success = false;
        break;
    }
  }

  if (changes > 0) {
    if (success) {
      fontSize -= 2;
    }
    else {
      // fontSize -= changes;
    }
    div.style.fontSize = fontSize + "px";
  }
}

function verticalAlignText($p, $container) {
  $p.css('margin-top', ($container.height() - $p.height()) / 2);
}

function addDonateText($targetHtml, $p) {
  $targetHtml.append($p);

  if ($targetHtml.hasClass('simulator')) {
    $targetHtml.css('padding', '56px');
  }
  else {
    $targetHtml.css('padding', '220px');
  }

  getOptimalFontSize($targetHtml);
  verticalAlignText($p, $targetHtml);
  $targetHtml.css('background', 'url(donations.png)');
}

function handleEvent($targetHtml, type, data, keepContents) {

  if (!keepContents) {
    $targetHtml.empty();
    $targetHtml.removeAttr('style');
  }

  // Add new stuff
  switch (type) {
    case 'god':
      var $p = $(`<p class="god-message">${data}</p>`);
      $targetHtml.append($p);

      if ($targetHtml.hasClass('simulator')) {
        $targetHtml.css('padding', '56px');
      }
      else {
        $p.css('margin', '200px');
        // $p.css('margin-bottom', '280px');
      }

      getOptimalFontSize($targetHtml);
      verticalAlignText($p, $targetHtml);
      $targetHtml.css('background', 'url(vog.png)');
      break;
    case 'slide':
      if (data.endsWith('mp4')) {
        $targetHtml.css('background', 'url(23.%20Twitter%20Screen-blank.png)');
        var width = $targetHtml.width();
        var height = $targetHtml.height();
        var $video = $(`<video src="${data}" width=${width} height=${height} autoplay></video>`);
        $targetHtml.append($video);
      }
      else {
        $targetHtml.css('background', 'url(' + data + ')');
      }
      break;
    case 'loop':
      if (data) {
        $targetHtml.css('background', `url(loop/${encodeURI(data)})`);
      }
      else {
        $targetHtml.css('background-color', '#E84079');
        if ($targetHtml.hasClass('-preview')) {
          $targetHtml.append('<p>slide loop</p>');
        }
      }
      break;
    case 'timer-display':
      $targetHtml.append('<h1 class="countdown god-message">' + data + '</h1>');
      $targetHtml.css('background', 'url(countdown-regular.png)');
      break;
    case 'timer-pulse':
      $targetHtml.find('.countdown').addClass('pulse');
      $targetHtml.css('background', 'url(countdown-pulse.png)');
      break;
    case 'timer-tick':
      $targetHtml.find('.countdown').text(data);
      break;
    case 'twitter':
      $targetHtml.css('background', 'url(twitter.png)');
      $targetHtml.append('<div class="tweet-container"></div>')
      break;
    case 'tweet':
      if (Array.isArray(data)) {
        data.forEach(function(e) {
          handleEvent($targetHtml, type, e, true);
        });
      }
      else {
        $targetHtml.children().prepend(data);
        if ($('.tweet').size() > 3) {
          $('.tweet').last().remove();
        }
      }
      break;
    case 'donate':
      $targetHtml.css('background', 'url(spark.png)');
      break;
    case 'donation':
      var $p = $(`<p class="donation-message">${data}</p>`);
      addDonateText($targetHtml, $p);
      break;
  }
}

function handleGodButton(socket) {
  var rawText = $('#godtext').val();
  var text = "";

  var boldOpen = false;
  var italicOpen = false;

  for (var i = 0; i < rawText.length; i++) {
    var c = rawText.charAt(i)
    if (c == '*') {
      if (boldOpen) {
        text += "</b>";
      }
      else {
        text += "<b>";
      }

      boldOpen = !boldOpen;
    }
    else if (c == '_') {
      if (italicOpen) {
        text += "</i>";
      }
      else {
        text += "<i>";
      }

      italicOpen = !italicOpen;
    }
    else {
      text += c;
    }
  }

  handleEvent($('.-preview'), 'god', text || '', false);
  socket.emit('preview-event', {'type': 'god', 'data': text});
}

function handleDonation(socket) {
  var donation = '"' + $('#donatemessage').val() + '"';

  handleEvent($('.-preview'), 'donation', donation, false);
  socket.emit('preview-event', {'type': 'donation', 'data': donation});
}

function startup(socket) {

  var slides = {};

  socket.on('slides', function (data) {
    data.forEach(function(group) {
      group.storage.forEach(function(row) {
        row.forEach(function(slide) {
          var binding = slide.binding;
          slides[binding] = slide;
        });
      });
    });
  });

  socket.on('event', function (data) {
    // What HTML are we editing?
    var $targetHtml;
    if (data.state == 'preview' && window.location.href.indexOf('admin') != -1) {
      $targetHtml = $('.-preview');
    }
    else if (data.state == 'live') {
      $targetHtml = $('.-live');
    }

    if ($targetHtml == undefined) {
      return;
    }

    var keep = false;
    if (data.keep != undefined) {
      keep = data.keep;
    }

    // Send it off!
    handleEvent($targetHtml, data.type, data.data, keep);
  });

  // ---
  // Handle dat input
  // ---

  $('#godbutton').click(function(e) {
    handleGodButton(socket);
  });

  $('#timerdisplay').click(function(e) {
    var seconds = parseInt($('#timerinput').val()) || 60;
    handleEvent($('.-preview'), 'timer-display', seconds, false);
    socket.emit('preview-event', {'type': 'timer-display', 'data': seconds});
  });

  $('#timerstart').click(function(e) {
    socket.emit('starttimer');
  });

  $('#twitterbutton').click(function(e) {
    handleEvent($('.-preview'), 'twitter', {}, false);
    socket.emit('preview-event', {'type': 'twitter', 'data': {}});
  });

  $('.controls-slide').click(function(e) {
    var path = $(this).attr('src').replace(/\s/g, "%20");
    handleEvent($('.-preview'), 'slide', path, false);
    socket.emit('preview-event', {'type': 'slide', 'data': path});
  });

  $('#slideloop').click(function(e) {
    handleEvent($('.-preview'), 'loop', false, false);
    socket.emit('preview-event', {'type': 'loop', 'data': false});
  });

  $('.button-golive').click(function(e) {
    socket.emit('golive');
  });

  $('#donatemode').click(function(e) {
    handleEvent($('.-preview'), 'donate', {}, false);
    socket.emit('preview-event', {'type': 'donate', 'data': {}});
  });

  $('#donatedisplay').click(function(e) {
    handleDonation(socket);
  });

  $(this).keydown(function(e) {
    var godInputFocused = $('#godtext').is(':focus');
    var donorInputFocused = $('#donatemessage').is(':focus');
    if (e.keyCode == 13) {
      if (godInputFocused) {
        handleGodButton(socket);
      }
      else if (donorInputFocused) {
        handleDonation(socket);
      }
      socket.emit('golive');
    }
    else if (!godInputFocused && !donorInputFocused) {
      var bind = String.fromCharCode(e.keyCode).toLowerCase();
      var slide = slides[bind];
      if (slide != undefined) {
        var path = slide.path.replace(/\s/g, "%20");
        handleEvent($('.-preview'), 'slide', path, false);
        socket.emit('preview-event', {'type': 'slide', 'data': path});
      }
    }
  });
}

$(document).on('ready', function() {
  var socket = io.connect(location.host);
  startup(socket);
});
