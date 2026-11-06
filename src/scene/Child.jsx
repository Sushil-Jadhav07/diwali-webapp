import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { CRACKER_BY_ID } from '../crackers/catalog'
import { HOME, rig, damp } from './shared'
import { audio } from '../audio/audio'

// ---------------------------------------------------------------------------
// Aarav: a stylised low-poly boy in a kurta, built from primitives with a
// joint hierarchy and procedural poses (no external rig needed).
// Also the sequence DIRECTOR: the only place phases advance.
// Local +Z is the facing direction.
// ---------------------------------------------------------------------------

const THIGH = 0.28
const SHIN = 0.28
const FOOT_H = 0.05
const WALK_SPEED = 1.35
const RUN_SPEED = 3.3

const M = {
  skin: new THREE.MeshStandardMaterial({ color: '#b97a4e', roughness: 0.7 }),
  hair: new THREE.MeshStandardMaterial({ color: '#17100b', roughness: 0.6 }),
  kurta: new THREE.MeshStandardMaterial({ color: '#e0662a', roughness: 0.75 }),
  trim: new THREE.MeshStandardMaterial({ color: '#f5c04a', roughness: 0.4, metalness: 0.5 }),
  pyjama: new THREE.MeshStandardMaterial({ color: '#efe5d0', roughness: 0.85 }),
  shoe: new THREE.MeshStandardMaterial({ color: '#7a3b16', roughness: 0.6 }),
  eye: new THREE.MeshBasicMaterial({ color: '#120a06' }),
  white: new THREE.MeshBasicMaterial({ color: '#f5efe6' }),
  mouth: new THREE.MeshBasicMaterial({ color: '#6a2418' }),
  tilak: new THREE.MeshBasicMaterial({ color: '#d1122f' }),
  stick: new THREE.MeshStandardMaterial({ color: '#3a2316', roughness: 0.9 }),
  ember: new THREE.MeshBasicMaterial({ color: [5, 1.4, 0.3], toneMapped: false }),
  wire: new THREE.MeshStandardMaterial({ color: '#8a8f99', roughness: 0.35, metalness: 0.8 }),
  wireCoat: new THREE.MeshStandardMaterial({ color: '#5b5750', roughness: 0.9 }),
}

// Kurta shapes (lathe profiles: radius, height)
const kurtaTopGeo = new THREE.LatheGeometry(
  [
    [0.0, 0.46],
    [0.07, 0.46],
    [0.14, 0.42],
    [0.15, 0.3],
    [0.135, 0.1],
    [0.14, -0.02],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
  14,
)
const kurtaHemGeo = new THREE.LatheGeometry(
  [
    [0.14, 0.04],
    [0.165, -0.12],
    [0.2, -0.3],
    [0.205, -0.32],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
  14,
  0,
  Math.PI * 2,
)
kurtaHemGeo.computeVertexNormals()

const limb = (r1, r2, len) => {
  const g = new THREE.CylinderGeometry(r1, r2, len, 8)
  g.translate(0, -len / 2, 0)
  return g
}
const thighGeo = limb(0.062, 0.052, THIGH)
const shinGeo = limb(0.05, 0.04, SHIN)
const upperArmGeo = limb(0.046, 0.04, 0.2)
const foreArmGeo = limb(0.034, 0.03, 0.17)
const footGeo = new THREE.BoxGeometry(0.08, 0.05, 0.17)
footGeo.translate(0, -0.025, 0.035)

// ---------- pose helpers ----------
const JOINTS = ['thighL', 'thighR', 'kneeL', 'kneeR', 'spine', 'head', 'shLx', 'shLz', 'shRx', 'shRz', 'elLx', 'elRx', 'elLz', 'elRz', 'bounce', 'twist']
const blankPose = () => Object.fromEntries(JOINTS.map((j) => [j, 0]))

function poseIdle(p, t) {
  p.knee = 0
  p.kneeL = p.kneeR = 0.06
  p.spine = 0.03 + Math.sin(t * 1.6) * 0.015
  p.head = Math.sin(t * 0.7) * 0.05
  p.shLz = 0.1
  p.shRz = -0.1
  p.elLx = p.elRx = -0.2
  return p
}

function poseGait(p, phase, amp) {
  // amp: 0 walk -> 1 run
  const s = Math.sin(phase)
  const thighA = 0.42 + 0.38 * amp
  p.thighL = -thighA * s
  p.thighR = thighA * s
  p.kneeL = 0.12 + (0.7 + 0.7 * amp) * Math.max(0, Math.sin(phase - 1.1))
  p.kneeR = 0.12 + (0.7 + 0.7 * amp) * Math.max(0, Math.sin(phase + Math.PI - 1.1))
  p.spine = 0.05 + 0.18 * amp
  p.head = -0.06 * amp
  const armA = 0.35 + 0.55 * amp
  p.shLx = armA * s
  p.shRx = -armA * s
  p.shLz = 0.12
  p.shRz = -0.12
  p.elLx = p.elRx = -0.3 - 1.0 * amp
  p.bounce = Math.abs(Math.cos(phase)) * (0.015 + 0.03 * amp)
  p.twist = 0.06 * s * (1 + amp)
  return p
}

function poseCrouch(p) {
  p.thighL = p.thighR = -1.45
  p.kneeL = p.kneeR = 2.25
  p.spine = 0.55
  p.head = 0.25
  p.shLx = -0.7
  p.shLz = 0.15
  p.elLx = -0.7
  p.shRx = -1.0
  p.shRz = -0.08
  p.elRx = -0.3
  return p
}

function poseCoverEars(p, t) {
  p.kneeL = p.kneeR = 0.25 + Math.max(0, Math.sin(t * 5)) * 0.08
  p.thighL = p.thighR = -0.15
  p.spine = -0.02
  p.head = 0.0
  p.shLz = 2.3
  p.shRz = -2.3
  p.elLz = 2.1
  p.elRz = -2.1
  p.shLx = p.shRx = -0.15
  return p
}

function poseCelebrate(p, t) {
  const hop = Math.max(0, Math.sin(t * 7.5))
  p.bounce = hop * 0.22
  p.kneeL = p.kneeR = 0.15 + (1 - hop) * 0.5
  p.thighL = p.thighR = -0.1 - (1 - hop) * 0.25
  p.spine = -0.08
  p.head = -0.25
  p.shLz = 2.6 + Math.sin(t * 11) * 0.25
  p.shRz = -2.6 - Math.sin(t * 11 + 1) * 0.25
  p.elLx = p.elRx = -0.3
  return p
}

const angleDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a))

export default function Child() {
  const root = useRef()
  const hips = useRef()
  const hem = useRef()
  const j = useRef({})
  const handR = useRef()
  const stickR = useRef()
  const stickL = useRef()
  const sparkler = useRef()
  const sparkTip = useRef()
  const burnt = useRef()

  const cur = useMemo(blankPose, [])
  const tgt = useMemo(blankPose, [])
  const local = useMemo(
    () => ({ phase: null, t: 0, gait: 0, gaitAmp: 0, speed: 0, yawT: Math.PI, target: new THREE.Vector3() }),
    [],
  )
  const set = (name) => (el) => (j.current[name] = el)

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const time = state.clock.elapsedTime
    const st = useStore.getState()
    const { phase, current } = st
    const def = current && CRACKER_BY_ID[current.type]
    const rt = current?.rt

    if (phase !== local.phase) {
      local.phase = phase
      local.t = 0
    } else local.t += dt
    const t = local.t

    // ----- director: movement + phase transitions -----
    const spotX = current ? current.spot[0] : 0
    const spotZ = current ? current.spot[1] : 0
    let moving = false
    let speed = 0
    const goTo = (x, z, spd) => {
      const dx = x - rig.pos.x
      const dz = z - rig.pos.z
      const d = Math.hypot(dx, dz)
      if (d < 0.04) return true
      local.yawT = Math.atan2(dx, dz)
      // slow down while turning sharply
      const turn = Math.abs(angleDiff(rig.yaw, local.yawT))
      const s = spd * Math.max(0.25, 1 - turn / 1.6) * Math.min(1, d / 0.35 + 0.3)
      const step = Math.min(d, s * dt)
      rig.pos.x += (dx / d) * step
      rig.pos.z += (dz / d) * step
      moving = true
      speed = s
      return false
    }
    const face = (x, z) => {
      local.yawT = Math.atan2(x - rig.pos.x, z - rig.pos.z)
    }
    // approach point: 0.55 m in front of the spot, on the home side
    const toHomeX = HOME.x - spotX
    const toHomeZ = HOME.z - spotZ
    const toHomeL = Math.hypot(toHomeX, toHomeZ) || 1
    const ux = toHomeX / toHomeL
    const uz = toHomeZ / toHomeL

    switch (phase) {
      case 'walkingTo': {
        const ax = def?.held ? spotX : spotX + ux * 0.55
        const az = def?.held ? spotZ : spotZ + uz * 0.55
        if (goTo(ax, az, WALK_SPEED)) st.advance('walkingTo')
        break
      }
      case 'placing': {
        if (def?.held) face(spotX - ux, spotZ - uz)
        else face(spotX, spotZ)
        if (t > 0.6 && !rt.placed) {
          rt.placed = true
        }
        if (t > (def?.held ? 0.9 : 1.3)) st.advance('placing')
        break
      }
      case 'lighting': {
        if (t > 1.0 && rt.litAt < 0) {
          rt.litAt = time
          audio.play('strike')
        }
        if (t > 1.55) st.advance('lighting')
        break
      }
      case 'retreating': {
        if (def?.held) {
          // step back slowly, keeping the sparkler out in front
          const bx = spotX + ux * def.retreat
          const bz = spotZ + uz * def.retreat
          const dx = bx - rig.pos.x
          const dz = bz - rig.pos.z
          const d = Math.hypot(dx, dz)
          if (d > 0.03) {
            const step = Math.min(d, 0.7 * dt)
            rig.pos.x += (dx / d) * step
            rig.pos.z += (dz / d) * step
            moving = true
            speed = -0.7
          } else st.advance('retreating')
          face(spotX - ux * 3, spotZ - uz * 3)
        } else if (goTo(HOME.x, HOME.z, RUN_SPEED)) st.advance('retreating')
        break
      }
      case 'waiting': {
        if (def?.held) face(rig.pos.x - ux, rig.pos.z - uz)
        else face(spotX, spotZ)
        if (rt.done || t > 30) st.advance('waiting')
        break
      }
      case 'celebrating': {
        if (t > 2.6) st.advance('celebrating')
        break
      }
      default:
        break
    }

    // camera focus
    rig.focusPoint.set(spotX, 0, spotZ)
    if (phase === 'waiting') rig.focusMode = def?.aerial ? 'sky' : def?.held ? 'child' : 'cracker'
    else if (phase === 'retreating' && !def?.held) rig.focusMode = 'cracker'
    else rig.focusMode = 'child'

    // turn smoothly
    rig.yaw += angleDiff(rig.yaw, local.yawT) * (1 - Math.exp(-8 * dt))

    // ----- pose targets -----
    for (const k of JOINTS) tgt[k] = 0
    const running = phase === 'retreating' && !def?.held
    local.gaitAmp = damp(local.gaitAmp, running ? 1 : 0, 6, dt)
    if (moving) {
      const stride = running ? 1.35 : 0.85
      local.gait += (dt * Math.abs(speed) * Math.PI * 2) / stride * (speed < 0 ? -1 : 1)
    }
    local.speed = damp(local.speed, moving ? 1 : 0, 10, dt)

    let lambda = 10
    if (moving) poseGait(tgt, local.gait, local.gaitAmp)
    else if (phase === 'placing' && !def?.held) {
      poseCrouch(tgt)
      // reach down and set the cracker on the ground
      const reach = Math.sin(Math.min(1, t / 1.1) * Math.PI)
      tgt.shRx = -1.0 - reach * 0.45
      tgt.elRx = -0.3 + reach * 0.2
      lambda = 7
    } else if (phase === 'lighting' && !def?.held) {
      poseCrouch(tgt)
      tgt.shRx = -1.35 + Math.sin(time * 20) * 0.02
      tgt.elRx = -0.1
      tgt.shLx = 0.2
      tgt.shLz = 0.35
      tgt.head = 0.35
      tgt.spine = 0.6
    } else if (def?.held && (phase === 'placing' || phase === 'lighting' || phase === 'retreating')) {
      poseIdle(tgt, time)
      tgt.shRx = -1.25
      tgt.shRz = -0.05
      tgt.elRx = -0.25
      tgt.head = 0.12
      if (phase === 'lighting') {
        tgt.shLx = -1.2
        tgt.shLz = -0.35
        tgt.elLx = -0.45
      }
      if (phase === 'placing') {
        const lift = Math.min(1, t / 0.7)
        tgt.shRx = -0.2 - 1.05 * lift
      }
    } else if (phase === 'waiting') {
      if (def?.held) {
        poseIdle(tgt, time)
        // wave the sparkler in circles
        tgt.shRx = -1.3 + Math.sin(time * 3.4) * 0.45
        tgt.shRz = -0.25 + Math.cos(time * 3.4) * 0.4
        tgt.elRx = -0.25
        tgt.head = 0.05
        tgt.bounce = Math.max(0, Math.sin(time * 6.8)) * 0.02
      } else {
        poseCoverEars(tgt, time)
        if (def?.aerial) tgt.head = -0.45
      }
      lambda = 8
    } else if (phase === 'celebrating') {
      poseCelebrate(tgt, t)
      lambda = 12
    } else poseIdle(tgt, time)

    // blend gait in/out smoothly while moving
    for (const k of JOINTS) cur[k] = damp(cur[k], tgt[k], k === 'bounce' && phase === 'celebrating' ? 30 : lambda, dt)

    // ----- apply to skeleton -----
    const J = j.current
    J.thighL.rotation.x = cur.thighL
    J.thighR.rotation.x = cur.thighR
    J.kneeL.rotation.x = cur.kneeL
    J.kneeR.rotation.x = cur.kneeR
    J.spine.rotation.x = cur.spine
    J.spine.rotation.y = cur.twist
    J.head.rotation.x = cur.head
    J.shL.rotation.set(cur.shLx, 0, cur.shLz)
    J.shR.rotation.set(cur.shRx, 0, cur.shRz)
    J.elL.rotation.set(cur.elLx, 0, cur.elLz)
    J.elR.rotation.set(cur.elRx, 0, cur.elRz)

    // keep the lower foot on the ground
    const legL = THIGH * Math.cos(cur.thighL) + SHIN * Math.cos(cur.thighL + cur.kneeL)
    const legR = THIGH * Math.cos(cur.thighR) + SHIN * Math.cos(cur.thighR + cur.kneeR)
    const hipY = FOOT_H + Math.max(legL, legR) + cur.bounce
    hips.current.position.y = hipY
    // kurta hem shortens and flares a bit while crouching
    const crouch = THREE.MathUtils.clamp((0.6 - hipY) / 0.35, 0, 1)
    hem.current.scale.set(1 + crouch * 0.35, 1 - crouch * 0.45, 1 + crouch * 0.5)
    hem.current.rotation.x = crouch * -0.25

    root.current.position.set(rig.pos.x, 0, rig.pos.z)
    root.current.rotation.y = rig.yaw

    // props: incense stick, sparkler
    const ground = def && !def.held
    stickR.current.visible = !!ground && (phase === 'placing' || phase === 'lighting')
    stickL.current.visible = !!def?.held && phase === 'lighting'
    const showSparkler = !!def?.held && rt?.placed && !rt.done && phase !== 'idle'
    sparkler.current.visible = showSparkler
    if (showSparkler) {
      const burn = rt.burn || 0
      sparkTip.current.position.y = -0.33 * (1 - burn * 0.8)
      burnt.current.scale.y = Math.max(0.001, burn * 0.8)
    }
  })

  // expose attachment points
  const onHand = (el) => {
    handR.current = el
    rig.handR = el
  }
  const onTip = (el) => {
    sparkTip.current = el
    rig.sparkTip = el
  }
  const onStickTip = (el) => {
    rig.stickTip = el
  }

  return (
    <group ref={root} position={[HOME.x, 0, HOME.z]} rotation-y={Math.PI}>
      <group ref={hips} position={[0, 0.61, 0]}>
        {/* legs */}
        <Leg side={1} set={set} />
        <Leg side={-1} set={set} />
        <mesh ref={hem} material={M.kurta} geometry={kurtaHemGeo} castShadow />
        <group ref={set('spine')}>
          <mesh material={M.kurta} geometry={kurtaTopGeo} castShadow />
          {/* placket + collar trim */}
          <mesh material={M.trim} position={[0, 0.3, 0.142]}>
            <boxGeometry args={[0.03, 0.22, 0.01]} />
          </mesh>
          <mesh material={M.trim} position={[0, 0.455, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.068, 0.012, 6, 16]} />
          </mesh>
          {/* neck */}
          <mesh material={M.skin} position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.04, 0.045, 0.08, 8]} />
          </mesh>
          <group ref={set('head')} position={[0, 0.53, 0]}>
            <Head />
          </group>
          <Arm side={1} set={set}>
            {/* left hand: incense stick used to light the sparkler */}
            <group ref={stickL} rotation-x={-0.6} visible={false}>
              <mesh material={M.stick} position={[0, -0.14, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.3, 4]} />
              </mesh>
              <mesh material={M.ember} position={[0, -0.29, 0]}>
                <sphereGeometry args={[0.012, 6, 4]} />
              </mesh>
            </group>
          </Arm>
          <Arm side={-1} set={set} onHand={onHand}>
            {/* right hand props */}
            <group ref={stickR} rotation-x={-0.5} visible={false}>
              <mesh material={M.stick} position={[0, -0.14, 0]}>
                <cylinderGeometry args={[0.006, 0.006, 0.3, 4]} />
              </mesh>
              <mesh material={M.ember} position={[0, -0.29, 0]} ref={onStickTip}>
                <sphereGeometry args={[0.012, 6, 4]} />
              </mesh>
            </group>
            <group ref={sparkler} rotation-x={-0.7} visible={false}>
              <mesh material={M.wire} position={[0, -0.17, 0]}>
                <cylinderGeometry args={[0.004, 0.004, 0.36, 4]} />
              </mesh>
              {/* unburnt coating */}
              <mesh material={M.wireCoat} position={[0, -0.22, 0]}>
                <cylinderGeometry args={[0.009, 0.009, 0.24, 6]} />
              </mesh>
              {/* burnt section grows from the tip back (drawn over the coat) */}
              <group position={[0, -0.335, 0]}>
                <mesh ref={burnt} position={[0, 0.12, 0]} scale-y={0.001}>
                  <cylinderGeometry args={[0.0095, 0.0095, 0.3, 6]} />
                  <meshStandardMaterial color="#1a1512" roughness={1} />
                </mesh>
              </group>
              <group ref={onTip} position={[0, -0.33, 0]} />
            </group>
          </Arm>
        </group>
      </group>
    </group>
  )
}

function Leg({ side, set }) {
  const s = side === 1 ? 'L' : 'R'
  return (
    <group ref={set('thigh' + s)} position={[0.075 * side, 0, 0]}>
      <mesh geometry={thighGeo} material={M.pyjama} castShadow />
      <group ref={set('knee' + s)} position={[0, -THIGH, 0]}>
        <mesh geometry={shinGeo} material={M.pyjama} castShadow />
        <mesh geometry={footGeo} material={M.shoe} position={[0, -SHIN, 0]} castShadow />
      </group>
    </group>
  )
}

function Arm({ side, set, onHand, children }) {
  const s = side === 1 ? 'L' : 'R'
  return (
    <group ref={set('sh' + s)} position={[0.165 * side, 0.4, 0]}>
      <mesh geometry={upperArmGeo} material={M.kurta} castShadow />
      <group ref={set('el' + s)} position={[0, -0.2, 0]}>
        <mesh geometry={foreArmGeo} material={M.skin} castShadow />
        <mesh material={M.trim} position={[0, -0.005, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
        </mesh>
        <group ref={onHand} position={[0, -0.19, 0]}>
          <mesh material={M.skin} scale={[1, 1.15, 0.85]}>
            <sphereGeometry args={[0.035, 10, 8]} />
          </mesh>
          {children}
        </group>
      </group>
    </group>
  )
}

function Head() {
  return (
    <group>
      <mesh material={M.skin} position={[0, 0.1, 0]} scale={[1, 1.08, 1]} castShadow>
        <sphereGeometry args={[0.115, 20, 16]} />
      </mesh>
      {/* hair cap */}
      <mesh material={M.hair} position={[0, 0.125, -0.012]} scale={[1.06, 1.0, 1.06]}>
        <sphereGeometry args={[0.118, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
      </mesh>
      {/* fringe */}
      <mesh material={M.hair} position={[0.0, 0.19, 0.08]} rotation-x={0.5} scale={[1.6, 0.5, 0.6]}>
        <sphereGeometry args={[0.05, 10, 6]} />
      </mesh>
      {/* ears */}
      <mesh material={M.skin} position={[0.115, 0.095, 0]} scale={[0.5, 1, 0.8]}>
        <sphereGeometry args={[0.028, 8, 6]} />
      </mesh>
      <mesh material={M.skin} position={[-0.115, 0.095, 0]} scale={[0.5, 1, 0.8]}>
        <sphereGeometry args={[0.028, 8, 6]} />
      </mesh>
      {/* eyes */}
      {[1, -1].map((s) => (
        <group key={s} position={[0.042 * s, 0.11, 0.1]}>
          <mesh material={M.white} scale={[1, 1.1, 0.5]}>
            <sphereGeometry args={[0.018, 10, 8]} />
          </mesh>
          <mesh material={M.eye} position={[0, -0.001, 0.008]}>
            <sphereGeometry args={[0.011, 8, 6]} />
          </mesh>
        </group>
      ))}
      {/* brows */}
      {[1, -1].map((s) => (
        <mesh key={s} material={M.hair} position={[0.043 * s, 0.142, 0.103]} rotation-z={0.15 * s}>
          <boxGeometry args={[0.032, 0.007, 0.006]} />
        </mesh>
      ))}
      {/* nose */}
      <mesh material={M.skin} position={[0, 0.085, 0.115]} scale={[0.8, 1, 1]}>
        <sphereGeometry args={[0.014, 8, 6]} />
      </mesh>
      {/* smile */}
      <mesh material={M.mouth} position={[0, 0.052, 0.103]} rotation={[0.25, 0, Math.PI]}>
        <torusGeometry args={[0.024, 0.0055, 6, 12, Math.PI]} />
      </mesh>
      {/* tilak */}
      <mesh material={M.tilak} position={[0, 0.162, 0.106]}>
        <sphereGeometry args={[0.007, 6, 4]} />
      </mesh>
    </group>
  )
}
