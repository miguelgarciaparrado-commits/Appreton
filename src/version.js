// Historial de versiones de Appreton
// Al hacer cambios: actualizar CURRENT_VERSION y anadir entrada al CHANGELOG
// Tambien actualizar "version" y "versionCode" en app.json

export const CURRENT_VERSION = '1.5.0';

export const CHANGELOG = [
  {
    version: '1.5.0',
    date: '2026-04-14',
    changes: [
      'Login con Google nativo: aparece "Iniciar sesion en Appreton"',
      'Se acabo el "Ir a xxxxx.supabase.co" del navegador',
      'Email al admin cuando alguien sugiere un sitio',
      'Logo oficial de la app actualizado',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-04-14',
    changes: [
      'Niveles rediseñados: 12 niveles con nombres gamberros',
      'Curva de XP mucho mas exigente (hasta 16000 XP para Dios de la Cloaca)',
      'XP variable con bonus: primer opinador, comentario largo, estar ahi, primera del dia, racha',
      'Racha diaria: opina varios dias seguidos para ganar XP extra',
      'Editar tu opinion: ya puedes modificar lo que escribiste (sin dar XP por editar)',
      'Una opinion por usuario y sitio: se acabaron los duplicados',
      'Cooldown: max 10 opiniones con XP al dia',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-04-14',
    changes: [
      'Aviso cuando llevas un rato en un establecimiento para que opines',
      'Notificacion push local si la app esta cerrada',
      'Banner in-app si la app esta abierta',
      'Anti-spam: solo un aviso cada 24h por sitio, y solo tras permanecer un rato',
      'Soporte Android e iOS',
    ],
  },
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
