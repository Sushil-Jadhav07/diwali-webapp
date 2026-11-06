import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { glowTexture } from './textures'
import { fx } from '../crackers/fx'
import { ENV } from '../world/env'

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`

const frag = /* glsl */ `
uniform vec3 uGlowColor;
uniform float uGlow;
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uHor;
uniform vec3 uSunDir;
uniform float uSunAmt;
varying vec3 vDir;
void main() {
  float h = vDir.y;
  vec3 horizon = uHor;
  vec3 mid = uMid;
  vec3 top = uTop;
  vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.22, h));
  col = mix(col, top, smoothstep(0.22, 0.85, h));
  // setting sun: disc + warm glow near the horizon
  float sd = max(0.0, dot(normalize(vDir), uSunDir));
  col += vec3(1.0, 0.6, 0.3) * uSunAmt * (pow(sd, 900.0) * 8.0 + pow(sd, 24.0) * 0.5 + pow(sd, 4.0) * 0.18 * (1.0 - smoothstep(-0.05, 0.4, h)));
  // firework sky glow
  col += uGlowColor * uGlow * (0.25 + 0.75 * smoothstep(-0.05, 0.5, h));
  gl_FragColor = vec4(col, 1.0);
}`

export default function Sky() {
  const mat = useRef()
  const uniforms = useMemo(
    () => ({
      uGlowColor: { value: new THREE.Color() },
      uGlow: { value: 0 },
      uTop: { value: new THREE.Vector3() },
      uMid: { value: new THREE.Vector3() },
      uHor: { value: new THREE.Vector3() },
      uSunDir: { value: new THREE.Vector3(-0.5, 0.1, -0.85).normalize() },
      uSunAmt: { value: 1 },
    }),
    [],
  )
  const stars = useRef()
  useFrame(() => {
    uniforms.uGlow.value = fx.skyGlow
    uniforms.uGlowColor.value.copy(fx.skyGlowColor)
    uniforms.uTop.value.set(...ENV.skyTop)
    uniforms.uMid.value.set(...ENV.skyMid)
    uniforms.uHor.value.set(...ENV.skyHor)
    uniforms.uSunAmt.value = ENV.sunAmt
    uniforms.uSunDir.value.set(-0.5, Math.sin(ENV.sunElev), -0.85).normalize()
    if (stars.current) stars.current.visible = ENV.stars > 0.15
  })
  return (
    <group>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[300, 32, 16]} />
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <group ref={stars}>
        <Stars radius={180} depth={60} count={2600} factor={5} saturation={0.15} fade speed={0.4} />
      </group>
      <Moon />
    </group>
  )
}

function Moon() {
  const tex = glowTexture()
  return (
    <group position={[-70, 75, -170]}>
      <mesh>
        <sphereGeometry args={[6, 32, 16]} />
        <meshBasicMaterial color={[2.2, 2.1, 1.8]} toneMapped={false} fog={false} />
      </mesh>
      <sprite scale={[60, 60, 1]}>
        <spriteMaterial map={tex} color="#9aa8ff" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </sprite>
    </group>
  )
}
