import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DICTS, translate } from '../src/i18n/index.js'
import { REGISTRY } from '../src/crackers/registry.js'

const leaves = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? leaves(v, `${prefix}${k}.`) : [`${prefix}${k}`]))

test('Hindi and Marathi have every English UI key (no missing keys)', () => {
  const keys = leaves({ ui: DICTS.en.ui, phase: DICTS.en.phase, cat: DICTS.en.cat, place: DICTS.en.place, hint: DICTS.en.hint, sign: DICTS.en.sign })
  for (const lang of ['hi', 'mr']) {
    const missing = keys.filter((k) => k.split('.').reduce((o, p) => o?.[p], DICTS[lang]) == null)
    assert.deepEqual(missing, [], `${lang} missing: ${missing.join(', ')}`)
  }
})

test('every cracker has a name and hint in all three languages, Devanagari for hi/mr', () => {
  for (const r of REGISTRY) {
    for (const lang of ['en', 'hi', 'mr']) {
      const e = DICTS[lang].crackers[r.id]
      assert.ok(e && e[0] && e[1], `${lang} ${r.id}`)
      if (lang !== 'en') assert.ok(/[ऀ-ॿ]/.test(e[0]), `${lang} ${r.id} name not Devanagari`)
    }
  }
})

test('translate interpolates and falls back to English', () => {
  assert.equal(translate('en', 'ui.pickOne', { n: 46 }), '46 to try. Pick one and Aarav lights it.')
  assert.ok(translate('mr', 'ui.pickOne', { n: 46 }).startsWith('46'))
  assert.equal(translate('hi', 'nope.key'), 'nope.key')
})
