import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { rig } from './shared'
import { fx } from '../crackers/fx'

// Follow camera: OrbitControls for user orbit/zoom, with the orbit target
// smoothly following the child (or the cracker / sky while a show is on).
// Screen shake is applied after the controls update and removed before the
// next one, so it never accumulates into the orbit.
const MAX_POLAR = Math.PI / 2 - 0.04

export default function CameraRig() {
  const controls = useRef()
  const camera = useThree((s) => s.camera)
  const desired = useRef(new THREE.Vector3(0, 1, 4.2))
  const prevTarget = useRef(new THREE.Vector3(0, 1, 4.2))
  const shakeOffset = useRef(new THREE.Vector3())
  const tmp = useRef(new THREE.Vector3())
  const show = useRef({ active: false, returning: 0, savedOffset: new THREE.Vector3(), cam: new THREE.Vector3() })

  // priority -2: before OrbitControls.update (-1)
  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    camera.position.sub(shakeOffset.current)
    shakeOffset.current.set(0, 0, 0)

    const d = desired.current
    const k = 1 - Math.exp(-2.2 * Math.min(dt, 0.1))
    const sh = show.current

    if (rig.focusMode === 'sky') {
      // aerial show: low wide angle behind the child, looking up at the bursts
      if (!sh.active) {
        sh.active = true
        sh.savedOffset.subVectors(camera.position, c.target)
        c.maxPolarAngle = Math.PI - 0.35 // allow looking up from below
      }
      d.set(rig.focusPoint.x * 0.8 + rig.pos.x * 0.2, 13, rig.focusPoint.z - 1.5)
      sh.cam.set(rig.pos.x * 0.7 + rig.focusPoint.x * 0.3, 1.4, rig.pos.z + 6.5)
      const kc = 1 - Math.exp(-1.6 * Math.min(dt, 0.1))
      c.target.lerp(d, k)
      camera.position.lerp(sh.cam, kc)
      prevTarget.current.copy(c.target)
      return
    }
    if (sh.active) {
      sh.active = false
      sh.returning = 1.8
    }

    if (rig.focusMode === 'child') {
      d.set(rig.pos.x, 1.0, rig.pos.z)
    } else {
      d.set((rig.pos.x + rig.focusPoint.x) / 2, 0.9, (rig.pos.z + rig.focusPoint.z) / 2)
    }
    c.target.lerp(d, k)
    if (sh.returning > 0) {
      // glide back to the view the user had before the show
      sh.returning -= dt
      sh.cam.copy(c.target).add(sh.savedOffset)
      camera.position.lerp(sh.cam, k * 1.4)
      if (sh.returning <= 0) c.maxPolarAngle = MAX_POLAR
    }
    const delta = tmp.current.subVectors(c.target, prevTarget.current)
    // camera trails the target horizontally; vertical lift mostly tilts the view
    camera.position.x += delta.x
    camera.position.z += delta.z
    camera.position.y += delta.y * 0.3
    prevTarget.current.copy(c.target)
  }, -2)

  // priority 0: after controls, before the composer renders
  const size = useThree((s) => s.size)
  useFrame(() => {
    // wider lens on tall (portrait / phone) screens
    const fov = size.width / size.height < 0.8 ? 64 : 50
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    if (fx.shake > 0.002) {
      const s = fx.shake
      shakeOffset.current.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s * 0.5)
      camera.position.add(shakeOffset.current)
    }
  }, 0)

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={[0, 1, 4.2]}
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      minDistance={3.5}
      maxDistance={26}
      minPolarAngle={0.25}
      maxPolarAngle={MAX_POLAR}
    />
  )
}
