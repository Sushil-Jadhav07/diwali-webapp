import * as THREE from 'three'

// ---------------------------------------------------------------------------
// FX engine: fixed-capacity, allocation-free particle pools + pooled lights.
// Sparks render as additive streaks (LineSegments head->tail) plus a glowing
// point sprite at the head. Smoke renders as soft normal-blended points.
// All buffers are allocated once; emit() writes into a ring buffer.
// ---------------------------------------------------------------------------

export const MAX_SPARKS = 7000
export const MAX_SMOKE = 700
export const LIGHT_POOL = 3

const GRAVITY = -9.8

const glowVert = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
uniform float uScale;
varying vec3 vColor;
void main() {
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`

const glowFrag = /* glsl */ `
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = exp(-d * d * 4.0);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a, 1.0);
}`

const smokeVert = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
uniform float uScale;
varying float vAlpha;
void main() {
  vAlpha = aAlpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`

const smokeFrag = /* glsl */ `
uniform vec3 uTint;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = smoothstep(1.0, 0.0, d);
  a *= a * vAlpha;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uTint, a);
}`

class SparkPool {
  constructor(n) {
    this.n = n
    this.cursor = 0
    this.alive = 0
    this.pos = new Float32Array(n * 3)
    this.vel = new Float32Array(n * 3)
    this.col = new Float32Array(n * 3)
    this.life = new Float32Array(n)
    this.maxLife = new Float32Array(n)
    this.drag = new Float32Array(n)
    this.grav = new Float32Array(n)
    this.size = new Float32Array(n)
    this.trail = new Float32Array(n)
    this.twinkle = new Float32Array(n)

    // streak geometry: 2 verts per spark
    this.linePos = new Float32Array(n * 6)
    this.lineCol = new Float32Array(n * 6)
    const lg = new THREE.BufferGeometry()
    this.linePosAttr = new THREE.BufferAttribute(this.linePos, 3).setUsage(THREE.DynamicDrawUsage)
    this.lineColAttr = new THREE.BufferAttribute(this.lineCol, 3).setUsage(THREE.DynamicDrawUsage)
    lg.setAttribute('position', this.linePosAttr)
    lg.setAttribute('color', this.lineColAttr)
    lg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
    this.lines = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    )
    this.lines.frustumCulled = false
    this.lines.renderOrder = 5

    // head glow points
    this.ptPos = new Float32Array(n * 3)
    this.ptCol = new Float32Array(n * 3)
    this.ptSize = new Float32Array(n)
    const pg = new THREE.BufferGeometry()
    this.ptPosAttr = new THREE.BufferAttribute(this.ptPos, 3).setUsage(THREE.DynamicDrawUsage)
    this.ptColAttr = new THREE.BufferAttribute(this.ptCol, 3).setUsage(THREE.DynamicDrawUsage)
    this.ptSizeAttr = new THREE.BufferAttribute(this.ptSize, 1).setUsage(THREE.DynamicDrawUsage)
    pg.setAttribute('position', this.ptPosAttr)
    pg.setAttribute('aColor', this.ptColAttr)
    pg.setAttribute('aSize', this.ptSizeAttr)
    pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
    this.uniforms = { uScale: { value: 400 } }
    this.points = new THREE.Points(
      pg,
      new THREE.ShaderMaterial({
        vertexShader: glowVert,
        fragmentShader: glowFrag,
        uniforms: this.uniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    this.points.frustumCulled = false
    this.points.renderOrder = 6
  }

  // r,g,b may exceed 1 for bloom. trail = streak length in seconds of velocity.
  emit(x, y, z, vx, vy, vz, life, r, g, b, size = 0.06, drag = 0.6, grav = 1, trail = 0.04, twinkle = 0) {
    const i = this.cursor
    this.cursor = (i + 1) % this.n
    const i3 = i * 3
    this.pos[i3] = x
    this.pos[i3 + 1] = y
    this.pos[i3 + 2] = z
    this.vel[i3] = vx
    this.vel[i3 + 1] = vy
    this.vel[i3 + 2] = vz
    this.col[i3] = r
    this.col[i3 + 1] = g
    this.col[i3 + 2] = b
    this.life[i] = life
    this.maxLife[i] = life
    this.drag[i] = drag
    this.grav[i] = grav
    this.size[i] = size
    this.trail[i] = trail
    this.twinkle[i] = twinkle
  }

  update(dt, time) {
    const { pos, vel, col, life, maxLife, drag, grav, size, trail, twinkle, linePos, lineCol, ptPos, ptCol, ptSize } = this
    let alive = 0
    for (let i = 0; i < this.n; i++) {
      const i3 = i * 3
      const i6 = i * 6
      if (life[i] <= 0) {
        if (ptSize[i] !== 0) {
          ptSize[i] = 0
          lineCol[i6] = lineCol[i6 + 1] = lineCol[i6 + 2] = 0
          lineCol[i6 + 3] = lineCol[i6 + 4] = lineCol[i6 + 5] = 0
          linePos[i6] = linePos[i6 + 3] = 0
          linePos[i6 + 1] = linePos[i6 + 4] = -50
          linePos[i6 + 2] = linePos[i6 + 5] = 0
        }
        continue
      }
      alive++
      life[i] -= dt
      const k = Math.exp(-drag[i] * dt)
      let vx = vel[i3] * k
      let vy = vel[i3 + 1] * k + GRAVITY * grav[i] * dt
      let vz = vel[i3 + 2] * k
      let x = pos[i3] + vx * dt
      let y = pos[i3 + 1] + vy * dt
      let z = pos[i3 + 2] + vz * dt
      if (y < 0.01) {
        // bounce and skid on the ground
        y = 0.01
        vy = -vy * 0.28
        vx *= 0.6
        vz *= 0.6
      }
      vel[i3] = vx
      vel[i3 + 1] = vy
      vel[i3 + 2] = vz
      pos[i3] = x
      pos[i3 + 1] = y
      pos[i3 + 2] = z

      const t = Math.max(0, life[i] / maxLife[i]) // 1 -> 0
      const age = maxLife[i] - life[i]
      let bright = t * t * (3 - 2 * t)
      const hot = age < 0.12 ? 1 - age / 0.12 : 0 // white-hot at birth
      if (twinkle[i] > 0) {
        const s = Math.sin(time * 45 + i * 12.9898)
        bright *= s > 0.2 ? 1.6 : 0.15
      }
      const r = (col[i3] + hot * 2) * bright
      const g = (col[i3 + 1] + hot * 2) * bright
      const b = (col[i3 + 2] + hot * 2) * bright

      const tl = trail[i]
      linePos[i6] = x
      linePos[i6 + 1] = y
      linePos[i6 + 2] = z
      linePos[i6 + 3] = x - vx * tl
      linePos[i6 + 4] = y - vy * tl
      linePos[i6 + 5] = z - vz * tl
      lineCol[i6] = r
      lineCol[i6 + 1] = g
      lineCol[i6 + 2] = b
      lineCol[i6 + 3] = 0
      lineCol[i6 + 4] = 0
      lineCol[i6 + 5] = 0

      ptPos[i3] = x
      ptPos[i3 + 1] = y
      ptPos[i3 + 2] = z
      ptCol[i3] = r * 0.55
      ptCol[i3 + 1] = g * 0.55
      ptCol[i3 + 2] = b * 0.55
      ptSize[i] = size[i] * (0.4 + 0.6 * t)
    }
    this.alive = alive
    this.linePosAttr.needsUpdate = true
    this.lineColAttr.needsUpdate = true
    this.ptPosAttr.needsUpdate = true
    this.ptColAttr.needsUpdate = true
    this.ptSizeAttr.needsUpdate = true
  }

  clear() {
    this.life.fill(0)
  }
}

class SmokePool {
  constructor(n) {
    this.n = n
    this.cursor = 0
    this.pos = new Float32Array(n * 3)
    this.vel = new Float32Array(n * 3)
    this.life = new Float32Array(n)
    this.maxLife = new Float32Array(n)
    this.size0 = new Float32Array(n)
    this.grow = new Float32Array(n)
    this.alpha0 = new Float32Array(n)
    this.sz = new Float32Array(n)
    this.al = new Float32Array(n)
    const g = new THREE.BufferGeometry()
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)
    this.szAttr = new THREE.BufferAttribute(this.sz, 1).setUsage(THREE.DynamicDrawUsage)
    this.alAttr = new THREE.BufferAttribute(this.al, 1).setUsage(THREE.DynamicDrawUsage)
    g.setAttribute('position', this.posAttr)
    g.setAttribute('aSize', this.szAttr)
    g.setAttribute('aAlpha', this.alAttr)
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
    this.uniforms = { uScale: { value: 400 }, uTint: { value: new THREE.Color(0.32, 0.3, 0.36) } }
    this.points = new THREE.Points(
      g,
      new THREE.ShaderMaterial({
        vertexShader: smokeVert,
        fragmentShader: smokeFrag,
        uniforms: this.uniforms,
        transparent: true,
        depthWrite: false,
      }),
    )
    this.points.frustumCulled = false
    this.points.renderOrder = 4
  }

  emit(x, y, z, vx, vy, vz, life, size = 0.5, grow = 1.2, alpha = 0.35) {
    const i = this.cursor
    this.cursor = (i + 1) % this.n
    const i3 = i * 3
    this.pos[i3] = x
    this.pos[i3 + 1] = y
    this.pos[i3 + 2] = z
    this.vel[i3] = vx
    this.vel[i3 + 1] = vy
    this.vel[i3 + 2] = vz
    this.life[i] = life
    this.maxLife[i] = life
    this.size0[i] = size
    this.grow[i] = grow
    this.alpha0[i] = alpha
  }

  update(dt) {
    const { pos, vel, life, maxLife, size0, grow, alpha0, sz, al } = this
    for (let i = 0; i < this.n; i++) {
      if (life[i] <= 0) {
        al[i] = 0
        continue
      }
      life[i] -= dt
      const i3 = i * 3
      const k = Math.exp(-1.2 * dt)
      vel[i3] = vel[i3] * k + 0.25 * dt // light breeze
      vel[i3 + 1] = vel[i3 + 1] * k + 0.35 * dt // buoyancy
      vel[i3 + 2] = vel[i3 + 2] * k
      pos[i3] += vel[i3] * dt
      pos[i3 + 1] += vel[i3 + 1] * dt
      pos[i3 + 2] += vel[i3 + 2] * dt
      const age = 1 - Math.max(0, life[i] / maxLife[i])
      sz[i] = size0[i] * (1 + grow[i] * age * 3)
      const fadeIn = Math.min(1, age * 8)
      al[i] = alpha0[i] * fadeIn * (1 - age) * (1 - age)
    }
    this.posAttr.needsUpdate = true
    this.szAttr.needsUpdate = true
    this.alAttr.needsUpdate = true
  }

  clear() {
    this.life.fill(0)
  }
}

// Pooled dynamic lights. They always exist (intensity 0 when free) so the
// light count never changes and materials never recompile.
class LightPool {
  constructor(n) {
    this.lights = []
    this.owners = []
    this.fades = [] // { rate } for fire-and-forget burst lights
    for (let i = 0; i < n; i++) {
      const l = new THREE.PointLight('#ffb050', 0, 30, 1.6)
      l.position.set(0, -100, 0)
      this.lights.push(l)
      this.owners.push(null)
      this.fades.push(0)
    }
  }

  acquire(owner) {
    let best = -1
    for (let i = 0; i < this.lights.length; i++) {
      if (this.owners[i] === null) {
        best = i
        break
      }
    }
    if (best < 0) {
      // steal the dimmest fading light
      let lo = Infinity
      for (let i = 0; i < this.lights.length; i++) {
        if (this.owners[i] === 'burst' && this.lights[i].intensity < lo) {
          lo = this.lights[i].intensity
          best = i
        }
      }
    }
    if (best < 0) return null
    this.owners[best] = owner
    this.fades[best] = 0
    return this.lights[best]
  }

  release(light) {
    const i = this.lights.indexOf(light)
    if (i < 0) return
    this.owners[i] = null
    light.intensity = 0
    light.position.set(0, -100, 0)
  }

  burst(x, y, z, color, intensity, duration, distance = 60) {
    const l = this.acquire('burst')
    if (!l) return
    const i = this.lights.indexOf(l)
    l.position.set(x, y, z)
    l.color.copy(color)
    l.intensity = intensity
    l.distance = distance
    this.fades[i] = intensity / duration
  }

  update(dt) {
    for (let i = 0; i < this.lights.length; i++) {
      if (this.owners[i] !== 'burst') continue
      const l = this.lights[i]
      l.intensity -= this.fades[i] * dt
      if (l.intensity <= 0) this.release(l)
    }
  }

  clear() {
    for (const l of this.lights) this.release(l)
  }
}

const _c = new THREE.Color()

export const fx = {
  sparks: null,
  smoke: null,
  lightPool: null,
  ready: false,
  // global scene-wide effects
  skyGlow: 0,
  skyGlowColor: new THREE.Color(1, 0.6, 0.3),
  flash: 0, // extra hemisphere light, decays
  flashColor: new THREE.Color(1, 0.8, 0.6),
  shake: 0,
  time: 0,

  init() {
    if (this.ready) return
    this.sparks = new SparkPool(MAX_SPARKS)
    this.smoke = new SmokePool(MAX_SMOKE)
    this.lightPool = new LightPool(LIGHT_POOL)
    this.ready = true
  },

  spark(...a) {
    this.sparks.emit(...a)
  },
  puff(...a) {
    this.smoke.emit(...a)
  },
  acquireLight(owner) {
    return this.lightPool.acquire(owner)
  },
  releaseLight(l) {
    if (l) this.lightPool.release(l)
  },
  burstLight(x, y, z, color, intensity, duration, distance) {
    this.lightPool.burst(x, y, z, color, intensity, duration, distance)
  },

  // A big aerial burst lights up the whole sky and scene.
  skyFlash(color, amount) {
    _c.copy(color)
    // blend colours weighted by strength
    const w = amount / (this.skyGlow + amount + 1e-4)
    this.skyGlowColor.lerp(_c, w)
    this.flashColor.lerp(_c, w)
    this.skyGlow = Math.min(1.2, this.skyGlow + amount)
    this.flash = Math.min(3, this.flash + amount * 2.2)
  },

  addShake(a) {
    this.shake = Math.min(0.6, this.shake + a)
  },

  update(dt, time, scale) {
    this.time = time
    this.sparks.uniforms.uScale.value = scale
    this.smoke.uniforms.uScale.value = scale
    this.sparks.update(dt, time)
    this.smoke.update(dt)
    this.lightPool.update(dt)
    this.skyGlow *= Math.exp(-dt * 1.6)
    this.flash *= Math.exp(-dt * 2.4)
    this.shake *= Math.exp(-dt * 5)
    // smoke picks up some firework light
    const tint = this.smoke.uniforms.uTint.value
    tint.setRGB(0.3 + this.flashColor.r * this.flash * 0.12, 0.28 + this.flashColor.g * this.flash * 0.12, 0.34 + this.flashColor.b * this.flash * 0.12)
  },

  clear() {
    this.skyGlow = 0
    this.flash = 0
    this.shake = 0
    if (!this.ready) return
    this.sparks.clear()
    this.smoke.clear()
    this.lightPool.clear()
  },
}

// Random helpers (allocation free)
export const rand = (a, b) => a + Math.random() * (b - a)
// Writes a random unit vector into out (array of 3) and returns it.
export function randDir(out) {
  const u = Math.random() * 2 - 1
  const th = Math.random() * Math.PI * 2
  const s = Math.sqrt(1 - u * u)
  out[0] = s * Math.cos(th)
  out[1] = u
  out[2] = s * Math.sin(th)
  return out
}

if (import.meta.env?.DEV && typeof window !== 'undefined') window.__fx = fx
