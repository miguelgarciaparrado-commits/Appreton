/**
 * Tests para el calculo de frescura del timestamp del "ultimo reporte"
 * en PlaceDetailScreen. Bug historico: al publicar una opinion, el header
 * mostraba "Hace 18 horas" en vez de "Hace unos minutos" porque se
 * guardaba solo la fecha (sin hora) y JS la parseaba como medianoche UTC.
 *
 * Ejecutar: npm test
 */

const {
  hoursSince,
  formatAgo,
  getFreshnessBucket,
  getPinColor,
  ratingToEstado,
} = require('../src/data/freshness');

describe('formatAgo — timestamp del ultimo reporte', () => {
  test('Hace unos minutos cuando la opinion se acaba de publicar', () => {
    const now = new Date().toISOString();
    const label = formatAgo(now);
    expect(label).toMatch(/^Hace \d+ min$/);
    const mins = parseInt(label.match(/\d+/)[0], 10);
    expect(mins).toBeLessThanOrEqual(1);
  });

  test('Hace X min durante los primeros 59 minutos', () => {
    const d = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(formatAgo(d)).toBe('Hace 30 min');
  });

  test('Durante la primera hora nunca debe decir "Hace X horas"', () => {
    for (const minsAgo of [1, 15, 30, 45, 59]) {
      const d = new Date(Date.now() - minsAgo * 60 * 1000).toISOString();
      const label = formatAgo(d);
      expect(label).not.toMatch(/horas?$/);
      expect(label).toMatch(/min$/);
    }
  });

  test('Hace 1 hora / Hace X horas pasado los 60 min', () => {
    const d1 = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatAgo(d1)).toBe('Hace 1 hora');
    const d3 = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatAgo(d3)).toBe('Hace 3 horas');
  });

  test('Hace X dias pasado las 24h', () => {
    const d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatAgo(d)).toBe('Hace 3 dias');
  });

  test('"sin datos" cuando no hay fecha', () => {
    expect(formatAgo(null)).toBe('sin datos');
    expect(formatAgo('')).toBe('sin datos');
    expect(formatAgo('invalid-date')).toBe('sin datos');
  });
});

describe('Regresion del bug "Hace 18 horas"', () => {
  // Solo fecha sin hora (formato viejo) puede provocar drift de timezone
  // Verificamos que el formato nuevo (ISO completo) de una opinion recien
  // publicada siempre reporta <1h aunque el usuario este en UTC+14
  test('ISO completo recien creado reporta <1h independiente de timezone', () => {
    const justNow = new Date().toISOString();
    const hours = hoursSince(justNow);
    expect(hours).toBeGreaterThanOrEqual(0);
    expect(hours).toBeLessThan(1);
  });

  test('Bucket "fresh" para opiniones de <2h', () => {
    const now = new Date().toISOString();
    const d1h = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    expect(getFreshnessBucket(hoursSince(now))).toBe('fresh');
    expect(getFreshnessBucket(hoursSince(d1h))).toBe('fresh');
  });

  test('Color verde brillante para rating 5 recien publicado', () => {
    const now = new Date().toISOString();
    expect(getPinColor(5, now)).toBe('#00C853');
  });
});

describe('Integracion: seleccion del ultimo review de una lista', () => {
  // Simula la logica de PlaceDetailScreen: dadas varias reviews,
  // la mas reciente (createdAt o date como fallback) es la que se usa
  // para el encabezado "Hace X".
  function pickLatest(reviews) {
    return reviews.reduce((a, b) => {
      const da = new Date(a.createdAt || a.date);
      const db = new Date(b.createdAt || b.date);
      return da > db ? a : b;
    }).createdAt || reviews[0]?.date;
  }

  test('selecciona createdAt de la review mas reciente', () => {
    const oldReview = { date: '2026-04-20', createdAt: '2026-04-20T12:00:00Z' };
    const newReview = {
      date: '2026-04-22',
      createdAt: new Date().toISOString(),
    };
    const latest = pickLatest([oldReview, newReview]);
    expect(latest).toBe(newReview.createdAt);
    expect(formatAgo(latest)).toMatch(/min$/);
  });

  test('tras publicar nueva review, header muestra "Hace 0-5 min"', () => {
    const existing = [
      { date: '2026-04-21', createdAt: '2026-04-21T10:00:00Z' },
      { date: '2026-04-20', createdAt: '2026-04-20T15:30:00Z' },
    ];
    const newlyPublished = {
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    const all = [...existing, newlyPublished];
    const latest = pickLatest(all);
    const label = formatAgo(latest);
    expect(label).toMatch(/^Hace \d+ min$/);
    const mins = parseInt(label.match(/\d+/)[0], 10);
    expect(mins).toBeLessThanOrEqual(5);
  });
});

describe('ratingToEstado', () => {
  test('rating >= 4 → limpio', () => {
    expect(ratingToEstado(5)).toBe('limpio');
    expect(ratingToEstado(4.5)).toBe('limpio');
    expect(ratingToEstado(4)).toBe('limpio');
  });
  test('rating 3-3.9 → pasable', () => {
    expect(ratingToEstado(3)).toBe('pasable');
    expect(ratingToEstado(3.9)).toBe('pasable');
  });
  test('rating 1-2.9 → evitar', () => {
    expect(ratingToEstado(1)).toBe('evitar');
    expect(ratingToEstado(2.5)).toBe('evitar');
  });
  test('rating null o 0 → null', () => {
    expect(ratingToEstado(null)).toBe(null);
    expect(ratingToEstado(0)).toBe(null);
  });
});
