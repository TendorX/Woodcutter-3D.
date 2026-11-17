// Слой сохранения. Сейчас — LocalStorage по Telegram ID (или 'local' вне Telegram).
// Для Supabase замените только provider.load/save (например, вызовом Edge Function с uid) — остальной код не меняется.
const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'local';
const KEY = 'lumberjack_v1_' + uid;
export const DEFAULT = { coins: 0, xp: 0, axes: ['old'], bags: ['small'], axe: 'old', bag: 'small',
  stats: { trees: 0, picked: 0, delivered: 0 }, claimed: [] };
export const provider = {
  load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* хранилище недоступно */ } },
};
export function load() {
  const d = provider.load(), base = structuredClone(DEFAULT);
  return d ? { ...base, ...d, stats: { ...base.stats, ...d.stats } } : base;
}
export const save = (d) => provider.save(d);
