// Envia un POST al webhook de notificacion con los datos del sitio
// sugerido. Silenciado: si el POST falla (red caida, URL mal, rate
// limit del servicio...) no rompe el flujo del usuario — el sitio
// ya quedo guardado en Supabase en addPlace().

import { SUBMISSION_WEBHOOK_URL, SUBMISSION_NOTIFY_EMAIL } from '../config';
import { getCurrentUser } from './auth';

export async function notifyNewSuggestion(place) {
  if (!SUBMISSION_WEBHOOK_URL) {
    // Feature flag vacio: no hay endpoint configurado, skip
    return { sent: false, reason: 'no_url' };
  }

  try {
    const user = await getCurrentUser();
    const payload = {
      _subject: `[Appreton] Sitio sugerido: ${place.name}`,
      _replyto: user?.email || 'no-reply@appreton.app',
      notify_email: SUBMISSION_NOTIFY_EMAIL || '',
      sitio_nombre: place.name,
      sitio_direccion: place.address,
      sitio_tipo: place.type,
      sitio_lat: place.latitude ?? null,
      sitio_lng: place.longitude ?? null,
      google_maps: place.latitude && place.longitude
        ? `https://www.google.com/maps/?q=${place.latitude},${place.longitude}`
        : null,
      usuario_id: user?.id || null,
      usuario_nombre: user?.displayName || 'Anonimo',
      usuario_email: user?.email || 'no-email',
      fecha: new Date().toISOString(),
    };

    const response = await fetch(SUBMISSION_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Appreton] notifyNewSuggestion failed', response.status);
      return { sent: false, reason: `http_${response.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error('[Appreton] notifyNewSuggestion error', e);
    return { sent: false, reason: 'exception' };
  }
}
