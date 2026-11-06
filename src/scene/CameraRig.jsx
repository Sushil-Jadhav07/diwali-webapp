import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { rig } from './shared'
import { fx } from '../crackers/fx'
import { input } from '../world/input'
import { segmentHit } from '../world/collision'
import { WORLD } from '../world/layout'
import { useStore } from '../store/useStore'

// Third-person follow camera.
// - Follows by moving the OrbitControls target smoothly (the camera moves by
//   the same delta), so the user's chosen orbit angle/zoom is never reset.
// - Camera collision + world clamp + screen shake are applied after the
//   controls update and removed again before the next one, so they never get
//   baked into the orbit.
// - Aerial shows tilt the view up gently, only if the user has not touched the
//   camera since the sequence began.
const MAX_POLAR = Math.PI / 2 - 0.04

export default function CameraRig() {
  const controls = useRef()
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const st = useRef({
    desired: new THREE.Vector3(rig.pos.x, 1, rig.pos.z),
    prev: new THREE.Vector3(rig.pos.x, 1, rig.pos.z),
    offset: new THREE.Vector3(), // collision + shake offset applied last frame
    tmp: new THREE.Vector3(),
    seq: 0,
    seqStart: 0,
    lift: 0,
  })

  // priority -2: undo last frame's offset, then follow (before OrbitControls.update at -1)
  useFrame((_, rawDt) => {
    const c = controls.current
    if (!c) return
    const s = st.current
    const dt = Math.min(rawDt, 0.1)
    camera.position.sub(s.offset)
    s.offset.set(0, 0, 0)
    if (rig.snapCamera) {
      // fast travel: jump target + camera together, keeping the orbit offset
      rig.snapCamera = false
      const jump = s.tmp.set(rig.pos.x - c.target.x, 1 - c.target.y, rig.pos.z - c.target.z)
      c.target.add(jump)
      camera.position.add(jump)
      s.prev.copy(c.target)
    }

    const { current, phase } = useStore.getState()
    const id = current ? current.id : 0
    if (id !== s.seq) {
      s.seq = id
      s.seqStart = performance.now()
    }
    const userMoved = input.cameraTouchedAt > s.seqStart
    // gentle look-up for aerial crackers while watching, if the user has not moved the camera
    const wantLift = rig.focusMode === 'sky' && phase === 'waiting' && !userMoved ? 4.5 : 0
    s.lift += (wantLift - s.lift) * (1 - Math.exp(-1.2 * dt))

    const d = s.desired
    if (rig.focusMode === 'cracker') d.set((rig.pos.x + rig.focusPoint.x) / 2, 0.9, (rig.pos.z + rig.focusPoint.z) / 2)
    else d.set(rig.pos.x, 1.0, rig.pos.z)
    d.y += s.lift
    const k = 1 - Math.exp(-3.2 * dt)
    c.target.lerp(d, k)
    const delta = s.tmp.subVectors(c.target, s.prev)
    camera.position.x += delta.x
    camera.position.z += delta.z
    // the aerial lift tilts the view (camera height mostly stays)
    camera.position.y += delta.y * (rig.focusMode === 'sky' ? 0.15 : 1)
    s.prev.copy(c.target)
  }, -2)

  // priority 0: after the controls, before the composer renders
  useFrame(() => {
    const c = controls.current
    if (!c) return
    const s = st.current
    // wider lens on tall (portrait / phone) screens
    const fov = size.width / size.height < 0.8 ? 64 : 50
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    const before = s.tmp.copy(camera.position)
    // camera collision: pull in along the target -> camera segment
    const T = c.target
    const P = camera.position
    const t = segmentHit(T.x, T.y, T.z, P.x, P.y, P.z, 0.3)
    if (t < 1) {
      const f = Math.max(0.12, t * 0.92)
      P.set(T.x + (P.x - T.x) * f, T.y + (P.y - T.y) * f, T.z + (P.z - T.z) * f)
    }
    // never leave the society or go underground
    P.x = THREE.MathUtils.clamp(P.x, WORLD.minX + 0.4, WORLD.maxX - 0.4)
    P.z = THREE.MathUtils.clamp(P.z, WORLD.minZ + 0.4, WORLD.maxZ - 0.4)
    P.y = THREE.MathUtils.clamp(P.y, 0.45, 60)
    if (fx.shake > 0.002) {
      const sh = fx.shake
      P.x += (Math.random() - 0.5) * sh
      P.y += (Math.random() - 0.5) * sh
      P.z += (Math.random() - 0.5) * sh * 0.5
    }
    s.offset.subVectors(P, before)
  }, 0)

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[rig.pos.x, 1, rig.pos.z]}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={3.2}
      maxDistance={30}
      minPolarAngle={0.25}
      maxPolarAngle={MAX_POLAR}
      onStart={() => (input.cameraTouchedAt = performance.now())}
    />
  )
}
