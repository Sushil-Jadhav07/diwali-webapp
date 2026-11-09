// CC0 PBR texture sets from Poly Haven (public/assets/textures/<id>/<part>.jpg, 1K;
// sources in CREDITS.md). Loaded asynchronously (no Suspense) and cached.
//
// Detail maps (normal + roughness) are tier-aware: the Low tier drops them
// (cheaper shading); every other tier uses them. Colour maps are always on.
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

const loader = new THREE.TextureLoader()
const images = new Map() // url -> base texture (shares its decoded image with clones)
const BASE = `${import.meta.env.BASE_URL}assets/textures/`

function base(url, srgb) {
  let t = images.get(url)
  if (!t) {
    t = loader.load(url)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = 8
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    images.set(url, t)
  }
  return t
}

const KEY = { diff: 'map', nor: 'normalMap', rough: 'roughnessMap' }

// pbr('asphalt_02', [6, 2], ['diff', 'nor', 'rough']) -> { map, normalMap, roughnessMap }
// Each call returns textures with their own repeat (clones share the image).
export function pbr(id, repeat = [1, 1], parts = ['diff', 'nor', 'rough']) {
  const out = {}
  for (const p of parts) {
    const t = base(`${BASE}${id}/${p}.jpg`, p === 'diff').clone()
    t.repeat.set(repeat[0], repeat[1])
    t.needsUpdate = true
    out[KEY[p]] = t
  }
  return out
}

// ---- tier-aware detail maps ----
const detailed = new Set()
let lowTier = false

function applyOne(e) {
  const want = !lowTier
  const m = e.mat
  const n = want ? e.normalMap || null : null
  const r = want ? e.roughnessMap || null : null
  if (m.normalMap !== n || m.roughnessMap !== r) {
    m.normalMap = n
    m.roughnessMap = r
    m.needsUpdate = true
  }
}

// Registers a material's normal/roughness maps; returns the entry (for removeDetail).
export function addDetail(mat, { normalMap, roughnessMap, normalScale = 1 }) {
  const e = { mat, normalMap, roughnessMap }
  mat.normalScale.set(normalScale, normalScale)
  detailed.add(e)
  applyOne(e)
  return e
}
export function removeDetail(e) {
  detailed.delete(e)
}
export function setDetailTier(tier) {
  lowTier = tier === 'low'
  detailed.forEach(applyOne)
}

// For JSX materials: <meshStandardMaterial ref={useDetail(maps)} map={maps.map} />
export function useDetail(maps, normalScale = 1) {
  const ref = useRef()
  useLayoutEffect(() => {
    if (!ref.current) return undefined
    const e = addDetail(ref.current, { normalMap: maps.normalMap, roughnessMap: maps.roughnessMap, normalScale })
    return () => removeDetail(e)
  }, [maps, normalScale])
  return ref
}
