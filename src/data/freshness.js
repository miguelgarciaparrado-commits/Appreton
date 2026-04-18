// Helper para calcular color de pin segun rating + antiguedad de la ultima review.
// Concepto: "Decaimiento Visual del Dato" — los sitios con reviews recientes
// se ven vivos, los viejos se apagan hasta gris (>7 dias o sin reviews).

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const GRAY = '#BDBDBD';

const COLOR_MATRIX = {
  limpio: {
    fresh: '#00C853',
    recent: '#4CAF50',
    old: '#81C784',
    stale: '#9E9E9E',
  },
  pasable: {
    fresh: '#FFD600',
    recent: '#FFC107',
    old: '#FFE082',
    stale: '#9E9E9E',
  },
  evitar: {
    fresh: '#D50000',
    recent: '#F44336',
    old: '#E57373',
    stale: '#9E9E9E',
  },
};

export function ratingToEstado(rating) {
  if (rating == null) return null;
  if (rating >= 4) return 'limpio';
  if (rating >= 3) return 'pasable';
  if (rating >= 1) return 'evitar';
  return null;
}

export function estadoEmoji(estado) {
  if (estado === 'limpio') return '🟢';
  if (estado === 'pasable') return '🟡';
  if (estado === 'evitar') return '🔴';
  return '⚪';
}

export function estadoLabel(estado) {
  if (estado === 'limpio') return 'Limpio';
  if (estado === 'pasable') return 'Pasable';
  if (estado === 'evitar') return 'Evitar';
  return 'Sin datos';
}

export function getFreshnessBucket(hoursAgo) {
  if (hoursAgo == null) return null;
  if (hoursAgo < 2) return 'fresh';
  if (hoursAgo < 24) return 'recent';
  if (hoursAgo < 24 * 7) return 'old';
  return 'stale';
}

export function hoursSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / HOUR_MS;
}

export function getPinColor(rating, lastReviewDate) {
  const hours = hoursSince(lastReviewDate);
  const estado = ratingToEstado(rating);
  if (!estado || hours == null) return GRAY;
  const bucket = getFreshnessBucket(hours);
  if (bucket === 'stale') return '#9E9E9E';
  return COLOR_MATRIX[estado][bucket];
}

export function formatAgo(dateStr) {
  const hours = hoursSince(dateStr);
  if (hours == null) return 'sin datos';
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `Hace ${mins} min`;
  }
  if (hours < 24) {
    const h = Math.round(hours);
    return `Hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  }
  const days = Math.round(hours / 24);
  return `Hace ${days} ${days === 1 ? 'dia' : 'dias'}`;
}
