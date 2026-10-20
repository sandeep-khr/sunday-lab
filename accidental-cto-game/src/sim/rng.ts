export class Rng {
  private s: number

  constructor(seed: number) {
    this.s = seed >>> 0 || 0x9e3779b9
  }

  next(): number {
    let x = this.s
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.s = x >>> 0
    return this.s / 0xffffffff
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }
}
