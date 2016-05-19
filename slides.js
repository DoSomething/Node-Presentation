var fs = require('fs');

var slides = [];
var bindingOptions = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'z', 'x', 'c', 'v', 'b', 'n', 'm'];

this.readSlides = function() {
  var files = fs.readdirSync(__dirname + '/public/slides');
  var row = [];
  files.forEach(function(element, index) {
    if (element.split('.')[0] == '') {
      return;
    }
    
    row.push({
      'path': '/slides/' + element,
      'binding': bindingOptions.pop(),
      'name': element
    });
    if (index % 3 == 0) {
      slides.unshift(row.slice());
      row = [];
    }
  });
  if (row.length != 0) {
    slides.unshift(row.slice());
    row = [];
  }
}

this.getSlides = function() {
  return slides;
}
