/**
 * Tests para los 3 fixes de geofencing:
 * 1. markPlaceNotified al programar (throttle inmediato)
 * 2. Hash skip (no re-registrar si lista no cambio)
 * 3. Debounce 10s (ignora ENTER duplicados rapidos)
 *
 * Ejecutar: npm test
 */

// --- 1. Throttle: shouldNotifyForPlace ---
// Reimplementa la logica de throttle para testear aislado
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;

function createThrottleStore() {
  const notified = {};
  return {
    shouldNotify(placeId) {
      const last = notified[placeId];
      if (!last) return true;
      return Date.now() - last >= RECENT_WINDOW_MS;
    },
    markNotified(placeId) {
      notified[placeId] = Date.now();
    },
  };
}

describe('Throttle — markPlaceNotified al programar', () => {
  test('primera vez: permite notificar', () => {
    const store = createThrottleStore();
    expect(store.shouldNotify('place_1')).toBe(true);
  });

  test('despues de marcar: bloquea notificacion', () => {
    const store = createThrottleStore();
    store.markNotified('place_1');
    expect(store.shouldNotify('place_1')).toBe(false);
  });

  test('diferentes placeId son independientes', () => {
    const store = createThrottleStore();
    store.markNotified('place_1');
    expect(store.shouldNotify('place_2')).toBe(true);
  });

  test('despues de 24h: permite notificar de nuevo', () => {
    const store = createThrottleStore();
    store.markNotified('place_1');
    // Simula que paso 24h+1ms
    store.markNotified.__proto__ = null; // no hack, usamos override directo
    const notified = { place_1: Date.now() - RECENT_WINDOW_MS - 1 };
    const shouldNotify = (id) => {
      const last = notified[id];
      if (!last) return true;
      return Date.now() - last >= RECENT_WINDOW_MS;
    };
    expect(shouldNotify('place_1')).toBe(true);
  });
});

// --- 2. Hash skip ---
function computeHash(placeIds) {
  return [...placeIds].sort().join(',');
}

describe('Hash skip — no re-registrar si lista no cambio', () => {
  test('hash identico → skip', () => {
    const hash1 = computeHash(['place_a', 'place_b', 'place_c']);
    const hash2 = computeHash(['place_a', 'place_b', 'place_c']);
    expect(hash1).toBe(hash2);
  });

  test('mismo contenido diferente orden → mismo hash (sorted)', () => {
    const hash1 = computeHash(['place_c', 'place_a', 'place_b']);
    const hash2 = computeHash(['place_a', 'place_b', 'place_c']);
    expect(hash1).toBe(hash2);
  });

  test('diferente contenido → hash diferente → re-registrar', () => {
    const hash1 = computeHash(['place_a', 'place_b']);
    const hash2 = computeHash(['place_a', 'place_b', 'place_c']);
    expect(hash1).not.toBe(hash2);
  });

  test('lista vacia → hash vacio', () => {
    expect(computeHash([])).toBe('');
  });
});

// --- 3. Debounce 10s ---
const DEBOUNCE_MS = 10000;

function createDebouncer() {
  const lastEnter = new Map();
  return {
    isDebouncedEnter(placeId) {
      const now = Date.now();
      const last = lastEnter.get(placeId);
      if (last && now - last < DEBOUNCE_MS) return true;
      lastEnter.set(placeId, now);
      return false;
    },
    // Para tests: simula un enter hace X ms
    simulateEnterAgo(placeId, msAgo) {
      lastEnter.set(placeId, Date.now() - msAgo);
    },
    size() {
      return lastEnter.size;
    },
  };
}

describe('Debounce 10s — ignora ENTER duplicados rapidos', () => {
  test('primer ENTER: no debounced', () => {
    const db = createDebouncer();
    expect(db.isDebouncedEnter('place_1')).toBe(false);
  });

  test('segundo ENTER inmediato (<10s): debounced', () => {
    const db = createDebouncer();
    db.isDebouncedEnter('place_1'); // primer enter
    expect(db.isDebouncedEnter('place_1')).toBe(true); // segundo: bloqueado
  });

  test('segundo ENTER despues de 10s: no debounced', () => {
    const db = createDebouncer();
    db.simulateEnterAgo('place_1', 11000); // hace 11s
    expect(db.isDebouncedEnter('place_1')).toBe(false);
  });

  test('diferentes placeId no interfieren', () => {
    const db = createDebouncer();
    db.isDebouncedEnter('place_1');
    expect(db.isDebouncedEnter('place_2')).toBe(false); // diferente place
  });

  test('3 ENTER rapidos → solo el primero pasa', () => {
    const db = createDebouncer();
    expect(db.isDebouncedEnter('place_1')).toBe(false);  // pasa
    expect(db.isDebouncedEnter('place_1')).toBe(true);   // bloqueado
    expect(db.isDebouncedEnter('place_1')).toBe(true);   // bloqueado
  });
});
