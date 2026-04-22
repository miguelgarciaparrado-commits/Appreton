/**
 * Tests para la validacion de opiniones.
 * La nueva logica: texto es opcional, solo se filtra spam evidente.
 *
 * Ejecutar: npm test
 */

// Reimplementa isSpam para testear (misma logica que AddReviewScreen)
function isSpam(text) {
  if (!text || text.length < 2) return true;
  if (/https?:\/\/|www\./i.test(text)) return true;
  if (/(.)\1{7,}/.test(text)) return true;
  return false;
}

describe('isSpam — filtro de spam basico', () => {
  test('texto vacio o null es spam', () => {
    expect(isSpam('')).toBe(true);
    expect(isSpam(null)).toBe(true);
    expect(isSpam(undefined)).toBe(true);
  });

  test('texto de 1 caracter es spam', () => {
    expect(isSpam('a')).toBe(true);
    expect(isSpam('.')).toBe(true);
  });

  test('texto de 2+ caracteres NO es spam', () => {
    expect(isSpam('ok')).toBe(false);
    expect(isSpam('bien')).toBe(false);
  });

  test('URLs son spam', () => {
    expect(isSpam('visita http://spam.com')).toBe(true);
    expect(isSpam('ve a https://malware.net')).toBe(true);
    expect(isSpam('entra en www.spam.es')).toBe(true);
  });

  test('repeticion de 8+ caracteres iguales es spam', () => {
    expect(isSpam('aaaaaaaaaa')).toBe(true);
    expect(isSpam('jajajajajajajajaja')).toBe(false); // no es un solo caracter repetido
    expect(isSpam('hola!!!!!!!!!!')).toBe(true); // 10 exclamaciones
  });

  test('opiniones reales NO son spam', () => {
    expect(isSpam('Para ir a mear y no echar gota')).toBe(false);
    expect(isSpam('Muy limpio')).toBe(false);
    expect(isSpam('Fatal, no hay papel')).toBe(false);
    expect(isSpam('La comida estaba rica')).toBe(false); // off-topic pero NO spam
    expect(isSpam('Buen sitio para cagar tranquilo')).toBe(false);
    expect(isSpam('Asqueroso')).toBe(false);
    expect(isSpam('👍')).toBe(false); // emoji de 2+ chars en UTF-16
  });
});

describe('Flujo de publicacion — texto opcional', () => {
  function simulateSubmit(rating, comment) {
    if (rating === 0) return { error: 'rating_zero' };
    const trimmed = (comment || '').trim();
    let finalComment = trimmed;
    let textFiltered = false;
    if (trimmed && isSpam(trimmed)) {
      finalComment = '';
      textFiltered = true;
    }
    return { published: true, finalComment, textFiltered };
  }

  test('rating 0 → rechazado', () => {
    expect(simulateSubmit(0, 'Buen baño').error).toBe('rating_zero');
  });

  test('rating + texto vacio → publica sin texto', () => {
    const r = simulateSubmit(4, '');
    expect(r.published).toBe(true);
    expect(r.finalComment).toBe('');
    expect(r.textFiltered).toBe(false);
  });

  test('rating + texto real → publica con texto', () => {
    const r = simulateSubmit(3, 'Para ir a mear y no echar gota');
    expect(r.published).toBe(true);
    expect(r.finalComment).toBe('Para ir a mear y no echar gota');
    expect(r.textFiltered).toBe(false);
  });

  test('rating + texto off-topic → publica igual (no filtra por tema)', () => {
    const r = simulateSubmit(5, 'La comida estaba rica');
    expect(r.published).toBe(true);
    expect(r.finalComment).toBe('La comida estaba rica');
    expect(r.textFiltered).toBe(false);
  });

  test('rating + spam URL → publica sin texto + textFiltered', () => {
    const r = simulateSubmit(3, 'visita http://spam.com');
    expect(r.published).toBe(true);
    expect(r.finalComment).toBe('');
    expect(r.textFiltered).toBe(true);
  });

  test('rating + caracteres repetidos → publica sin texto + textFiltered', () => {
    const r = simulateSubmit(2, 'aaaaaaaaaa');
    expect(r.published).toBe(true);
    expect(r.finalComment).toBe('');
    expect(r.textFiltered).toBe(true);
  });
});
