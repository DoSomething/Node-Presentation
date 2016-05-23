var fs = require('fs');

var slideGroups = [];
var loop = [];
var bindingOptions = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm'];

this.readFiles = function(path, gallery, assignBinding) {
  var storage = [];
  var files = fs.readdirSync(`${__dirname}/public/${path}`);
  var row = [];

  if (!gallery) {
    return files.filter(function(value) {
      return value.split('.')[0] != '';
    }).reverse();
  }

  files.forEach(function(element, index) {
    if (element.split('.')[0] == '') {
      return;
    }

    row.push({
      'path': `${path}/${element}`,
      'binding': bindingOptions.pop(),
      'name': element
    });
    if (row.length >= 3) {
      storage.push(row.slice());
      row = [];
    }
  });

  if (row.length != 0) {
    storage.push(row.slice());
    row = [];
  }

  return {"name": path, "storage": storage};
}

this.sortLoop = function(rawLoop) {
  var loop = [rawLoop.splice(0, 1)[0]];

  while (rawLoop.length > 0) {
    var l = rawLoop.splice(0, 1)[0];

    if (rawLoop.length == 1) {
      loop.push(l);
      break;
    }

    var toCompare = loop[loop.length - 1].toLowerCase();

    if (toCompare.indexOf('reportback') == -1) {
      if (l.toLowerCase().indexOf('reportback') > -1) {
        loop.push(l);
      }
      else {
        rawLoop.push(l);
      }
    }
    else if (toCompare.indexOf('reportback') != -1) {
      if (l.toLowerCase().indexOf('reportback') == -1) {
        loop.push(l);
      }
      else {
        rawLoop.push(l);
      }
    }
  }

  return loop;
}

this.addSlides = function(s) {
  slideGroups.push(s);
}

this.getSlides = function() {
  return slideGroups;
}

this.setLoop = function(l) {
  loop = l;
}

this.getLoop = function() {
  return loop;
}
