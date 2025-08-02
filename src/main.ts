import { registerCollisionObject, updateCollisionObjects, type CollisionObject } from "./collisionObject";
import "./style.css";
import { Vector } from "./vector";

const app = document.querySelector<HTMLDivElement>("#app")!;

const canvas = document.createElement("canvas");
canvas.id = "canvas";
app.appendChild(canvas);

const context = canvas.getContext("2d")!;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);

const projectile: CollisionObject = {
  collisionEnabled: true,
  position: new Vector(700, 500),
  velocity: new Vector(0, 0),
  radius: 10,
  getNormals: (other: CollisionObject) => {
    const closestPoint = other.getClosestPoint(projectile.position);
    const direction = closestPoint.sub(projectile.position);
    if (direction.length() > 0) {
      return [direction.normalize()];
    }
    return [];
  },
  getClosestPoint: function (point: Vector) {
    const direction = point.sub(this.position);
    if (direction.length() <= this.radius) {
      return point;
    }
    return this.position.add(direction.normalize().scale(this.radius));
  },
  calculateProjection(normal: Vector) {
    const projection = this.position.dot(normal);
    return { min: projection - this.radius, max: projection + this.radius };
  },
  handleCollision(overlapAmount: number, overlapNormal: Vector) {
    this.position = this.position.add(
      overlapNormal.normalize().scale(overlapAmount)
    );

    const n = overlapNormal.normalize();
    const vDotN = this.velocity.dot(n);
    const COLLISION_DAMPING = 0.7;

    this.velocity = this.velocity.sub(
      n.scale((1 + COLLISION_DAMPING) * vDotN)
    );

    const tangent = new Vector(-n.y, n.x);
    const vDotT = this.velocity.dot(tangent);
    const FRICTION = 0.2;
    this.velocity = this.velocity.sub(
      tangent.scale(vDotT * FRICTION)
    );

    const VELOCITY_EPSILON_X = 10;
    const VELOCITY_EPSILON_Y = 40;
    let vx = this.velocity.x;
    let vy = this.velocity.y;
    if (Math.abs(vx) < VELOCITY_EPSILON_X) vx = 0;
    if (Math.abs(vy) < VELOCITY_EPSILON_Y) vy = 0;
    this.velocity = new Vector(vx, vy);
  },
};

const staticProjectile: CollisionObject = {
  collisionEnabled: true,
  position: new Vector(300, 400),
  velocity: new Vector(0, 0),
  radius: 25,
  getNormals(other: CollisionObject){
    const closestPoint = other.getClosestPoint(staticProjectile.position);
    const direction = closestPoint.sub(staticProjectile.position);
    if (direction.length() > 0) {
      return [direction.normalize()];
    }
    return [];
  },
  getClosestPoint(point: Vector) {
    const direction = point.sub(this.position);
    if (direction.length() <= this.radius) {
      return point;
    }
    return this.position.add(direction.normalize().scale(this.radius));
  },
  calculateProjection(normal: Vector) {
    const projection = this.position.dot(normal);
    return { min: projection - this.radius, max: projection + this.radius };
  },
  handleCollision(_overlapAmount: number, _overlapNormal: Vector) {
    // Empty collision handler - this projectile doesn't move
  },
};

let isDragging = false;
let dragOffset = new Vector(0, 0);

let lastMousePos = new Vector(0, 0);
let lastMoveTime = 0;

const DAMPING = 0.5;

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = canvas.height - (e.clientY - rect.top);
  const mouseVec = new Vector(mouseX, mouseY);
  const dist = mouseVec.sub(projectile.position).length();
  if (dist <= projectile.radius) {
    isDragging = true;
    dragOffset = projectile.position.sub(mouseVec);
    lastMousePos = mouseVec.clone();
    lastMoveTime = performance.now();
    projectile.velocity = new Vector(0, 0);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = canvas.height - (e.clientY - rect.top);
    const mouseVec = new Vector(mouseX, mouseY);
    const now = performance.now();
    const dt = (now - lastMoveTime) / 1000;
    if (dt > 0) {
      const targetVel = mouseVec.sub(lastMousePos).scale(1 / dt);
      const SMOOTHING = 0.2;
      projectile.velocity = projectile.velocity
        .scale(1 - SMOOTHING)
        .add(targetVel.scale(SMOOTHING))
        .scale(DAMPING);
    }
    lastMousePos = mouseVec.clone();
    lastMoveTime = now;
    projectile.position = mouseVec.add(dragOffset);
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
});

canvas.addEventListener("mouseleave", () => {
  isDragging = false;
});

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") {
    rectangleObject.angle += 15;
  }
});

const rectangleObject: CollisionObject = {
  collisionEnabled: true,
  pos: new Vector(600, 300),
  width: 300,
  height: 100,
  color: "#ffaa00",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,

  getNormals: function (_other: CollisionObject) {
    const angleRad = (this.angle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    
    return [
      new Vector(cos, sin),
      new Vector(-sin, cos),
    
    ];
  },

  getClosestPoint: function (point: Vector) {
    const angleRad = (this.angle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const center = new Vector(
      this.pos.x + this.width / 2,
      this.pos.y + this.height / 2
    );
    const localPoint = point.sub(center);

    const rotatedX = localPoint.x * cos + localPoint.y * sin;
    const rotatedY = -localPoint.x * sin + localPoint.y * cos;

    const hw = this.width / 2;
    const hh = this.height / 2;
    const clampedX = Math.max(-hw, Math.min(hw, rotatedX));
    const clampedY = Math.max(-hh, Math.min(hh, rotatedY));

    const localClosest = new Vector(clampedX, clampedY);
    const unrotatedX = localClosest.x * cos - localClosest.y * sin;
    const unrotatedY = localClosest.x * sin + localClosest.y * cos;

    return center.add(new Vector(unrotatedX, unrotatedY));
  },

  calculateProjection: function (normal: Vector) {
    const hw = this.width / 2;
    const hh = this.height / 2;
    const angleRad = (this.angle * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    const cx = this.pos.x + hw;
    const cy = this.pos.y + hh;

    const corners = [
      new Vector(-hw, -hh),
      new Vector(hw, -hh),
      new Vector(hw, hh),
      new Vector(-hw, hh),
    ].map((corner) => {
      const x = corner.x * cos - corner.y * sin;
      const y = corner.x * sin + corner.y * cos;
      return new Vector(cx + x, cy + y);
    });

    const projections = corners.map((corner) => corner.dot(normal));
    return {
      min: Math.min(...projections),
      max: Math.max(...projections),
    };
  },

  handleCollision: function (_overlapAmount: number, _overlapNormal: Vector) {},
};

const groundCollisionRectangle: CollisionObject = {
  collisionEnabled: true,
  pos: new Vector(0, 0),
  width: 2000,
  height: 50,
  color: "#666666",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,

  getNormals: function (_other: CollisionObject) {
    return [
      new Vector(0, 1), // Top normal (pointing up)
      new Vector(1, 0), // Right normal
      new Vector(0, -1), // Bottom normal (pointing down)
      new Vector(-1, 0), // Left normal
    ];
  },

  getClosestPoint: function (point: Vector) {
    const center = new Vector(
      this.pos.x + this.width / 2,
      this.pos.y + this.height / 2
    );
    const localPoint = point.sub(center);

    const hw = this.width / 2;
    const hh = this.height / 2;
    const clampedX = Math.max(-hw, Math.min(hw, localPoint.x));
    const clampedY = Math.max(-hh, Math.min(hh, localPoint.y));

    return center.add(new Vector(clampedX, clampedY));
  },

  calculateProjection: function (normal: Vector) {
    const hw = this.width / 2;
    const hh = this.height / 2;
    const cx = this.pos.x + hw;
    const cy = this.pos.y + hh;

    const corners = [
      new Vector(cx - hw, cy - hh),
      new Vector(cx + hw, cy - hh),
      new Vector(cx + hw, cy + hh),
      new Vector(cx - hw, cy + hh),
    ];

    const projections = corners.map((corner) => corner.dot(normal));
    return {
      min: Math.min(...projections),
      max: Math.max(...projections),
    };
  },

  handleCollision: function (_overlapAmount: number, _overlapNormal: Vector) {},
};

const leftWallCollisionRectangle: CollisionObject = {
  collisionEnabled: true,
  pos: new Vector(0, 0),
  width: 50,
  height: 2000,
  color: "#666666",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,

  getNormals: function (_other: CollisionObject) {
    return [
      new Vector(0, 1), // Top normal (pointing up)
      new Vector(1, 0), // Right normal
      new Vector(0, -1), // Bottom normal (pointing down)
      new Vector(-1, 0), // Left normal
    ];
  },

  getClosestPoint: function (point: Vector) {
    const center = new Vector(
      this.pos.x + this.width / 2,
      this.pos.y + this.height / 2
    );
    const localPoint = point.sub(center);

    const hw = this.width / 2;
    const hh = this.height / 2;
    const clampedX = Math.max(-hw, Math.min(hw, localPoint.x));
    const clampedY = Math.max(-hh, Math.min(hh, localPoint.y));

    return center.add(new Vector(clampedX, clampedY));
  },

  calculateProjection: function (normal: Vector) {
    const hw = this.width / 2;
    const hh = this.height / 2;
    const cx = this.pos.x + hw;
    const cy = this.pos.y + hh;

    const corners = [
      new Vector(cx - hw, cy - hh),
      new Vector(cx + hw, cy - hh),
      new Vector(cx + hw, cy + hh),
      new Vector(cx - hw, cy + hh),
    ];

    const projections = corners.map((corner) => corner.dot(normal));
    return {
      min: Math.min(...projections),
      max: Math.max(...projections),
    };
  },

  handleCollision: function (_overlapAmount: number, _overlapNormal: Vector) {},
};

const rightWallCollisionRectangle: CollisionObject = {
  collisionEnabled: true,
  pos: new Vector(canvas.width - 50, 0),
  width: 50,
  height: 2000,
  color: "#666666",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,

  getNormals: function (_other: CollisionObject) {
    return [
      new Vector(0, 1), // Top normal (pointing up)
      new Vector(1, 0), // Right normal
      new Vector(0, -1), // Bottom normal (pointing down)
      new Vector(-1, 0), // Left normal
    ];
  },

  getClosestPoint: function (point: Vector) {
    const center = new Vector(
      this.pos.x + this.width / 2,
      this.pos.y + this.height / 2
    );
    const localPoint = point.sub(center);

    const hw = this.width / 2;
    const hh = this.height / 2;
    const clampedX = Math.max(-hw, Math.min(hw, localPoint.x));
    const clampedY = Math.max(-hh, Math.min(hh, localPoint.y));

    return center.add(new Vector(clampedX, clampedY));
  },

  calculateProjection: function (normal: Vector) {
    const hw = this.width / 2;
    const hh = this.height / 2;
    const cx = this.pos.x + hw;
    const cy = this.pos.y + hh;

    const corners = [
      new Vector(cx - hw, cy - hh),
      new Vector(cx + hw, cy - hh),
      new Vector(cx + hw, cy + hh),
      new Vector(cx - hw, cy + hh),
    ];

    const projections = corners.map((corner) => corner.dot(normal));
    return {
      min: Math.min(...projections),
      max: Math.max(...projections),
    };
  },

  handleCollision: function (_overlapAmount: number, _overlapNormal: Vector) {},
};

const collisionObjects = [projectile, staticProjectile, rectangleObject, groundCollisionRectangle, leftWallCollisionRectangle, rightWallCollisionRectangle];

collisionObjects.forEach(obj => registerCollisionObject(obj));

function draw() {
  context.save();

  context.translate(0, canvas.height);
  context.scale(1, -1);

  context.fillStyle = "#242424";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw green dotted line at y=800
  context.strokeStyle = "#00ff00";
  context.lineWidth = 2;
  context.setLineDash([10, 5]); // 10px dash, 5px gap
  context.beginPath();
  context.moveTo(0, 800);
  context.lineTo(canvas.width, 800);
  context.stroke();
  context.setLineDash([]); // Reset line dash

  context.fillStyle = "#ff6464";
  context.beginPath();
  context.arc(
    projectile.position.x,
    projectile.position.y,
    projectile.radius,
    0,
    Math.PI * 2
  );
  context.fill();

  context.fillStyle = "#646cff";
  context.beginPath();
  context.arc(
    staticProjectile.position.x,
    staticProjectile.position.y,
    staticProjectile.radius,
    0,
    Math.PI * 2
  );
  context.fill();

  context.strokeStyle = "#00ff00";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(projectile.position.x, projectile.position.y);
  const velocityScale = 0.05;
  context.lineTo(
    projectile.position.x + projectile.velocity.x * velocityScale,
    projectile.position.y + projectile.velocity.y * velocityScale
  );
  context.stroke();

  context.fillStyle = rectangleObject.color || "#4287f5";

  context.translate(
    rectangleObject.pos.x + rectangleObject.width / 2,
    rectangleObject.pos.y + rectangleObject.height / 2
  );
  context.rotate((rectangleObject.angle * Math.PI) / 180);

  context.fillRect(
    -rectangleObject.width / 2,
    -rectangleObject.height / 2,
    rectangleObject.width,
    rectangleObject.height
  );

  context.restore();

  // Draw ground collision rectangle
  context.save();
  context.translate(0, canvas.height);
  context.scale(1, -1);
  
  context.fillStyle = groundCollisionRectangle.color || "#666666";
  context.fillRect(
    groundCollisionRectangle.pos.x,
    groundCollisionRectangle.pos.y,
    groundCollisionRectangle.width,
    groundCollisionRectangle.height
  );
  
  context.restore();

  // Draw left wall collision rectangle
  context.save();
  context.translate(0, canvas.height);
  context.scale(1, -1);
  
  context.fillStyle = leftWallCollisionRectangle.color || "#666666";
  context.fillRect(
    leftWallCollisionRectangle.pos.x,
    leftWallCollisionRectangle.pos.y,
    leftWallCollisionRectangle.width,
    leftWallCollisionRectangle.height
  );
  
  context.restore();

  // Draw right wall collision rectangle
  context.save();
  context.translate(0, canvas.height);
  context.scale(1, -1);
  
  context.fillStyle = rightWallCollisionRectangle.color || "#666666";
  context.fillRect(
    rightWallCollisionRectangle.pos.x,
    rightWallCollisionRectangle.pos.y,
    rightWallCollisionRectangle.width,
    rightWallCollisionRectangle.height
  );
  
  context.restore();

  if (!isDragging) {
    projectile.position = projectile.position.add(projectile.velocity.scale(1 / 60));

    const GRAVITY = -500;
    projectile.velocity = projectile.velocity.add(new Vector(0, GRAVITY / 60));

    // Ground collision is now handled by the collision system
  }
  updateCollisionObjects();

  requestAnimationFrame(draw);
}

draw();
