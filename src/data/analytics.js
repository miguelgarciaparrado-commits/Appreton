import analytics from '@react-native-firebase/analytics';

function safeLog(eventName, params) {
  try {
    analytics().logEvent(eventName, params);
  } catch (e) {
    console.warn('[Appreton] analytics error:', e.message);
  }
}

export function logBanoReportado(rating, ciudad) {
  safeLog('bano_reportado', {
    rating: String(rating),
    ciudad: ciudad || 'desconocida',
  });
}

export function logBusquedaBano(ciudad) {
  safeLog('busqueda_bano', {
    ciudad: ciudad || 'desconocida',
  });
}

export function logBanoVisualizado(banoId, banoNombre) {
  safeLog('bano_visualizado', {
    bano_id: banoId || '',
    bano_nombre: (banoNombre || '').slice(0, 100),
  });
}

export function logFiltroAplicado(tipoFiltro) {
  safeLog('filtro_aplicado', {
    tipo_filtro: tipoFiltro || '',
  });
}

export function logJuegoIniciado(juego) {
  safeLog('juego_iniciado', {
    juego: juego || '',
  });
}

export function logComoLlegar(banoId, banoNombre) {
  safeLog('como_llegar', {
    bano_id: banoId || '',
    bano_nombre: (banoNombre || '').slice(0, 100),
  });
}

export function logPinVisualizado(placeId, estado, hoursAgo) {
  safeLog('pin_visualizado', {
    place_id: placeId || '',
    estado: estado || 'sin_datos',
    hours_ago: hoursAgo != null ? Math.round(hoursAgo) : -1,
  });
}

export function logLikeOpinion(reviewId) {
  safeLog('like_opinion', {
    review_id: reviewId || '',
  });
}
