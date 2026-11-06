import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { REGISTRY, CATEGORIES, KINDS } from '../src/crackers/registry.js'
import { SOUND_BUILDERS } from '../src/audio/synth.js'

// pattern names, parsed from patterns.js (it imports JSX helpers, so not imported here)
const patSrc = readFileSync(new URL('../src/crackers/patterns.js', import.meta.url), 'utf8')
const block = patSrc.slice(patSrc.indexOf('const PATTERNS = {'), patSrc.indexOf('// Delayed glittering pops'))
const PATTERNS = new Set([...block.matchAll(/^ {2}(\w+)\(/gm)].map((m) => m[1]))

test('about 30+ crackers, unique ids and unique signatures', () => {
  assert.ok(REGISTRY.length >= 30, `only ${REGISTRY.length}`)
  const ids = new Set(REGISTRY.map((r) => r.id))
  assert.equal(ids.size, REGISTRY.length, 'duplicate id')
  const sigs = new Set(REGISTRY.map((r) => r.signature))
  assert.equal(sigs.size, REGISTRY.length, 'two crackers share a signature')
})

test('every entry has the required fields and a known kind / category', () => {
  const cats = new Set(CATEGORIES.map((c) => c.id))
  for (const r of REGISTRY) {
    for (const k of ['id', 'name', 'hindi', 'category', 'hint', 'signature', 'kind', 'handling']) assert.ok(r[k], `${r.id} missing ${k}`)
    assert.ok(KINDS.includes(r.kind), `${r.id} unknown kind ${r.kind}`)
    assert.ok(cats.has(r.category), `${r.id} unknown category ${r.category}`)
    assert.ok(/[ऀ-ॿ]/.test(r.hindi), `${r.id} hindi name is not Devanagari`)
    assert.ok(typeof r.danger === 'number' && r.danger > 0, `${r.id} danger radius`)
    if (r.handling === 'held') assert.ok(['sparkler', 'capgun'].includes(r.kind), `${r.id} held kind`)
  }
})

test('group coverage: A sky >= 14, B ground >= 10, C sound >= 5, D toy cap gun, hand-held sparkler', () => {
  const by = (c) => REGISTRY.filter((r) => r.category === c).length
  assert.ok(by('sky') >= 14, `sky ${by('sky')}`)
  assert.ok(by('ground') >= 10, `ground ${by('ground')}`)
  assert.ok(by('sound') >= 5, `sound ${by('sound')}`)
  assert.ok(REGISTRY.some((r) => r.kind === 'capgun' && r.category === 'toy'))
  assert.ok(REGISTRY.some((r) => r.kind === 'sparkler' && r.category === 'handheld'))
})

test('config-driven entries are complete: shells, fountains, spinners, bombs, chains', () => {
  for (const r of REGISTRY) {
    const p = r.params
    if (r.kind === 'shells') {
      assert.ok(p && p.fuse > 0 && p.launcher, `${r.id} shells fuse/launcher`)
      assert.ok(['mortar', 'rocket', 'comet', 'candle', 'gatling'].includes(p.launcher), `${r.id} launcher`)
      const shots = p.shots || []
      assert.ok(shots.length || (p.gen && p.gen.count > 0), `${r.id} has no shots`)
      for (const s of shots) {
        if (s.pattern) assert.ok(PATTERNS.has(s.pattern), `${r.id} unknown pattern ${s.pattern}`)
        if (s.sound) assert.ok(SOUND_BUILDERS[s.sound], `${r.id} unknown sound ${s.sound}`)
      }
      if (p.gen) for (const pat of p.gen.patterns) assert.ok(PATTERNS.has(pat), `${r.id} unknown gen pattern ${pat}`)
      if (p.gen?.finale) assert.ok(PATTERNS.has(p.gen.finale.pattern), `${r.id} finale pattern`)
    }
    if (r.kind === 'fountain') {
      for (const k of ['fuse', 'ramp', 'hold', 'fade', 'rate', 'palette', 'sound']) assert.ok(p[k] !== undefined, `${r.id} fountain ${k}`)
      assert.ok(SOUND_BUILDERS[p.sound], `${r.id} sound ${p.sound}`)
      if (p.siren) assert.ok(SOUND_BUILDERS[p.siren], `${r.id} siren sound`)
    }
    if (r.kind === 'spinner') assert.ok(SOUND_BUILDERS[p.sound], `${r.id} spinner sound`)
    if (r.kind === 'bomb') {
      for (const k of ['fuse', 'power', 'ring', 'flash', 'light', 'shake', 'sound', 'end']) assert.ok(p[k] !== undefined, `${r.id} bomb ${k}`)
      assert.ok(SOUND_BUILDERS[p.sound], `${r.id} bomb sound ${p.sound}`)
    }
    if (r.kind === 'chain') assert.ok(p.n > 0 && p.gap?.length === 2, `${r.id} chain params`)
  }
})

test('the patterns library has every requested burst type', () => {
  for (const k of ['peony', 'chrysanthemum', 'willow', 'palm', 'ring', 'doubleRing', 'spiral', 'heart', 'crossette', 'horsetail', 'strobe', 'crackle', 'pistil', 'peacock'])
    assert.ok(PATTERNS.has(k), `missing pattern ${k}`)
})
