function handleEvent($targetHtml, type, data, keepContents) {

  if (!keepContents) {
    $targetHtml.empty();
    $targetHtml.removeAttr('style');
  }

  // Add new stuff
  switch (type) {
    case 'god':
      $targetHtml.append('<p class="god-message">' + data + '</p>');
      $targetHtml.css('background', 'url(19.%20Voice%20of%20God.png)');
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
    case 'timer-display':
      $targetHtml.append('<h1 class="countdown god-message">' + data + '</h1>');
      $targetHtml.css('background', 'url(20.%20CountdownScreen-black.png)');
      break;
    case 'timer-pulse':
      $targetHtml.css('background', 'url(21.%20CountdownScreen-pulse.png)');
      break;
    case 'timer-tick':
      $targetHtml.find('.countdown').text(data);
      break;
    case 'twitter':
      $targetHtml.css('background', 'url(23.%20Twitter%20Screen-blank.png)');
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
        if ($('.tweet').size() > 4) {
          console.log($('.tweet').size());
          $('.tweet').last().remove();
        }
      }
      break;
  }
}

$(document).on('ready', function() {
  var socket = io.connect(location.host);
  var slides = {};

  socket.on('slides', function (data) {
    data.forEach(function(row) {
      row.forEach(function(slide) {
        var binding = slide.binding;
        slides[binding] = slide;
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
      console.log("Undefined HMTL");
      console.log(data);
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

  function handleGodButton() {
    var text = $('#godtext').val();
    handleEvent($('.-preview'), 'god', text || '', false);
    socket.emit('preview-event', {'type': 'god', 'data': text});
  }

  $('#godbutton').click(function(e) {
    handleGodButton();
  });

  $('#timerdisplay').click(function(e) {
    var seconds = parseInt($('#timerinput').val()) || 60;
    handleEvent($('.-preview'), 'timer-display', seconds, false);
    socket.emit('preview-event', {'type': 'timer-display', 'data': seconds});
  });

  $('#timerstart').click(function(e) {
    socket.emit('starttimer', {});
  });

  $('#twitterbutton').click(function(e) {
    handleEvent($('.-preview'), 'twitter', {}, false);
    socket.emit('preview-event', {'type': 'twitter', 'data': {} });
  });

  $('.controls-slide').click(function(e) {
    var path = $(this).attr('src').replace(/\s/g, "%20");
    handleEvent($('.-preview'), 'slide', path, false);
    socket.emit('preview-event', {'type': 'slide', 'data': path});
  });

  $('.button-golive').click(function(e) {
    socket.emit('golive', {});
  });

  $(this).keydown(function(e) {
    var inputFocused = $('#godtext').is(':focus');
    if (e.keyCode == 13) {
      if (inputFocused) {
        handleGodButton();
      }
      socket.emit('golive', {});
    }
    else if (!inputFocused) {
      var bind = String.fromCharCode(e.keyCode).toLowerCase();
      var slide = slides[bind];
      if (slide != undefined) {
        var path = slide.path.replace(/\s/g, "%20");
        handleEvent($('.-preview'), 'slide', path, false);
        socket.emit('preview-event', {'type': 'slide', 'data': path});
      }
    }
  });

  $(this).keydown(function(e) {
    if (e.keyCode == 13) {
      enterPressed = false;
    }
    else if(e.shiftKey) {
      shiftPressed = false;
    }
  });

});
