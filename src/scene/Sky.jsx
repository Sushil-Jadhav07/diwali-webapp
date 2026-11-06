import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { glowTexture } from './textures'
import { fx } from '../crackers/fx'

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
varying vec3 vDir;
void main() {
  float h = vDir.y;
  vec3 horizon = vec3(0.30, 0.13, 0.20);
  vec3 mid = vec3(0.06, 0.05, 0.19);
  vec3 top = vec3(0.012, 0.012, 0.05);
  vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.22, h));
  col = mix(col, top, smoothstep(0.22, 0.85, h));
  // firework sky glow
  col += uGlowColor * uGlow * (0.25 + 0.75 * smoothstep(-0.05, 0.5, h));
  gl_FragColor = vec4(col, 1.0);
}`

export default function Sky() {
  const mat = useRef()
  const uniforms = useMemo(() => ({ uGlowColor: { value: new THREE.Color() }, uGlow: { value: 0 } }), [])
  useFrame(() => {
    uniforms.uGlow.value = fx.skyGlow
    uniforms.uGlowColor.value.copy(fx.skyGlowColor)
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
      <Stars radius={180} depth={60} count={2600} factor={5} saturation={0.15} fade speed={0.4} />
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
