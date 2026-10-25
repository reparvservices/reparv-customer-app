// utils/formatArea.js
export function formatArea(builtUpArea) {
  if (!builtUpArea) return '--';

  const raw = String(builtUpArea).trim();

  const farmMatch = raw.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (farmMatch) {
    const num = Number(farmMatch[1]);
    const unit = farmMatch[2];
    return `${num.toLocaleString('en-IN')} ${unit}`;
  }

  const num = Number(raw);
  return isNaN(num) ? raw : `${num.toLocaleString('en-IN')} sq.ft`;
}
