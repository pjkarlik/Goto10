// Inspired by C64 10 PRINT
// @see http://trope-tank.mit.edu/10_PRINT_121114.pdf
//
// Mouse Functions //
class Mouse {
  constructor(element) {
    this.element = element || window;
    this.x = ~~(document.documentElement.clientWidth, window.innerWidth || 0) / 2;
    this.y = ~~(document.documentElement.clientWidth, window.innerWidth || 0) / 2;
    this.pointer = this.pointer.bind(this);
    this.getCoordinates = this.getCoordinates.bind(this);
    this.events = ['mouseenter', 'mousemove'];
    this.events.forEach((eventName) => {
      this.element.addEventListener(eventName, this.getCoordinates);
    });
  }
  getCoordinates(event) {
    event.preventDefault();
    const x = event.pageX;
    const y = event.pageY;
    this.x = x;
    this.y = y;
  }
  pointer() {
    return {
      x: this.x,
      y: this.y,
    };
  }
}
// Math Util //
function fastfloor(x) {
  return x << 0;
}
// Point Class //
class Point {
  constructor(obj) {
    this.x = obj.x;
    this.y = obj.y;
    this.vx = this.x;
    this.vy = this.y;
    this.size = obj.size;
    this.originalSize = this.size;
    this.radius = obj.radius;
    this.diag = obj.diag;
    this.index = obj.index;
    this.hue = obj.hue;
    this.color = `hsl(${this.hue}, 100%, 50%)`;
    this.mouse = new Mouse();
    this.integrate = this.integrate.bind(this);
  }

  integrate() {
    const point = this.getVector();
    const damp = this.size * 0.025;
    const distance = this.distance();
    this.vx = this.x - (point.x * damp) * ((this.radius - distance) / 125);
    this.vy = this.y - (point.y * damp) * ((this.radius - distance) / 125);
  }

  getPoints() {
    return {
      index: this.index,
      color: this.color,
      x: this.vx,
      y: this.vy,
    };
  }

  getVector() {
    const mouse = this.mouse;
    const points = mouse.pointer();
    const deg = {
      y: points.y - this.y,
      x: points.x - this.x,
    };
    return deg;
  }

  distance() {
    const mouse = this.mouse;
    const points = mouse.pointer();
    return Math.floor(
      Math.sqrt(
        Math.pow(points.x - (this.x + (this.size / 2)), 2) +
        Math.pow(points.y - (this.y + (this.size / 2)), 2)
      )
    ) - Math.round(this.size / 2);
  }

  update() {
    this.hue += 1;
    if (this.hue > 360) {
      this.hue = 0;
    }
    this.color = `hsl(${this.hue}, 100%, 50%)`;
    this.integrate();
  }
}
// Render Class //
export default class Render {
  constructor(element) {
    // Screen Set Up //
    this.element = element;
    this.grid = 25;
    this.lineThickness = 2;
    this.points = [];
    // render const //
    this.canvas = this.createCanvas('canvas');
    this.width = fastfloor(document.documentElement.clientWidth, window.innerWidth || 0);
    this.height = fastfloor(document.documentElement.clientHeight, window.innerHeight || 0);
    this.rows = fastfloor(this.width / this.grid);
    this.cols = fastfloor(this.height / this.grid);
    // bind functions //
    this.createPoints = this.createPoints.bind(this);
    this.getViewport = this.getViewport.bind(this);
    this.setViewport = this.setViewport.bind(this);
    this.resetCanvas = this.resetCanvas.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
    this.createPoints();
    this.renderLoop();
    window.addEventListener('resize', this.resetCanvas);
  }

  getViewport() {
    const width = ~~(document.documentElement.clientWidth, window.innerWidth || 0);
    const height = ~~(document.documentElement.clientHeight, window.innerHeight || 0);
    this.width = width;
    this.height = height;
    return {
      width,
      height,
    };
  }

  setViewport(element) {
    const canvasElement = element;
    const viewPort = this.getViewport();
    canvasElement.width = viewPort.width;
    canvasElement.height = viewPort.height;
  }

  createCanvas(name) {
    const canvasElement = document.createElement('canvas');
    canvasElement.id = name;
    this.setViewport(canvasElement);
    this.surface = canvasElement.getContext('2d');
    this.surface.scale(1, 1);
    this.element.appendChild(canvasElement);
    return canvasElement;
  }

  resetCanvas() {
    window.cancelAnimationFrame(this.animation);
    this.setViewport(this.canvas);
    this.rows = fastfloor(this.width / this.grid);
    this.cols = fastfloor(this.height / this.grid);
    this.points = [];
    this.createPoints();
    this.renderLoop();
  }

  createPoints() {
    for (let y = 0; y < this.cols; y++) {
      for (let x = 0; x < this.rows; x++) {
        const point = new Point({
          x: (this.grid / 2) + x * this.grid,
          y: (this.grid / 2) + y * this.grid,
          hue: y * (360 / this.cols),
          size: 3,
          radius: 210,
          index: {
            x,
            y,
          },
          diag: Math.round(Math.random() * 1),
        });
        this.points.push(point);
      }
    }
  }

  drawLine(point1, point2) {
    this.surface.beginPath();
    this.surface.strokeStyle = point1.color;
    this.surface.lineWidth = this.lineThickness;
    this.surface.moveTo(point1.x, point1.y);
    this.surface.lineTo(point2.x, point2.y);
    this.surface.stroke();
  }

  connectPoints(x) {
    const basePoint = this.points[x];
    const { diag } = basePoint;
    if (basePoint.index.x > -1 && basePoint.index.x < this.rows - 1) {
      const point1 = diag === 1 ? this.points[x] : this.points[x + (this.rows)];
      const point2 = diag === 1 ? this.points[x + (this.rows + 1)] : this.points[x + 1];
      this.drawLine(point1.getPoints(), point2.getPoints());
    }
  }

  renderLoop() {
    this.surface.clearRect(0, 0, this.width, this.height);
    for (let x = 0; x < this.points.length; x++) {
      const point = this.points[x];
      point.update();
      if (x < this.points.length - this.rows) {
        this.connectPoints(x);
      }
    }
    this.animation = window.requestAnimationFrame(this.renderLoop);
  }
}
