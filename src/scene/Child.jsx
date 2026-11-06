import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { CRACKER_BY_ID } from '../crackers/catalog'
import { HOME, rig, damp } from './shared'
import { findPath, resolveCircle, AGENT_R } from '../world/collision'
import { pushOutOfDanger, LIVE_PEOPLE } from '../world/safety'
import { input, moveIntent, wantsRun } from '../world/input'
import { START } from '../world/layout'
import { audio } from '../audio/audio'
import { fx } from '../crackers/fx'
import { M, THIGH, SHIN, FOOT_H, Torso, Hem, Leg, Arm, Head } from './childBody'

// ---------------------------------------------------------------------------
// Aarav: a stylised boy in a kurta (body parts in childBody.jsx) driven by a
// joint hierarchy and procedural poses (no external rig needed).
// Also the sequence DIRECTOR: the only place phases advance.
// Local +Z is the facing direction.
// ---------------------------------------------------------------------------

const WALK_SPEED = 2.1
const RUN_SPEED = 5.2

// ---------- pose helpers ----------
const JOINTS = ['thighL', 'thighR', 'kneeL', 'kneeR', 'spine', 'head', 'headY', 'sway', 'shLx', 'shLz', 'shRx', 'shRz', 'elLx', 'elRx', 'elLz', 'elRz', 'bounce', 'twist']
const blankPose = () => Object.fromEntries(JOINTS.map((j) => [j, 0]))

function poseIdle(p, t) {
  p.knee = 0
  p.kneeL = p.kneeR = 0.06
  p.spine = 0.03 + Math.sin(t * 1.6) * 0.015
  p.head = Math.sin(t * 0.7) * 0.05
  // looks around and shifts weight a little
  p.headY = Math.sin(t * 0.37) * 0.28 + Math.sin(t * 0.91) * 0.08
  p.sway = Math.sin(t * 0.8) * 0.025
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
const MV = { x: 0, z: 0 }

export default function Child() {
  const root = useRef()
  const hips = useRef()
  const hem = useRef()
  const j = useRef({})
  const handR = useRef()
  const stickR = useRef()
  const stickL = useRef()
  const sparkler = useRef()
  const capgun = useRef()
  const capSpots = useRef([])
  const sparkTip = useRef()
  const burnt = useRef()

  const cur = useMemo(blankPose, [])
  const tgt = useMemo(blankPose, [])
  const local = useMemo(
    () => ({ phase: null, t: 0, gait: 0, gaitAmp: 0, speed: 0, yawT: START.yaw, blinkT: 0, nextBlink: 2, mouth: 0, seq: 0, path: null, pathFor: null, pi: 0, running: false }),
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
    const spotX = current ? current.spot[0] : rig.pos.x
    const spotZ = current ? current.spot[1] : rig.pos.z
    let moving = false
    let speed = 0
    // a new sequence (or a Clear) resets per-sequence navigation
    const seqId = current ? current.id : 0
    if (seqId !== local.seq) {
      local.seq = seqId
      local.pathFor = null
    }
    const goTo = (x, z, spd) => {
      const dx = x - rig.pos.x
      const dz = z - rig.pos.z
      const d = Math.hypot(dx, dz)
      if (d < 0.06) return true
      local.yawT = Math.atan2(dx, dz)
      // slow down while turning sharply
      const turn = Math.abs(angleDiff(rig.yaw, local.yawT))
      const s = spd * Math.max(0.25, 1 - turn / 1.6) * Math.min(1, d / 0.35 + 0.3)
      const stepLen = Math.min(d, s * dt)
      rig.pos.x += (dx / d) * stepLen
      rig.pos.z += (dz / d) * stepLen
      moving = true
      speed = s
      return false
    }
    // follow an A* path to (tx, tz); returns true on arrival
    const follow = (key, tx, tz, spd) => {
      if (local.pathFor !== key) {
        local.path = findPath(rig.pos.x, rig.pos.z, tx, tz) || [{ x: tx, z: tz }]
        local.pathFor = key
        local.pi = 0
      }
      const w = local.path[local.pi]
      if (goTo(w.x, w.z, spd)) {
        if (local.pi < local.path.length - 1) local.pi++
        else return true
      }
      return false
    }
    const face = (x, z) => {
      local.yawT = Math.atan2(x - rig.pos.x, z - rig.pos.z)
    }
    const cam = state.camera.position

    switch (phase) {
      case 'idle': {
        // free movement: keyboard / joystick (camera-relative), or click-to-move
        const camYaw = Math.atan2(rig.pos.x - cam.x, rig.pos.z - cam.z)
        const mag = moveIntent(camYaw, MV)
        const spd = wantsRun() ? RUN_SPEED : WALK_SPEED
        if (mag > 0) {
          input.nav = null
          local.yawT = Math.atan2(MV.x, MV.z)
          const s = spd * mag
          rig.pos.x += MV.x * s * dt
          rig.pos.z += MV.z * s * dt
          moving = true
          speed = s
        } else if (input.nav) {
          const n = input.nav
          const w = n.path[n.i]
          // long auto-walks (places / map) jog; short ones walk
          let left = Math.hypot(w.x - rig.pos.x, w.z - rig.pos.z)
          for (let k = n.i + 1; k < n.path.length; k++) left += Math.hypot(n.path[k].x - n.path[k - 1].x, n.path[k].z - n.path[k - 1].z)
          if (goTo(w.x, w.z, left > 8 ? RUN_SPEED : spd)) {
            if (n.i < n.path.length - 1) n.i++
            else input.nav = null
          }
        }
        break
      }
      case 'walkingTo': {
        if (follow('approach', current.approach[0], current.approach[1], WALK_SPEED)) st.advance('walkingTo')
        break
      }
      case 'placing': {
        // a held sparkler faces the camera so its glow lights the face
        if (def?.held) face(cam.x, cam.z)
        else face(spotX, spotZ)
        if (t > 0.6 && !rt.placed) rt.placed = true
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
          if (goTo(current.retreat[0], current.retreat[1], 0.7)) st.advance('retreating')
          face(cam.x, cam.z)
        } else if (follow('retreat', current.retreat[0], current.retreat[1], RUN_SPEED)) st.advance('retreating')
        break
      }
      case 'waiting': {
        if (def?.held) face(cam.x, cam.z)
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
    // walls, buildings, props; other crackers' danger zones are a soft barrier
    resolveCircle(rig.pos)
    pushOutOfDanger(rig.pos, AGENT_R, current ? current.id : null)
    local.running = speed > 3.2

    // camera focus
    rig.focusPoint.set(spotX, 0, spotZ)
    if (phase === 'waiting') rig.focusMode = def?.aerial ? 'sky' : def?.held ? 'child' : 'cracker'
    else if (phase === 'retreating' && !def?.held) rig.focusMode = 'cracker'
    else rig.focusMode = 'child'

    // turn smoothly
    rig.yaw += angleDiff(rig.yaw, local.yawT) * (1 - Math.exp(-8 * dt))

    // ----- pose targets -----
    for (const k of JOINTS) tgt[k] = 0
    const running = (phase === 'retreating' && !def?.held) || local.running
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
      if (def?.kind === 'capgun') {
        // load the red cap roll with the left hand, then raise the toy to the sky
        tgt.shRx = phase === 'placing' ? -1.2 : -2.55
        tgt.elRx = -0.12
        if (phase === 'placing') {
          tgt.shLx = -1.25
          tgt.shLz = -0.45
          tgt.elLx = -0.9
        } else {
          tgt.shLx = 0
          tgt.shLz = 0.12
          tgt.elLx = -0.2
        }
        tgt.head = phase === 'placing' ? 0.2 : -0.3
      }
    } else if (phase === 'waiting' && def?.kind === 'capgun') {
      // toy held up at the sky (no recoil); pull the trigger
      poseIdle(tgt, time)
      tgt.shRx = -2.55
      tgt.shRz = -0.1
      tgt.elRx = -0.12
      tgt.head = -0.32
      lambda = 9
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

    // head look-at: the cracker while watching, nearby people now and then when idle
    let lookX = null
    let lookZ = null
    if ((phase === 'waiting' || phase === 'lighting') && current && !def?.held) {
      lookX = spotX
      lookZ = spotZ
    } else if (phase === 'idle' && !moving && Math.sin(time * 0.45) > 0.2) {
      let best = 49
      for (const p of LIVE_PEOPLE) {
        const d2 = (p.x - rig.pos.x) ** 2 + (p.z - rig.pos.z) ** 2
        if (d2 < best) {
          best = d2
          lookX = p.x
          lookZ = p.z
        }
      }
    }
    if (lookX !== null) {
      const a = angleDiff(rig.yaw, Math.atan2(lookX - rig.pos.x, lookZ - rig.pos.z))
      tgt.headY = THREE.MathUtils.clamp(a, -0.95, 0.95)
    }
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
    J.head.rotation.y = cur.headY
    J.spine.rotation.z = cur.sway
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
    stickL.current.visible = def?.kind === 'sparkler' && phase === 'lighting'
    const showSparkler = def?.kind === 'sparkler' && rt?.placed && !rt.done && phase !== 'idle'
    const showCap = def?.kind === 'capgun' && rt?.placed && !rt.done && phase !== 'idle'
    capgun.current.visible = showCap
    if (showCap) for (let k = 0; k < capSpots.current.length; k++) if (capSpots.current[k]) capSpots.current[k].visible = k < (rt.pulls || 0)
    sparkler.current.visible = showSparkler
    if (showSparkler) {
      const burn = rt.burn || 0
      sparkTip.current.position.y = -0.33 * (1 - burn * 0.8)
      burnt.current.scale.y = Math.max(0.001, burn * 0.8)
    }

    // ----- life: breathing, blinks, expressions, fingers -----
    const excited = phase === 'waiting' || phase === 'celebrating' || running
    const br = Math.sin(time * (excited ? 4.2 : 1.7))
    J.chest.scale.set(1 + br * 0.012, 1 + br * 0.006, 1 + br * 0.016)
    if (time > local.nextBlink) {
      local.blinkT = 0.13
      local.nextBlink = time + 2 + Math.random() * 3.5
    }
    local.blinkT = Math.max(0, local.blinkT - dt)
    const squint = phase === 'waiting' && !def?.held && !def?.aerial ? 0.55 : 1
    J.eyes.scale.y = damp(J.eyes.scale.y, local.blinkT > 0 ? 0.1 : squint, 35, dt)
    const wow = phase === 'celebrating' ? 0.9 + 0.1 * Math.sin(time * 14) : phase === 'waiting' && fx.flash > 0.25 ? 0.8 : 0
    local.mouth = damp(local.mouth, wow, 10, dt)
    J.mouthOpen.scale.y = Math.max(0.001, local.mouth)
    J.smile.visible = local.mouth < 0.3
    J.browL.position.y = J.browR.position.y = 0.128 + local.mouth * 0.009
    const relax = 0.35 + Math.sin(time * 1.3) * 0.05
    const cheer = phase === 'celebrating' ? 0.08 : null
    const holdR = stickR.current.visible || sparkler.current.visible || capgun.current.visible
    curlFingers(J, 'R', -1, holdR ? 1.45 : (cheer ?? relax), dt)
    curlFingers(J, 'L', 1, stickL.current.visible ? 1.45 : (cheer ?? (phase === 'waiting' ? 0.22 : relax)), dt)
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
        <Leg side={1} set={set} />
        <Leg side={-1} set={set} />
        <Hem hemRef={hem} />
        <group ref={set('spine')}>
          <Torso set={set} />
          <group ref={set('head')} position={[0, 0.53, 0]}>
            <Head set={set} />
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
            <group ref={capgun} visible={false} rotation-x={-1.57}>
              <ToyCapGun spots={capSpots} />
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

// Curl the four fingers (and thumb) of one hand toward the palm.
function curlFingers(J, s, side, target, dt) {
  for (let i = 0; i < 4; i++) {
    const f = J[`f${s}${i}`]
    if (f) f.rotation.z = damp(f.rotation.z, -side * target * (0.9 + i * 0.08), 14, dt)
  }
  const th = J[`th${s}`]
  if (th) th.rotation.x = damp(th.rotation.x, 0.55 + target * 0.5, 14, dt)
}

// Bright, chunky toy cap gun (clearly a toy: candy colours, rounded, no realistic
// detail). Barrel along local -Y from the fist; red paper cap roll on the side.
const toy = {
  red: new THREE.MeshStandardMaterial({ color: '#ef3b2c', roughness: 0.45 }),
  yellow: new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.4 }),
  blue: new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.45 }),
  orange: new THREE.MeshStandardMaterial({ color: '#fb923c', roughness: 0.4, emissive: '#7c2d12', emissiveIntensity: 0.4 }),
  cap: new THREE.MeshStandardMaterial({ color: '#d1122f', roughness: 0.8 }),
  burnt: new THREE.MeshBasicMaterial({ color: '#1a1210' }),
}
function ToyCapGun({ spots }) {
  return (
    <group position={[0, -0.02, 0.0]}>
      {/* body */}
      <mesh material={toy.red} position={[0, -0.05, 0.02]}>
        <capsuleGeometry args={[0.026, 0.07, 4, 10]} />
      </mesh>
      {/* chunky yellow barrel with a bright orange safety tip */}
      <mesh material={toy.yellow} position={[0, -0.12, 0.03]}>
        <cylinderGeometry args={[0.015, 0.017, 0.07, 12]} />
      </mesh>
      <mesh material={toy.orange} position={[0, -0.162, 0.03]}>
        <cylinderGeometry args={[0.018, 0.018, 0.016, 12]} />
      </mesh>
      {/* grip and trigger guard */}
      <mesh material={toy.blue} position={[0, -0.01, -0.035]} rotation-x={0.35}>
        <boxGeometry args={[0.03, 0.06, 0.035]} />
      </mesh>
      <mesh material={toy.blue} position={[0, -0.045, -0.012]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.013, 0.004, 6, 12]} />
      </mesh>
      {/* red paper cap roll + strip with burnt spots (one per pull) */}
      <mesh material={toy.cap} position={[0.03, -0.03, 0.03]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.016, 0.016, 0.01, 14]} />
      </mesh>
      <mesh material={toy.cap} position={[0.031, -0.075, 0.03]}>
        <boxGeometry args={[0.004, 0.07, 0.01]} />
      </mesh>
      {Array.from({ length: 10 }, (_, k) => (
        <mesh key={k} ref={(el) => (spots.current[k] = el)} material={toy.burnt} position={[0.0335, -0.045 - k * 0.0065, 0.03]} visible={false}>
          <boxGeometry args={[0.002, 0.004, 0.007]} />
        </mesh>
      ))}
      {/* where the cap pops (just above the hammer) */}
      <group ref={(el) => (rig.capPoint = el)} position={[0.02, -0.035, 0.05]} />
    </group>
  )
}
