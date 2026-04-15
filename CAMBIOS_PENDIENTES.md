# Estado de Appreton — Cambios pendientes

Este documento es el resumen vivo del estado de la app: qué bugs están
arreglados, qué features están activas y qué falta por hacer. Sirve para
retomar la conversación si hay que recuperar contexto.

## Rama actual de desarrollo

`claude/recover-appleton-conversation-QqmOq`

## Ultima version publicada en APK

Ninguna reciente. El APK instalado en el movil del dev es 1.1.0
(versionCode 2) porque los ultimos builds no han llegado a generar
un APK nuevo — primero por problemas con la licencia del NDK y
despues por un bug en `android/local.properties` con un espacio final.

## Version en desarrollo

**1.6.0** (versionCode 7) — en curso. Añade:
- Mini-juego **Cagatrivia** como nueva pestaña en el TabBar.
- Botón ❤️ de "me gusta" en cada opinion de los sitios.
- Columna `likes` en la tabla `reviews` de Supabase.

Versiones anteriores committeadas pero nunca llegaron a instalarse
por problemas de build:
- 1.5.0 (versionCode 6) — Google Sign-In nativo, logo oficial,
  webhook email para sugerencias.
- 1.4.0 (versionCode 5) — revamp niveles/XP, fix avatar camara,
  notificaciones de cercania, migracion de cache.
- 1.3.0 (versionCode 4) — notificaciones geofence.
- 1.2.0 (versionCode 3) — migracion de cache por version.

Cuando el APK compile bien, saltara directamente a 1.6.0 incluyendo
todas las features acumuladas desde 1.1.0.

---

## Commit history reciente

```
[pendiente] feat: Cagatrivia + me gusta en opiniones (1.6.0)
64468cf feat: Login con Google nativo (adios supabase.co del prompt)
ab827ab feat: Email al admin cuando alguien sugiere un sitio
9529a6f feat: Usa el logo APPreton como icono oficial de la app
7b9b74d assets: Logo icono principal con caca + APPreton (sin slogan)
d00ebae assets: Logo APPreton solo texto (sin emoji de caca)
8d7c69c assets: Logo APPRETON en PNG 1024 y 512
7b6e029 docs: Logo APPRETON en SVG + actualiza estado en md
00e13bd fix: Inyecta ext.ndkVersion en el root android/build.gradle
489e79f fix: Inyecta ndkVersion 27.1.12297006 en ExpoModulesCorePlugin
ea78c57 fix: apply-patches.js sustituye NDK 26 por 27 en node_modules
ac06120 fix: Usa NDK 27.1.12297006 en vez de 26.1.10909125
0f0b1b7 fix: Avatar desde camara no aparecia
cd8b852 feat: Revamp de niveles, XP y anti-farmeo (1.4.0)
28d7da2 docs: Actualiza CAMBIOS_PENDIENTES.md con estado actual
a9d24c5 feat: Migracion de cache por version
68ecbf7 feat: Notificaciones de cercania (Android + iOS)
4eeb5aa fix: Deja de tragarse los errores de Supabase al escribir
03e1392 fix: Evita opiniones duplicadas y muestra media real en Explorar
```

## Bugs resueltos

### Opiniones duplicadas (commit 03e1392)
- `AddReviewScreen.handleSubmit` no bloqueaba el boton durante el insert.
- Doble-tap creaba N reviews identicas. Arreglado con flag `submitting`.

### Rating 0.0 en Explorar (commit 03e1392)
- Las tarjetas mostraban 0.0 porque dependian de `places.avg_rating` de
  Supabase, que se desactualizaba si habia race en los inserts.
- Ahora HomeScreen calcula la media en cliente desde las reviews cargadas,
  igual que PlaceDetailScreen.

### Errores de Supabase silenciados (commit 4eeb5aa)
- `supabase-js` v2 NO lanza excepciones en errores de BD (RLS, FK,
  constraint…): devuelve `{ data, error }`. El codigo viejo usaba
  `try { await supabase... } catch {}` y tragaba todos los fallos.
- Arreglado: `addPlace`, `addReview`, `ensurePlaceExists` comprueban el
  campo `error` y lanzan con mensaje. `PlaceDetailScreen.handleOpinar`
  los captura y muestra Alert.

### Schema incompatible en Supabase (commit 4eeb5aa + SQL manual)
- Las tablas `places` y `reviews` tenian columnas `uuid` cuando el
  codigo enviaba `text`. Ningun insert llegaba, quedaban en cache local.
- Arreglado via SQL manual ejecutado en Supabase: drop y recreate de
  ambas tablas con el schema correcto (text ids).

### Actualizar sobre instalacion existente (commit a9d24c5)
- Si el usuario actualizaba el APK sin desinstalar, el cache local
  (AsyncStorage) arrastraba reviews fantasma que nunca llegaron a
  Supabase.
- Arreglado: migracion por version. Al arrancar, si la version guardada
  no coincide con `CURRENT_VERSION`, se borran los caches de places y
  reviews. La proxima carga los repuebla desde Supabase.

---

## Features activas

### Revisiones (store.js)
- Supabase como fuente unica de verdad para `places` y `reviews`.
- Cache local como fallback offline.
- Media calculada en cliente desde las reviews reales, tanto en el
  detalle como en la lista de Explorar.

### Explorar
- Google Places (600m) + sitios de la app (Supabase).
- Filtro solo `OPERATIONAL`.
- Sin categoria "otro": sitios sin categoria conocida se descartan.
- Sort por distancia o por mejor valorado.

### Mapa
- Google Maps con markers por establecimiento, colores por tipo.
- Boton para centrar en ubicacion actual.

### Perfil
- Login con Google OAuth + email/password via Supabase Auth.
- Reset password via deep link `appreton://auth/reset-password`.
- 18 avatares de caca + foto personalizada (guardada en directorio
  permanente).

### Notificaciones de cercania (commit 68ecbf7)
- Foreground: banner `NearbyPrompt` en Explorar cuando llevas
  `DWELL_SECONDS` (2 min) dentro de 30m de un sitio.
- Background: geofence task (expo-task-manager) registra 20 regiones
  de los Google Places mas cercanos. Al entrar en una region programa
  una notificacion local diferida; si sales antes del dwell, se
  cancela.
- Anti-spam:
  - 2 min de permanencia minima antes de disparar aviso.
  - Throttle 24h por sitio.
  - "Ahora no" descarta el sitio hasta cerrar la app.
- Android: permisos `ACCESS_BACKGROUND_LOCATION`, `POST_NOTIFICATIONS`,
  `FOREGROUND_SERVICE_LOCATION`.
- iOS: `NSLocationAlwaysAndWhenInUseUsageDescription`, background modes
  `location` + `fetch`.

---

## Niveles y XP (en desarrollo para 1.4.0)

**Sistema nuevo, en implementacion:**

### Curva de niveles (12 niveles, exponencial)

| Nv | Titulo                   | XP    |
|----|--------------------------|-------|
| 1  | Estreñido                | 0     |
| 2  | Novato del Zurullo       | 100   |
| 3  | Mojacalzones             | 250   |
| 4  | Picacacas                | 500   |
| 5  | Catador de Truños        | 900   |
| 6  | Forjamojones             | 1500  |
| 7  | Inspector de Retretes    | 2400  |
| 8  | Maestro Cagador          | 3700  |
| 9  | Sabio del Plaston        | 5500  |
| 10 | Leyenda del Trono        | 8000  |
| 11 | Mito del Retrete         | 11500 |
| 12 | Dios de la Cloaca        | 16000 |

### XP por opinion

Base: **20 XP** (antes 50). Bonus sumables:
- **+15** Primer opinador del sitio (descubriste un bar).
- **+5**  Comentario detallado (≥100 caracteres).
- **+15** Estas fisicamente en el sitio al opinar (GPS <50m).
- **+10** Primera opinion del dia.
- **+10** Bonus de racha de ≥3 dias seguidos (extra en primera del dia).
- **+20** Bonus de racha de ≥7 dias seguidos (sustituye al anterior).

### Anti-farmeo
- **Una opinion por usuario y sitio** (constraint unique en Supabase).
  La segunda vez que opinas en el mismo bar, se abre en modo edicion:
  precargado con tu opinion previa, boton "Guardar cambios", **sin XP**.
- **Cooldown diario**: maximo 10 opiniones con XP en 24h. A partir de la
  11a no dan puntos.
- **Streak**: `last_review_date` + `current_streak` en user_profiles.

### SQL de migracion Supabase (ejecutar en SQL Editor)

```sql
-- 1) Limpieza de duplicados existentes (por si los hubiera)
with ranked as (
  select id,
    row_number() over (partition by user_id, place_id order by created_at desc) as rn
  from reviews
  where user_id is not null
)
delete from reviews where id in (select id from ranked where rn > 1);

-- 2) Constraint unique (user_id, place_id)
alter table reviews
  add constraint reviews_user_place_unique unique (user_id, place_id);

-- 3) Columnas nuevas en user_profiles para el streak
alter table user_profiles
  add column if not exists last_review_date text,
  add column if not exists current_streak int default 0;
```

---

## Ranking

- `RankingScreen`: mejores WCs por valoracion a 1km.
- `AppretoneroRankingScreen`: usuarios con mas XP (solo Supabase,
  elimina usuarios de prueba).

---

## Pasos para compilar y publicar una version nueva

### 1) Pull y verificar commit
```
cd C:\Users\PC\Appreton
git pull origin claude/recover-appleton-conversation-QqmOq
git log --oneline -3
```

### 2) Instalar dependencias nuevas (si las hay)
```
npm install
```

### 3) Solo si hay dependencias nativas nuevas — regenerar android
```
rmdir /s /q android
npx expo prebuild --platform android --clean
echo sdk.dir=C\:\\Users\\PC\\AppData\\Local\\Android\\Sdk > android\local.properties
```

### 4) Compilar APK
```
cd android
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%
gradlew assembleRelease -x lintVitalAnalyzeRelease -x lintVitalRelease
```

APK en: `android\app\build\outputs\apk\release\app-release.apk`

### 5) Instalar sobre version anterior
Con la migracion automatica por version ya no hace falta desinstalar.
Si el `versionCode` de `app.json` es mayor que el instalado, Android
acepta el update sobre la app existente y la migracion vacia caches
obsoletos al arrancar.

---

## Checklist para bumpear version

Cuando se hagan cambios importantes hay que tocar **los tres** valores
para que Android acepte el update y la migracion de cache se active:

1. `src/version.js` → `CURRENT_VERSION`
2. `app.json` → `expo.version`
3. `app.json` → `expo.android.versionCode` (siempre +1 respecto a la
   version instalada)

Y añadir entrada al `CHANGELOG` en `src/version.js`.

---

## Problemas abiertos (en curso)

### 1) Build con trailing space en local.properties
El comando `echo sdk.dir=... > android\local.properties` en CMD mete
un ESPACIO antes del `>` en el archivo. Gradle lee el path como
`C:\...\Sdk ` (con espacio) y al concatenar `\licenses` busca en
`Sdk \licenses` — path invalido — por eso da "License not accepted"
aunque las licencias esten bien.

**Fix**: reescribir `local.properties` con PowerShell SIN trailing
space:
```
powershell -NoProfile -Command "[System.IO.File]::WriteAllText('C:\Users\PC\Appreton\android\local.properties', 'sdk.dir=C:\\Users\\PC\\AppData\\Local\\Android\\Sdk' + [char]10)"
```

### 2) NDK 26 vs 27
Cambio de NDK 26.1.10909125 a 27.1.12297006 via `ext.ndkVersion` en
root `android/build.gradle`. Ya esta en `apply-patches.js` y en el
config plugin `patch-expo-modules.js`. Todos los modulos expo leen
`rootProject.ext.ndkVersion` y lo usan automaticamente.

---

## Pendiente / futuro

- **Panel de administracion web separado** (Next.js) para moderar
  reviews, aprobar sitios sugeridos, ver estadisticas. Aparcado
  hasta que se publique la app. Stack propuesto: Next.js + Tailwind +
  @supabase/supabase-js + tabla `admins` con whitelist de emails.
- **Publicacion en Play Store**: requiere keystore release (no el
  debug actual), configurar firma en `android/app/build.gradle` o
  `eas.json`, crear cuenta en Play Console ($25 one-time), listing,
  AAB (`gradlew bundleRelease`), upload. En espera — el usuario NO
  quiere publicar todavia.
- **Mini-juego "Toca la Caca"** (`src/screens/GameScreen.js`) está
  en el repo pero sin boton que lo abra (se retiro temporalmente
  en c4e8baf). Sustituido por Cagatrivia.
- Badges / logros adicionales a los niveles (descubriste 5 bares,
  racha de 7 dias, etc.).
- Pantalla de historial de opiniones propias en Perfil.
- Moderacion de opiniones (reportar, ocultar).
- i18n (Espanol / Ingles).
- **Tamagotchi de caca** — mascota virtual vinculada al streak.
  Idea aparcada, implementable cuando haya mas usuarios activos.
- **Swipe de opiniones ajenas** — idea descartada a favor del
  simple boton ❤️ de me gusta en el detalle del sitio.
