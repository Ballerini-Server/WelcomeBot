import seedrandom from 'seedrandom'

export class Signature {

  constructor(seed) {
    this.random = seedrandom(seed)
  }

  rand() {
    return this.random()
  }

  ranged(min, max) {
    return Math.floor(this.rand() * max - min + 1) + min
  }

  max(max) {
    return this.ranged(0, max)
  }

  check(percent) {
    return this.max(100) >= percent
  }

  rangedOut(min, max) {
    return Math.floor(this.rand() * max - min) + min
  }

  maxedOut(max) {
    return this.rangedOut(0, max)
  }

}