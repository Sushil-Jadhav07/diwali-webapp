import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WORLD, BLOCKS, PLACES, START, CRACKER_GROUND, SEGMENTS, GATE } from '../src/world/layout.js'
import { isFree, resolveCircle, clampToBounds, findPath, lineClear, segmentHit, nearestFree, AGENT_R } from '../src/world/collision.js'
import { findPlacement, findRetreat, spotProblem, addDanger, clearDanger, pushOutOfDanger, DANGER_R } from '../src/world/safety.js'

test('world is 6-10x the old courtyard (~480 m2)', () => {
  const area = (WORLD.maxX - WORLD.minX) * (WORLD.maxZ - WORLD.minZ)
  assert.ok(area >= 480 * 6 && area <= 480 * 10, `area ${area}`)
})

test('start, places and cracker-ground centre are walkable', () => {
  assert.ok(isFree(START.x, START.z), 'start')
  for (const p of PLACES) assert.ok(isFree(p.x, p.z), `place ${p.id}`)
  assert.ok(isFree((CRACKER_GROUND.minX + CRACKER_GROUND.maxX) / 2, (CRACKER_GROUND.minZ + CRACKER_GROUND.maxZ) / 2))
})

test('blocks and the closed gate are solid; outside the wall is not walkable', () => {
  for (const b of BLOCKS) assert.equal(isFree((b.minX + b.maxX) / 2, (b.minZ + b.maxZ) / 2), false, b.id)
  assert.equal(isFree(GATE.x, GATE.z - 0.1), false, 'gate')
  assert.equal(isFree(0, WORLD.maxZ + 2), false, 'outside')
  assert.ok(SEGMENTS.length >= 12)
})

test('resolveCircle pushes an agent out of a block and keeps it in bounds', () => {
  const b = BLOCKS[0]
  const p = { x: b.maxX - 0.1, z: (b.minZ + b.maxZ) / 2 }
  resolveCircle(p)
  assert.ok(isFree(p.x, p.z, AGENT_R - 0.01), JSON.stringify(p))
  const q = clampToBounds({ x: 999, z: -999 })
  assert.ok(q.x <= WORLD.maxX && q.z >= WORLD.minZ)
})

test('A* finds a valid path between every pair of places', () => {
  for (const a of PLACES) {
    for (const b of PLACES) {
      if (a === b) continue
      const path = findPath(a.x, a.z, b.x, b.z)
      assert.ok(path && path.length, `${a.id} -> ${b.id}`)
      let px = a.x
      let pz = a.z
      for (const w of path) {
        assert.ok(lineClear(px, pz, w.x, w.z, AGENT_R - 0.02), `${a.id}->${b.id} segment blocked`)
        px = w.x
        pz = w.z
      }
      assert.ok(Math.hypot(px - b.x, pz - b.z) < 0.6, `${a.id}->${b.id} ends near target`)
    }
  }
})

test('a click inside a building resolves to a reachable nearby point', () => {
  const b = BLOCKS[1]
  const path = findPath(0, -4, (b.minX + b.maxX) / 2, b.maxZ - 0.5)
  assert.ok(path && path.length)
  const end = path[path.length - 1]
  assert.ok(isFree(end.x, end.z))
})

test('camera segment through a block is cut short; open sky is not', () => {
  const b = BLOCKS[1]
  const t = segmentHit(0, 1.5, -4, 0, 4, (b.minZ + b.maxZ) / 2)
  assert.ok(t < 1, `t=${t}`)
  assert.equal(segmentHit(0, 1.5, -4, 0, 6, 2), 1)
})

test('placement: valid ahead on the Cracker Ground, moved away from people and other crackers', () => {
  const ok = findPlacement(0, 0, Math.PI, 'ground')
  assert.ok(ok && !ok.moved)
  const crowd = findPlacement(0, 0, Math.PI, 'ground', [{ x: 0, z: -1.6 }])
  assert.ok(crowd && crowd.moved && crowd.reason === 'people')
  assert.ok(Math.hypot(crowd.x - 0, crowd.z + 1.6) >= 1.2)
  addDanger('t1', 0, -1.6, DANGER_R.sound)
  const near = findPlacement(0, 0, Math.PI, 'ground')
  assert.ok(near.moved && near.reason === 'other-cracker')
  assert.equal(spotProblem(near.x, near.z, 'ground'), null)
  clearDanger()
})

test('placement next to a building or on the rangoli is moved', () => {
  const b = BLOCKS[0]
  const p = findPlacement(b.maxX + 0.6, -10, Math.PI / 2, 'sky')
  assert.ok(p && p.moved)
  assert.equal(spotProblem(p.x, p.z, 'sky'), null)
})

test('retreat point is outside the danger radius and walkable; pushOutOfDanger works', () => {
  const spot = { x: 0, z: -2 }
  const r = findRetreat(spot, { x: 0, z: 0 }, DANGER_R.sky)
  assert.ok(Math.hypot(r.x - spot.x, r.z - spot.z) >= DANGER_R.sky + 1)
  assert.ok(isFree(r.x, r.z))
  addDanger('t2', 0, -2, 3)
  const p = pushOutOfDanger({ x: 0.2, z: -2 })
  assert.ok(Math.hypot(p.x, p.z + 2) >= 3)
  clearDanger()
  assert.ok(nearestFree(0, -24) !== null)
})
