export class Vector {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  clone(): Vector {
    return new Vector(this.x, this.y);
  }

  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y);
  }

  sub(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y);
  }

  scale(s: number): Vector {
    return new Vector(this.x * s, this.y * s);
  }

  dot(v: Vector): number {
    return this.x * v.x + this.y * v.y;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vector {
    const len = this.length();
    if (len === 0) return new Vector(0, 0);
    return new Vector(this.x / len, this.y / len);
  }

  limit(max: number): Vector {
    const len = this.length();
    if (len <= max) return this.clone();
    return this.normalize().scale(max);
  }

  perp(): Vector {
    return new Vector(-this.y, this.x);
  }

  distanceTo(v: Vector): number {
    return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
  }

  distanceToSq(v: Vector): number {
    return (this.x - v.x) ** 2 + (this.y - v.y) ** 2;
  }

  static from(obj: { x: number; y: number }): Vector {
    return new Vector(obj.x, obj.y);
  }
}
