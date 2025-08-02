import { updateCollisionObjects, type CollisionObject } from "./collisionObject";
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
  colliderName: "circle",
  resolverName: "bouncy",
  collisionEnabled: true,
  position: new Vector(700, 500),
  velocity: new Vector(0, 0),
  radius: 10,
};

const staticProjectile: CollisionObject = {
  colliderName: "circle",
  resolverName: "static",
  collisionEnabled: true,
  position: new Vector(300, 400),
  velocity: new Vector(0, 0),
  radius: 25,
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
  colliderName: "rectangle",
  resolverName: "static",
  collisionEnabled: true,
  pos: new Vector(600, 300),
  width: 300,
  height: 100,
  color: "#ffaa00",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,
};

const groundCollisionRectangle: CollisionObject = {
  colliderName: "rectangle",
  resolverName: "static",
  collisionEnabled: true,
  pos: new Vector(0, 0),
  width: 2000,
  height: 50,
  color: "#666666",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,
};

const leftWallCollisionRectangle: CollisionObject = {
  colliderName: "rectangle",
  resolverName: "static",
  collisionEnabled: true,
  pos: new Vector(0, 0),
  width: 50,
  height: 2000,
  color: "#666666",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,
};

const rightWallCollisionRectangle: CollisionObject = {
  colliderName: "rectangle",
  resolverName: "static",
  collisionEnabled: true,
  pos: new Vector(canvas.width - 50, 0),
  width: 50,
  height: 2000,
  color: "#666666",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,
};

const collisionObjects = [projectile, staticProjectile, rectangleObject, groundCollisionRectangle, leftWallCollisionRectangle, rightWallCollisionRectangle];


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
  updateCollisionObjects(collisionObjects);

  requestAnimationFrame(draw);
}

draw();
