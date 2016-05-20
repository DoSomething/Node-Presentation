var fs = require('fs');

var slides = [];
var loop = [];
var bindingOptions = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm'];

this.readFiles = function(path, gallery) {
  var storage = [];
  var files = fs.readdirSync(`${__dirname}/public/${path}`);
  var row = [];

  if (!gallery) {
    return files.filter(function(value) {
      return value.split('.')[0] != '';
    });
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
    if (index % 3 == 0) {
      storage.unshift(row.slice());
      row = [];
    }
  });
  if (row.length != 0) {
    storage.unshift(row.slice());
    row = [];
  }

  return storage;
}

this.setSlides = function(s) {
  slides = s;
}

this.getSlides = function() {
  return slides;
}

this.setLoop = function(l) {
  loop = l;
}

this.getLoop = function() {
  return loop;
}
