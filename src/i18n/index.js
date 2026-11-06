// Tiny i18n layer: English / हिन्दी / मराठी. t('ui.start', { n }) with English fallback.
import en from './en.js'
import hi from './hi.js'
import mr from './mr.js'

export const DICTS = { en, hi, mr }
export const LANGS = ['en', 'hi', 'mr']
export const LANG_LABEL = en.lang
const KEY = 'dcp.lang'

export function savedLang() {
  try {
    const v = localStorage.getItem(KEY)
    return LANGS.includes(v) ? v : null
  } catch {
    return null
  }
}
export function saveLang(l) {
  try {
    localStorage.setItem(KEY, l)
  } catch {
    /* storage unavailable */
  }
}

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)

export function translate(lang, key, vars) {
  let s = get(DICTS[lang], key)
  if (s == null) s = get(en, key)
  if (s == null) return key
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`))
  return s
}

export const crackerName = (lang, id) => (DICTS[lang]?.crackers?.[id] || en.crackers[id] || [id])[0]
export const crackerHint = (lang, id) => (DICTS[lang]?.crackers?.[id] || en.crackers[id] || ['', ''])[1]
// the secondary (Devanagari) name shown under the main one
export const crackerAltName = (lang, id) => (lang === 'en' ? hi.crackers[id]?.[0] : en.crackers[id]?.[0]) || ''
