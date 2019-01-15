// Inspired by C64 10 PRINT
// @see http://trope-tank.mit.edu/10_PRINT_121114.pdf
//
// Math Util //
function fastfloor(x) {
  return x << 0;
}
// Point Class //
class Point {
  constructor(obj) {
    this.x = obj.x;
    this.y = obj.y;
    this.diag = obj.diag;
    this.index = obj.index;
    this.hue = obj.hue;
    this.color = `hsl(${this.hue}, 100%, 50%)`;
  }

  update() {
    this.hue += 1;
    if (this.hue > 360) {
      this.hue = 0;
    }
    this.color = `hsl(${this.hue}, 100%, 50%)`;
  }
}
// Render Class //
export default class Render {
  constructor(element) {
    // Screen Set Up //
    this.element = element;
    this.grid = 10;
    this.points = [];
    this.canvas = this.createCanvas('canvas');
    this.rows = fastfloor(this.width / this.grid);
    this.cols = fastfloor(this.height / this.grid);
    // Bind Stuff //
    this.renderLoop = this.renderLoop.bind(this);
    this.drawLine = this.drawLine.bind(this);
    this.getViewport = this.getViewport.bind(this);
    this.setViewport = this.setViewport.bind(this);
    this.resetCanvas = this.resetCanvas.bind(this);
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
          hue: y * (80 / this.cols),
          index: { x, y },
          diag: Math.round(Math.random() * 1),
        });
        this.points.push(point);
      }
    }
  }

  drawLine(point1, point2) {
    this.surface.beginPath();
    this.surface.strokeStyle = point1.color;
    this.surface.lineWidth = 3;
    this.surface.lineCap = 'square';
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
      this.drawLine(point1, point2);
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
