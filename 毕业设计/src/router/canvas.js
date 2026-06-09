paper.install(window);
var SQRT_3 = Math.pow(3, 0.5);
var triangle, D, mousePos, position;
var count = 50;

var getBackgroundColor = function() {
  if (document.body.classList.contains('dark-mode')) {
    return '#cfd2d6';
  } else {
    return '#0a121c';
  }
};

window.onload = function () {
  paper.setup('triangle-lost-in-space');
  mousePos = paper.view.center.add([view.bounds.width / 3, 100]);
  position = paper.view.center;

  var background = new Path.Rectangle(view.bounds);
  background.fillColor = getBackgroundColor();
  buildStars();
  triangle = new Triangle(50);
  paper.view.draw();

  paper.view.onFrame = function (event) {
    position = position.add((mousePos.subtract(position).divide(10)));
    var vector = (view.center.subtract(position)).divide(10);
    moveStars(vector.multiply(3));
    triangle.update();
  };
};

window.onresize = function () {
  project.clear();
  var background = new Path.Rectangle(view.bounds);
  background.fillColor = getBackgroundColor();
  buildStars();
  triangle.build(50);
};

var random = function (minimum, maximum) {
  return Math.round(Math.random() * (maximum - minimum) + minimum);
};

var map = function (n, start1, stop1, start2, stop2) {
  return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
};

var Triangle = function (a) {
  this.build(a);
};

Triangle.prototype.build = function (a) {
  var segments = [new paper.Point(0, -a / SQRT_3),
    new paper.Point(-a / 2, a * 0.5 / SQRT_3),
    new paper.Point(a / 2, a * 0.5 / SQRT_3)
  ];

  this.flameSize = a / SQRT_3;
  var flameSegments = [new paper.Point(0, this.flameSize),
    new paper.Point(-a / 3, a * 0.4 / SQRT_3),
    new paper.Point(a / 3, a * 0.4 / SQRT_3)
  ];

  this.group = new Group({
    children: [],
    position: view.center
  });

  this.triangle = new Path({
    segments: segments,
    fillColor: '#ff6b6b',
    strokeColor: '#ff6b6b',
    strokeWidth: 2
  });
  
  this.innerTriangle = new Path({
    segments: segments.map(function(p) { return p.multiply(0.6); }),
    fillColor: '#ff8787',
    strokeColor: '#ff8787',
    strokeWidth: 1
  });
  
  this.flame = new Path({
    segments: flameSegments,
    fillColor: '#ffd93d',
    opacity: 0.8
  });
  
  this.group.addChild(this.triangle);
  this.group.addChild(this.innerTriangle);
  this.group.addChild(this.flame);
  
  this.targetAngle = 0;
};

Triangle.prototype.update = function () {
  this.group.position = this.group.position.add((position.subtract(this.group.position).divide(8)));
  
  var angleDiff = this.targetAngle - this.group.rotation;
  while (angleDiff > 180) angleDiff -= 360;
  while (angleDiff < -180) angleDiff += 360;
  this.group.rotation += angleDiff / 10;
};

Triangle.prototype.rotate = function () {
  var vector = mousePos.subtract(this.group.position);
  this.targetAngle = vector.angle;
};

window.onmousemove = function (event) {
  if (!event) return;
  mousePos.x = event.x;
  mousePos.y = event.y;
  triangle.rotate();
};

var buildStars = function () {
  var path = new Path.Circle({
    center: [0, 0],
    radius: 3,
    fillColor: 'white',
    strokeColor: 'white'
  });

  var symbol = new Symbol(path);

  for (var i = 0; i < count; i++) {
    var center = Point.random().multiply(paper.view.size);
    var placed = symbol.place(center);
    placed.scale(i / count + 0.01);
    placed.data = {
      vector: new Point({
        angle: Math.random() * 360,
        length: (i / count) * Math.random() /5
      })
    };
  }
};

var keepInView = function (item) {
  var position = item.position;
  var viewBounds = paper.view.bounds;
  if (position.isInside(viewBounds))
    return;
  var itemBounds = item.bounds;
  if (position.x > viewBounds.width + 5) {
    position.x = -item.bounds.width;
  }

  if (position.x < -itemBounds.width - 5) {
    position.x = viewBounds.width;
  }

  if (position.y > viewBounds.height + 5) {
    position.y = -itemBounds.height;
  }

  if (position.y < -itemBounds.height - 5) {
    position.y = viewBounds.height
  }
};

var moveStars = function (vector) {
  var layer = project.activeLayer;
  for (var i = 1; i < count + 1; i++) {
    var item = layer.children[i];
    var size = item.bounds.size;
    var length = vector.length / 10 * size.width / 10;
    item.position = item.position.add(vector.normalize(length).add(item.data.vector));
    keepInView(item);
  }
};