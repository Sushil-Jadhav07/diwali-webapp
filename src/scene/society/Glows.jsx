import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Additive soft-glow points (one draw call for many halos). No lights involved.
const vert = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
uniform float uScale;
uniform float uTime;
uniform float uGain;
varying vec3 vColor;
void main() {
  float f = aPhase < 0.0 ? 1.0 : 0.88 + 0.12 * sin(uTime * 9.0 + aPhase) * sin(uTime * 5.3 + aPhase * 1.7);
  vColor = aColor * f;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * f * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`

const frag = /* glsl */ `
varying vec3 vColor;
uniform float uGain;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = exp(-d * d * 3.2) * (1.0 - smoothstep(0.85, 1.0, d));
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor * a * uGain, 1.0);
}`

// one shared gain for every glow sprite (time of day)
export const GLOW_GAIN = { value: 1 }

export function makeGlowMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: { uScale: { value: 400 }, uTime: { value: 0 }, uGain: GLOW_GAIN },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

// items: [{ p: [x,y,z] | Vector3, size, color: [r,g,b], flicker: bool }]
export function buildGlowPoints(items) {
  const n = items.length
  const pos = new Float32Array(n * 3)
  const col = new Float32Array(n * 3)
  const size = new Float32Array(n)
  const phase = new Float32Array(n)
  items.forEach((it, i) => {
    const p = it.p.isVector3 ? [it.p.x, it.p.y, it.p.z] : it.p
    pos.set(p, i * 3)
    col.set(it.color, i * 3)
    size[i] = it.size
    phase[i] = it.flicker ? Math.random() * 100 : -1
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4)
  const pts = new THREE.Points(g, makeGlowMaterial())
  pts.frustumCulled = false
  pts.renderOrder = 7
  return pts
}

// Keeps a glow material's screen scale + time in sync each frame.
export function useGlowUniforms(material) {
  const gl = useThree((s) => s.gl)
  useFrame((state) => {
    if (!material) return
    const cam = state.camera
    material.uniforms.uScale.value = (gl.domElement.height * 0.5) / Math.tan((cam.fov * Math.PI) / 360)
    material.uniforms.uTime.value = state.clock.elapsedTime
  })
}

export default function Glows({ items }) {
  const pts = useMemo(() => buildGlowPoints(items), [items])
  useGlowUniforms(pts.material)
  return <primitive object={pts} />
}
