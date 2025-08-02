import { Vector } from "./vector";


export type CollisionObject = {
  collisionEnabled?: boolean;
  getNormals: (other: CollisionObject) => Vector[];
  getClosestPoint: (point: Vector) => Vector;
  calculateProjection: (normal: Vector) => { min: number; max: number };
  handleCollision: (overlapAmount: number, overlapNormal: Vector) => void;
  [key: string]: any;
}

export const collisionObjects: CollisionObject[] = [];
export const registerCollisionObject = (obj: CollisionObject) => {
  collisionObjects.push(obj);
}
export const unregisterCollisionObject = (obj: CollisionObject) => {
  const index = collisionObjects.indexOf(obj);
  if (index !== -1) {
    collisionObjects.splice(index, 1);
  }
};

// don't worry I am aware how horrifically unoptimized this is currently only for a small example
export const updateCollisionObjects = () => {
  for (let i = 0; i < collisionObjects.length; i++) {
    const objA = collisionObjects[i];
    if(!objA.collisionEnabled) continue
    for (let j = i + 1; j < collisionObjects.length; j++) {
      const objB = collisionObjects[j];
      if(!objB.collisionEnabled) continue

      const normals = [...objA.getNormals(objB), ...objB.getNormals(objA)];

      let minOverlap = Infinity;
      let smallestNormal: Vector | null = null;
      let direction: number = 1;

      for (const normal of normals) {
        const n = normal.normalize();
        const projA = objA.calculateProjection(n);
        const projB = objB.calculateProjection(n);

        const overlapA = projB.max - projA.min;
        const overlapB = projA.max - projB.min;

        if (overlapA <= 0 || overlapB <= 0) {
          minOverlap = 0;
          smallestNormal = null;
          break;
        }

        let currentOverlap: number;
        let currentDirection: number;

        if (overlapA < overlapB) {
          currentOverlap = overlapA;
          currentDirection = 1;
        } else {
          currentOverlap = overlapB;
          currentDirection = -1;
        }

        if (currentOverlap < minOverlap) {
          minOverlap = currentOverlap;
          smallestNormal = n;
          direction = currentDirection;
        }
      }

      if (smallestNormal && minOverlap > 0 && minOverlap < Infinity) {
        objA.handleCollision(
          minOverlap * direction,
          smallestNormal
        );

        objB.handleCollision(
          minOverlap * -direction,
          smallestNormal
        );
      }
    }
  }
}


/* CollisionObject Examples */
const staticRectangleObject: CollisionObject = {
  collisionEnabled: true,
  position: new Vector(600, 300),
  width: 300,
  height: 100,
  color: "#ffaa00",
  isColliding: false,
  velocity: new Vector(0, 0),
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

const bouncyCircleObject: CollisionObject = {
  collisionEnabled: true,
  position: new Vector(700, 500),
  velocity: new Vector(0, 0),
  radius: 10,
  getNormals(other: CollisionObject) {
    const closestPoint = other.getClosestPoint(this.position);
    const direction = closestPoint.sub(this.position);
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