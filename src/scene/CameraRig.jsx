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
export default function CameraRig() {
  const controls = useRef()
  const camera = useThree((s) => s.camera)
  const desired = useRef(new THREE.Vector3(0, 1, 4.2))
  const prevTarget = useRef(new THREE.Vector3(0, 1, 4.2))
  const shakeOffset = useRef(new THREE.Vector3())
  const tmp = useRef(new THREE.Vector3())

  // priority -2: before OrbitControls.update (-1)
  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    camera.position.sub(shakeOffset.current)
    shakeOffset.current.set(0, 0, 0)

    const d = desired.current
    if (rig.focusMode === 'child') {
      d.set(rig.pos.x, 1.0, rig.pos.z)
    } else if (rig.focusMode === 'cracker') {
      d.set((rig.pos.x + rig.focusPoint.x) / 2, 0.9, (rig.pos.z + rig.focusPoint.z) / 2)
    } else {
      // sky: look up at the aerial show
      d.set((rig.pos.x + rig.focusPoint.x) / 2, 7.5, (rig.pos.z + rig.focusPoint.z) / 2)
    }
    const k = 1 - Math.exp(-2.2 * Math.min(dt, 0.1))
    c.target.lerp(d, k)
    const delta = tmp.current.subVectors(c.target, prevTarget.current)
    // camera trails the target horizontally; vertical lift mostly tilts the view
    camera.position.x += delta.x
    camera.position.z += delta.z
    camera.position.y += delta.y * 0.3
    prevTarget.current.copy(c.target)
  }, -2)

  // priority 0: after controls, before the composer renders
  useFrame(() => {
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
      maxPolarAngle={Math.PI / 2 - 0.04}
    />
  )
}
