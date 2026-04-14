// Historial de versiones de Appreton
// Al hacer cambios: actualizar CURRENT_VERSION y anadir entrada al CHANGELOG
// Tambien actualizar "version" y "versionCode" en app.json

export const CURRENT_VERSION = '1.2.0';

export const CHANGELOG = [
  {
    version: '1.2.0',
    date: '2026-04-14',
    changes: [
      'Arreglado: opiniones no llegaban a Supabase por schema uuid vs text',
      'Arreglado: opiniones duplicadas al hacer doble tap en Enviar',
      'Arreglado: media real en las tarjetas de Explorar',
      'Los errores de guardado ya no se silencian',
      'Migracion automatica de cache al actualizar la app',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-04-08',
    changes: [
      'Establecimientos cercanos con Google Places (600 m)',
      'Login y registro con Google OAuth',
      'Recuperacion de contrasena por email',
      'Registro con email via Supabase',
      'Perfil guardado en la nube (no se pierde al reinstalar)',
      'Ranking muestra los mejor valorados a 600 m',
      'Sustituido bano por WC en toda la app',
      'Mensajes unicos por puntuacion (1-5 cacas)',
      'Pestana Sugerir sitio para lugares no en Google',
      'Corregido fallo al actualizar la app',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-01',
    changes: [
      'Lanzamiento inicial',
      'Explorar establecimientos cercanos',
      'Valorar WC con sistema de cacas',
      'Ranking de usuarios (Appretoneros)',
      'Perfil de usuario con niveles y XP',
    ],
  },
];
