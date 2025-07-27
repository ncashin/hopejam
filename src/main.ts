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

const projectile = {
  pos: new Vector(20, 20),
  vel: new Vector(0, 0),
  radius: 10,
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
  const dist = mouseVec.sub(projectile.pos).length();
  if (dist <= projectile.radius) {
    isDragging = true;
    dragOffset = projectile.pos.sub(mouseVec);
    lastMousePos = mouseVec.clone();
    lastMoveTime = performance.now();
    projectile.vel = new Vector(0, 0);
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
      projectile.vel = projectile.vel
        .scale(1 - SMOOTHING)
        .add(targetVel.scale(SMOOTHING))
        .scale(DAMPING);
    }
    lastMousePos = mouseVec.clone();
    lastMoveTime = now;
    projectile.pos = mouseVec.add(dragOffset);
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

const rectangleObject = {
  pos: new Vector(600, 300),
  width: 300,
  height: 100,
  color: "#ffaa00",
  isColliding: false,
  vel: new Vector(0, 0),
  angle: 0,
  angularVelocity: 0,
  static: true,
};

function draw() {
  context.save();

  context.translate(0, canvas.height);
  context.scale(1, -1);

  context.fillStyle = "#242424";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#646cff";
  context.beginPath();
  context.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ff6464";
  context.beginPath();
  context.arc(
    projectile.pos.x,
    projectile.pos.y,
    projectile.radius,
    0,
    Math.PI * 2
  );
  context.fill();

  context.strokeStyle = "#00ff00";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(projectile.pos.x, projectile.pos.y);
  const velocityScale = 0.05;
  context.lineTo(
    projectile.pos.x + projectile.vel.x * velocityScale,
    projectile.pos.y + projectile.vel.y * velocityScale
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

  if (!isDragging) {
    projectile.pos = projectile.pos.add(projectile.vel.scale(1 / 60));
    const gravity = -500;
    projectile.vel = projectile.vel.add(new Vector(0, gravity * (1 / 60)));
    if (projectile.pos.y < projectile.radius) {
      projectile.pos.y = projectile.radius;
      if (projectile.vel.y < 0) {
        projectile.vel.y = -projectile.vel.y * 0.5;
      }
      projectile.vel.x *= DAMPING;
    }
  }

  if (!isDragging) {
    const cx = rectangleObject.pos.x + rectangleObject.width / 2;
    const cy = rectangleObject.pos.y + rectangleObject.height / 2;
    const angleRad = (rectangleObject.angle * Math.PI) / 180;
    const hw = rectangleObject.width / 2;
    const hh = rectangleObject.height / 2;
    const ux = Math.cos(angleRad);
    const uy = Math.sin(angleRad);
    const firstNormal = new Vector(-uy, ux).normalize();
    const secondNormal = new Vector(ux, uy).normalize();

    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];

    const worldCorners = corners.map((corner) => {
      const rx = corner.x * ux - corner.y * uy;
      const ry = corner.x * uy + corner.y * ux;
      return new Vector(cx + rx, cy + ry);
    });

    let closestCorner = null;
    let minDistSq = Infinity;
    for (const corner of worldCorners) {
      const distSq = Vector.from(projectile.pos).distanceToSq(
        Vector.from(corner)
      );
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closestCorner = corner;
      }
    }

    let vectorToCorner = new Vector();
    if (closestCorner) {
      vectorToCorner = Vector.from(closestCorner).sub(projectile.pos);
    }
    vectorToCorner.normalize();

    function getMinMaxProjection(
      points: Vector[],
      axis: Vector
    ): { min: number; max: number } {
      const projections = points.map((point) => Vector.from(point).dot(axis));
      const min = Math.min(...projections);
      const max = Math.max(...projections);
      return { min, max };
    }

    function checkOverlapOnNormals(
      normals: Vector[],
      worldCorners: Vector[],
      projectile: { pos: Vector; radius: number }
    ) {
      let minOverlap = Infinity;
      let minOverlapVector: Vector | null = null;

      for (const normal of normals) {
        const { min: minProjRect, max: maxProjRect } = getMinMaxProjection(
          worldCorners,
          normal
        );
        const projProjectile = projectile.pos.dot(normal);
        const minProjProjectile = projProjectile - projectile.radius;
        const maxProjProjectile = projProjectile + projectile.radius;

        const overlap =
          maxProjRect >= minProjProjectile && minProjRect <= maxProjProjectile;
        if (!overlap) {
          return { minOverlap: 0, minOverlapVector: null };
        }

        const pushOutPos = maxProjRect - minProjProjectile;
        const pushOutNeg = minProjRect - maxProjProjectile;

        let overlapAmount: number;
        let overlapVector: Vector;

        if (Math.abs(pushOutPos) < Math.abs(pushOutNeg)) {
          overlapAmount = pushOutPos;
          overlapVector = normal;
        } else {
          overlapAmount = -pushOutNeg;
          overlapVector = normal.scale(-1);
        }

        if (overlapAmount < minOverlap) {
          minOverlap = overlapAmount;
          minOverlapVector = overlapVector;
        }
      }
      return { minOverlap, minOverlapVector };
    }
    const { minOverlap, minOverlapVector } = checkOverlapOnNormals(
      [firstNormal, secondNormal, vectorToCorner],
      worldCorners,
      projectile
    );
    if (minOverlapVector && minOverlap > 0) {
      projectile.pos = projectile.pos.add(
        minOverlapVector.normalize().scale(minOverlap)
      );

      const n = minOverlapVector.normalize();
      const t = new Vector(-n.y, n.x);

      const vDotN = projectile.vel.dot(n);
      const vDotT = projectile.vel.dot(t);

      const restitution = 0.8;
      const friction = 0.05;

      const vNormal = n.scale(-vDotN * restitution * DAMPING);

      let frictionFactor = 1 - friction;
      if (Math.abs(vDotN) < 10) {
        frictionFactor = 1 - friction * 4;
      }
      const vTangent = t.scale(vDotT * frictionFactor);

      projectile.vel = vNormal.add(vTangent);

      if (projectile.vel.length() < 2) {
        projectile.vel = new Vector(0, 0);
      }
    }
  }

  requestAnimationFrame(draw);
}

draw();
