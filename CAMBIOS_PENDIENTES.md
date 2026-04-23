# Estado de Appreton — Cambios pendientes

Este documento es el resumen vivo del estado de la app: qué bugs están
arreglados, qué features están activas y qué falta por hacer. Sirve para
retomar la conversación si hay que recuperar contexto.

## Rama actual de desarrollo

`claude/recover-appleton-conversation-QqmOq`

## Ultima version publicada en APK

Ninguna reciente. El APK instalado en el movil del dev sigue siendo 1.1.0
(versionCode 2). Los builds posteriores han acumulado features pero
ningun build ha llegado a generar un APK nuevo completado — primero
por problemas con la licencia del NDK, despues por el trailing space
en `android/local.properties`, y en paralelo por el cache obsoleto
de la carpeta `android/`.

## Version en desarrollo

**1.6.0** (versionCode 7) — en curso. Commiteado en el repo, pendiente
de que termine la compilacion que el dev tiene en marcha ahora mismo.

Acumula todos los fixes y features desde la 1.1.0:

### Features principales
- **Cagatrivia + Toca la Caca** (pestaña "Juegos"): pantalla hub con
  dos mini-juegos. Cagatrivia: trivia de 30+ preguntas escatologicas,
  10 por partida, high score. Toca la Caca: cacas aparecen en pantalla
  y hay que tocarlas antes de que desaparezcan, 3 vidas, dificultad
  creciente. Ambos con persistencia de records.
- **Me gusta en opiniones**: boton ❤️ en cada review del detalle del
  sitio, con contador y prevencion de likes duplicados por dispositivo.
  Nueva columna `likes` en la tabla `reviews`.
- **Login con Google nativo**: sustituye el flujo web OAuth de Supabase
  por Google Sign-In nativo. Google muestra "Iniciar sesion en Appreton"
  en vez de "Ir a xxxxx.supabase.co". Fallback al flujo web si la
  libreria nativa no esta disponible.
- **Notificaciones de cercania con dwell detection** (Android + iOS):
  geofencing background con 20 regiones, aviso tras 2 min dentro del
  radio, throttle 24h por sitio. Banner foreground equivalente en
  Explorar. Filtro anti-conduccion: si el GPS detecta velocidad >3 m/s
  (~11 km/h) o distancia real al sitio >100m, el ENTER se descarta
  silenciosamente (evita 4+ notificaciones falsas al pasar en coche).
- **Mapa mejorado**: markers custom con emoji del tipo + badge con
  cacas (💩 a 💩💩💩💩💩) segun valoracion media. Tarjeta inferior
  al tocar un marker con botones "Como llegar" y "Ver opiniones".
  Contador real filtrado a 600m. Sin supermercados ni tiendas sin WC
  (solo shopping_mall y department_store como centro_comercial).
- **Como llegar**: boton 🧭 en el detalle de cada sitio que abre
  Google Maps (Android) o Apple Maps (iOS) con la ruta al WC.
- **Migracion automatica de cache** al cambiar de version: al arrancar
  la app, si detecta que el CURRENT_VERSION cambio, borra los caches
  de places y reviews para evitar arrastre de datos obsoletos.
- **Sistema de niveles y XP** (revamp 1.4.0): 12 niveles con nombres
  gamberros (Estrenido → Dios de la Cloaca), XP variable con bonuses
  (primer opinador, comentario detallado, GPS on-site, primera del dia,
  racha). Anti-farmeo con constraint unique(user_id, place_id).
- **Editar opinion propia** sin duplicar: si ya opinaste un sitio, el
  boton "Opinar" cambia a "Editar" y se precarga el formulario. Los
  edits no dan XP.
- **Perfil con badge de racha** 🔥 cuando llevas varios dias seguidos
  opinando.
- **Pestaña "Sugerir sitio" eliminada** del TabBar (codigo se mantiene
  en el repo por si se reactiva). El email al admin sigue disponible
  como feature flag en config.js.

- **Recuperar contraseña visible**: boton "¿Olvidaste tu contraseña?" en
  la pantalla de login, acentos corregidos en todos los strings del flujo
  de autenticacion en español.
- **Preparacion iOS completa**: `app.json` con `infoPlist`, permisos,
  `UIBackgroundModes`, `useFrameworks: "static"` para Google Sign-In en
  CocoaPods, guards en `apply-patches.js` para que no falle en macOS,
  perfiles iOS en `eas.json`. Solo falta cuenta Apple Developer para
  compilar.

- **Avatares visibles en ranking multi-dispositivo**: los avatares
  personalizados (foto de camara/galeria) se suben a Supabase Storage
  y se guardan como URL publica. Antes guardaban una ruta local
  (`file://...`) que solo funcionaba en el dispositivo original.
  Fallback: si la imagen no carga, se muestra el avatar caca por defecto.

- **Agente extractor de reseñas** (Claude Sonnet 4): cada opinion se
  analiza automaticamente en background via Supabase Edge Function.
  Extrae: cleanliness, supplies, smell, privacy, safety, tags,
  sentiment y flags. Los tags se muestran como chips azules debajo
  de cada opinion. Coste: ~$0.003/review. Secret ANTHROPIC_API_KEY
  configurado en Supabase Edge Functions.
- **OpenStreetMap (Overpass API)**: nueva fuente de WCs publicos
  (cabinas, parques, estaciones). Se suman a Google Places y app DB.
  Cache local 24h, fallback con servidor mirror. Tipo "wc_publico"
  con emoji 🚻 y filtro en Explorar.
- **Firebase Analytics**: 7 eventos custom (bano_reportado,
  busqueda_bano, bano_visualizado, filtro_aplicado, como_llegar,
  like_opinion, juego_iniciado). google-services.json configurado.
- **Nombre del autor en opiniones**: cada opinion muestra 👨/👩 +
  nombre del usuario. Se guarda author_name y gender en la tabla
  reviews. Nombres largos truncados con "...".
- **Banner de racha en Explorar**: muestra "🔥 Racha de X dias"
  en la parte superior. Indica si ya opinaste hoy o si debes opinar
  para no perder la racha.
- **Ranking pulsable**: las tarjetas de Top WC ahora son tocables,
  llevan al detalle del sitio para ver opiniones.
- **Toggle me gusta**: los likes en opiniones son reversibles
  (pulsar de nuevo quita el like).
- **Firma release con keystore propio**: plugin signing-config.js
  configura automaticamente la firma release. Keystore en
  appreton-release.keystore (fuera de git).
- **Politica de privacidad**: docs/index.html listo para GitHub
  Pages. Cubre RGPD, ubicacion, camara, Supabase UE.
- **Icono sin texto**: caca cute centrada en zona segura 55%,
  sin "APPreton" que se cortaba en launchers circulares.
- **Radio 800m**: ampliado de 600m para cubrir mas sitios.
- **Sin gasolineras low cost**: filtro por marca (Ballenoil,
  Plenoil, etc.) — no tienen WC.
- **Sin supermercados**: solo shopping_mall y department_store.

- **Decaimiento Visual del Dato**: los markers del mapa cambian de
  color segun la antiguedad de la ultima review. Rating alto + reciente
  = verde brillante. Rating bajo + reciente = rojo brillante. >7 dias
  o sin reviews = gris. Tarjeta inferior y PlaceDetail muestran
  "🟢 Limpio · Hace 2 horas". PlaceCard muestra badge de color con
  "Hace X". Timer de 60s para refrescar sin red. Evento analytics
  `pin_visualizado`.
- **Fix "Hace X horas" → timestamp completo**: las reviews ahora
  guardan `created_at` con ISO completo (`2026-04-22T18:37:45Z`) en
  vez de solo la fecha (`2026-04-22`). Resuelve el bug de "Hace 18h"
  al publicar una opinion reciente. Reviews antiguas sin `created_at`
  usan `date` como fallback.
- **Validacion de opiniones simplificada**: texto libre es OPCIONAL.
  Solo se filtra spam evidente (URLs, repeticion de caracteres, <2
  chars). Opiniones como "Para ir a mear y no echar gota" ya NO se
  rechazan. Si el texto es spam, se publica la valoracion estructurada
  sin texto + mensaje "tu comentario no paso la moderacion". El filtro
  BATHROOM_KEYWORDS ha sido eliminado. Evento analytics:
  `opinion_publicada` con tiene_texto, longitud y estrellas.
- **Tests automatizados**: 27 tests Jest (15 freshness + 12
  validation) que verifican el calculo "Hace X" y la nueva logica
  de validacion. Ejecutar: `npm test`.
- **Filtro "WC Publicos" mas visible**: renombrado y movido a la
  segunda posicion en Explorar (justo despues de "Todos").
- **Build optimizado arm64-v8a**: plugin abi-filter.js limita la
  compilacion a solo la arquitectura arm64-v8a (95% de moviles).
  Reduce el tiempo de build de 1h+ a 15-25 min al evitar CMake para
  x86_64 y armeabi-v7a.
- **Pre-validacion de opiniones + reversion de XP**: antes de enviar,
  la app comprueba si el comentario contiene al menos una palabra
  relacionada con baños (limpi, papel, jabon, olor, WC, etc.). Si
  no tiene ninguna y es corto (<50 chars), se rechaza en cliente
  con mensaje claro y NO se consume API ni se da XP.
  Para casos que pasan el filtro local pero Claude detecta como
  off_topic/spam/offensive: la Edge Function revierte el XP
  (-20) y decrementa total_reviews del usuario + recalcula
  avg_rating/review_count del place excluyendo reviews ocultas.
  Evento analytics: `opinion_rechazada` con motivo.
- **Moderacion automatica de reseñas**: el extractor evalua los flags
  de cada opinion. Si detecta `offensive_language`, `possible_spam` o
  `off_topic`, marca la review como `pending_review` y deja de ser
  visible para los usuarios. El admin revisa manualmente en Supabase
  Dashboard → Table Editor → reviews → filtrar por
  `moderation_status = 'pending_review'`. Para aprobar: cambiar a
  `visible`. Para ocultar definitivamente: cambiar a `hidden`.
  Las reviews sin flags quedan `visible` automaticamente.

### Branding
- **Logo oficial** de la app: caca cute con APPreton debajo, en
  assets/icon.png, splash-icon.png, adaptive-icon.png, favicon.png.
- **Icono de notificacion** monocromatico (silueta de caca sonriente)
  en assets/notification-icon.png — Android muestra la cacita en el
  status bar en vez de un circulo blanco.

### Fixes historicos incluidos
- Opiniones duplicadas por doble-tap (flag submitting).
- Rating 0.0 en Explorar (calculo en cliente desde reviews reales).
- Errores de Supabase silenciados (supabase-js no lanza en errores de
  BD, ahora los comprobamos explicitamente).
- Schema Supabase uuid vs text recreado correctamente.
- Fix del NDK 26 → 27 via ext.ndkVersion en root build.gradle + parches
  a ExpoModulesCorePlugin.gradle y los plugins patch-expo-modules.js y
  apply-patches.js. Con esto el NDK 27 (que ya esta instalado y sin
  problemas de licencia) se usa globalmente.

### Cuando el build se complete
El usuario habra saltado directamente de 1.1.0 a 1.6.0, incluyendo
todos los commits de 1.2.0, 1.3.0, 1.4.0 y 1.5.0 en un unico APK.

---

## Commit history reciente

```
80003bc test: Tests automatizados del calculo "Hace X" (15 tests passing)
9e2dab0 fix: "Hace X horas" usa timestamp completo en vez de solo fecha
2d10eaf fix: Filtro WC Publicos mas visible en Explorar
d239417 fix: Pre-validacion + reversion de XP para opiniones rechazadas
12cf476 perf: Limita build Android a arm64-v8a para reducir tiempo
93cb062 feat: Decaimiento Visual del Dato — markers con color por frescura
aaa6e2b feat: Moderacion automatica de reseñas via extractor
fdcd94f feat: Agente extractor de reseñas (T3-T5 + T7)
2813d77 feat: Banner de racha visible en Explorar
62d714f feat: Muestra nombre del autor + genero en cada opinion
3d31be1 feat: Amplia radio de busqueda de 600m a 800m
c92afda fix: Reequilibra parametros de notificacion (5 min, 100m)
772983a feat: Ranking de baños con tarjetas pulsables → ver opiniones
4eb8f1e fix: Markers compactos (💩4.2) + OSM con fallback mirror
811a9d7 feat: Integra OpenStreetMap (Overpass API) para WCs publicos
e98263b feat: Integra Firebase Analytics con eventos custom
144214f fix: Icono recentrado sin texto para adaptive icon safe zone
17aa20f feat: Firma release con keystore propio para Google Play
7d9e5ca docs: Politica de privacidad para Google Play (GitHub Pages)
fbe0a05 feat: Toggle me gusta en opiniones (like/unlike)
f444637 fix: Filtra gasolineras low cost sin WC
f488443 feat: Pantalla "Juegos" con Cagatrivia + Toca la Caca
fcb62c1 feat: Elimina pestaña "Sugerir sitio" del TabBar
a3c14dd feat: Boton "Como llegar" en detalle de sitio y mapa
cc6c55d fix: Avatares personalizados visibles en ranking multi-dispositivo
b69fe71 fix: Filtro anti-conduccion en geofencing (velocidad + distancia GPS)
```

## Requisitos fuera del repo antes de compilar

1. **Google Cloud → Auth Platform → Clientes**: dos clientes creados:
   - OAuth Web: `1012059070308-51rbls8jgeh88qlqnjfv448utmvjj71l.apps.googleusercontent.com`
     con JS origin y redirect URI a `gcperiixkrrqoydfmned.supabase.co`.
   - OAuth Android: package `com.appreton.app` + SHA-1
     `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
     (del debug keystore estandar de Android Studio).
2. **Google Cloud → Informacion de marca**: App name = "Appreton".
3. **Google Cloud → Publico**: email de test user añadido.
4. **Supabase → Authentication → Providers → Google**:
   - Client ID pegado.
   - Client Secret pegado.
   - **Skip nonce checks** activado (obligatorio para el flujo nativo).
   - Authorized Client IDs con el mismo Web Client ID.
5. **Supabase → SQL Editor**, ejecutar:
   ```sql
   alter table reviews add column if not exists likes int default 0;
   alter table reviews add column if not exists gender text;
   alter table reviews add column if not exists author_name text;
   alter table reviews add column if not exists structured_extraction jsonb;
   alter table reviews add column if not exists extracted_at timestamptz;
   alter table reviews add column if not exists extraction_version text;
   alter table reviews add column if not exists extraction_error text;
   alter table reviews add column if not exists extraction_status text default 'pending';
   create index if not exists reviews_extraction_status_idx
     on reviews (extraction_status)
     where extraction_status in ('pending', 'processing', 'failed');
   ```
6. **Supabase → Edge Functions → Secrets**: añadir `ANTHROPIC_API_KEY`
   con la clave de [console.anthropic.com](https://console.anthropic.com).
7. **Supabase → Edge Functions**: desplegar con Supabase CLI:
   ```
   supabase functions deploy extract-review
   supabase functions deploy backfill-extractions
   ```
8. **Supabase → Storage**: crear bucket **`avatars`** con acceso **publico**.
   Luego añadir una policy para que solo usuarios autenticados puedan subir:
   - Ir a Storage → Policies → `avatars` bucket
   - New policy → INSERT: `auth.role() = 'authenticated'`
   - New policy → UPDATE: `auth.role() = 'authenticated'`
   - (SELECT ya es publico al ser un bucket publico)
   Sin este bucket, los avatares personalizados solo se muestran en el
   dispositivo del dueño.

## Requisitos del local para que el build salga bien (Android)

- `android/local.properties` con `sdk.dir=C:\Users\PC\AppData\Local\Android\Sdk`
  **SIN trailing space** (usar PowerShell, no `echo`).
- Tras cada cambio en `app.json`, regenerar `android/` con
  `expo prebuild --platform android --clean` (el prompt de uncommited
  changes se responde con `y`, no con Enter).
- Ejecutar `node apply-patches.js` despues del prebuild para inyectar
  `ext.ndkVersion = "27.1.12297006"` en `android/build.gradle` y
  hardcodear compileSdkVersion 35 en ExpoModulesCorePlugin.gradle.
- Matar `adb.exe` y `java.exe` antes de `rmdir /s /q android`.
- Compilar con `gradlew clean assembleRelease -x lintVitalAnalyzeRelease
  -x lintVitalRelease` (el `-x lint` evita el problema de Metaspace).

---

## Compilacion para iOS — Guia completa

El proyecto esta **100% preparado** para compilar para iOS. Todo el
codigo React Native / Expo es cross-platform. La configuracion iOS
esta en `app.json`, `eas.json` y los plugins. Esta seccion es una guia
autocontenida: con este fichero y el repo, cualquier persona con un Mac
puede generar el .ipa sin necesidad de contexto adicional.

### Que esta ya configurado en el repo

| Fichero | Que tiene |
|---------|-----------|
| `app.json → ios` | `bundleIdentifier: "com.appreton.app"`, `buildNumber: "7"`, `googleMapsApiKey`, `infoPlist` con todos los permisos en español, `UIBackgroundModes: [location, fetch, processing]`, `ITSAppUsesNonExemptEncryption: false`, `associatedDomains: []` |
| `app.json → plugins` | `expo-build-properties` con `ios.deploymentTarget: "15.1"` y `useFrameworks: "static"` (obligatorio para Google Sign-In v13 en CocoaPods), `expo-location` con permisos Always+WhenInUse, `expo-notifications`, `@react-native-google-signin` con `iosUrlScheme`, `expo-image-picker` con `microphonePermission: false` |
| `eas.json` | Tres perfiles iOS: `development` (simulator), `preview` (internal), `production` (store). Submit con placeholders para Apple ID / Team ID |
| `apply-patches.js` | Guard: si no existe `node_modules/expo-modules-core/android`, el script termina con codigo 0 — seguro en macOS |

### Requisitos previos (una sola vez)

1. **Mac** con macOS 13+ (Ventura o superior)
2. **Xcode 15+** instalado desde la App Store
3. **Command Line Tools**: `xcode-select --install`
4. **Node 18+**: `brew install node` (o nvm)
5. **CocoaPods**: `sudo gem install cocoapods`
6. **Cuenta Apple Developer** ($99/año) — sin ella solo puedes
   probar en simulador, no instalar en dispositivos reales

### Opcion A — Compilar en el Mac local (paso a paso)

```bash
# 1. Clonar el repo
git clone https://github.com/miguelgarciaparrado-commits/Appreton.git
cd Appreton
git checkout claude/recover-appleton-conversation-QqmOq

# 2. Instalar dependencias JS
npm install

# 3. Generar proyecto nativo iOS
npx expo prebuild --platform ios --clean
# Responder "y" si pregunta por uncommitted changes

# 4. Instalar pods (CocoaPods)
cd ios && pod install && cd ..

# 5a. Probar en simulador (no necesita Apple Developer)
npx expo run:ios

# 5b. Compilar release para dispositivo real (necesita Apple Developer)
npx expo run:ios --configuration Release --device
```

**Notas:**
- Al abrir Xcode (`open ios/Appreton.xcworkspace`), configurar
  el **Team** en Signing & Capabilities con tu cuenta Developer.
- Xcode generara automaticamente el provisioning profile si
  tienes Automatic Signing activado.
- El primer build tarda ~10-15 min (compila Google Maps SDK,
  hermes, react-native, etc.). Los siguientes son mas rapidos.

### Opcion B — EAS Build (compilar en la nube, sin Mac)

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login con cuenta Expo
eas login

# 3. Configurar credenciales Apple (una sola vez)
eas credentials --platform ios
# EAS te pedira tu Apple ID y password, y genera certificados
# y provisioning profiles automaticamente.

# 4. Build preview (genera .ipa para TestFlight)
eas build --platform ios --profile preview

# 5. Build produccion (para App Store)
eas build --platform ios --profile production

# 6. Subir a App Store Connect
eas submit --platform ios
```

**Ventaja**: no necesitas Mac. EAS compila en servidores Apple
de Expo. El .ipa se descarga o se sube directamente a TestFlight.

### Configuracion en Apple / Google Cloud (una sola vez)

**Apple Developer Portal** (https://developer.apple.com):
1. Identifiers → Register App ID: `com.appreton.app`
2. Capabilities del App ID:
   - Push Notifications (para notificaciones locales futuras)
   - Maps
   - Background Modes → Location updates, Background fetch
3. Provisioning Profiles: crear Development + Distribution
   (EAS los crea automaticamente si usas `eas credentials`)

**Google Cloud Console** (https://console.cloud.google.com):
1. Auth Platform → Clientes → Crear **OAuth Client iOS**:
   - Bundle ID: `com.appreton.app`
   - Google te da un Client ID tipo `1012059070308-xxxxx.apps.googleusercontent.com`
2. Google Maps API Key:
   - Editar la key existente (`AIzaSyAGsJx_0fUzJmVDA539E5zo_mDfLBvKRMA`)
   - Añadir **bundle restriction** para `com.appreton.app` (iOS)
   - O crear una key separada para iOS

**Supabase**: no hay que tocar nada — la configuracion de Google
provider ya vale para ambas plataformas.

### Rellenar eas.json para submit (cuando vayas a publicar)

En `eas.json → submit → production → ios`, reemplazar:
```json
{
  "appleId": "tu-email@icloud.com",
  "ascAppId": "1234567890",
  "appleTeamId": "ABCDEF1234"
}
```
- `appleId`: tu Apple ID (email)
- `ascAppId`: el App ID numerico en App Store Connect
- `appleTeamId`: tu Team ID (visible en developer.apple.com → Membership)

### Diferencias iOS vs Android a tener en cuenta

| Aspecto | Android | iOS |
|---------|---------|-----|
| Icono notificacion | `notification-icon.png` monocromo | Icono de la app automaticamente |
| Geofencing background | `ACCESS_BACKGROUND_LOCATION` | Permiso "Always" (usuario debe conceder explicitamente) |
| Google Maps | Incluido en Google Play Services | Requiere Google Maps SDK iOS (CocoaPods lo instala) |
| OAuth firma | SHA-1 del keystore | Bundle ID + Team ID (sin keystore) |
| Export compliance | N/A | `ITSAppUsesNonExemptEncryption: false` (ya configurado) |
| Pago tienda | Play Console $25 one-time | Apple Developer $99/año |

### Checklist rapido iOS

- [x] `bundleIdentifier` configurado
- [x] `buildNumber` sincronizado con `versionCode`
- [x] `infoPlist` con todos los permisos en español
- [x] `UIBackgroundModes` para geofencing
- [x] `ITSAppUsesNonExemptEncryption: false`
- [x] `useFrameworks: "static"` para Google Sign-In
- [x] `iosUrlScheme` para Google OAuth
- [x] `deploymentTarget: "15.1"`
- [x] `eas.json` con perfiles iOS
- [x] `apply-patches.js` compatible con macOS
- [ ] Cuenta Apple Developer activa
- [ ] App ID registrado en Apple Developer Portal
- [ ] OAuth Client iOS en Google Cloud
- [ ] Google Maps API Key con bundle restriction iOS
- [ ] Primer build: `eas build --platform ios --profile preview`
- [ ] Screenshots iPhone 6.7" y iPad 12.9" (si supportsTablet)
- [ ] Submit a TestFlight

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

### Pestañas del TabBar (6)
Explorar | Mapa | Juegos | Top WC | Appretoneros | Perfil

### Explorar
- Google Places (600m) + sitios de la app (Supabase).
- Filtro solo `OPERATIONAL`.
- Sin categoria "otro": sitios sin categoria conocida se descartan.
- Sin supermercados ni tiendas pequeñas (solo shopping_mall / department_store).
- Sort por distancia o por mejor valorado.
- Boton "Como llegar" en el detalle de cada sitio.

### Mapa
- Google Maps con markers por establecimiento, emoji del tipo + cacas
  de valoracion (💩 a 💩💩💩💩💩). "?" si no hay opiniones.
- Tarjeta inferior al tocar marker con "Como llegar" + "Ver opiniones".
- Boton para centrar en ubicacion actual.
- Solo muestra: bares, restaurantes, gasolineras, shopping malls y
  department stores. Supermercados y tiendas sin WC filtrados.

### Juegos
- Pestaña "Juegos" (🎮) con hub que da acceso a:
  - **Cagatrivia**: 30+ preguntas, 10 por partida, high score.
  - **Toca la Caca**: mini-juego tap, 3 vidas, dificultad creciente.

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

### 2) Gradle daemon crash (OOM) al compilar en Windows
El build con `gradlew assembleRelease` se ha caido tras ~2 horas al 24%
con el error:

```
Gradle build daemon disappeared unexpectedly (it may have been killed or may have crashed)
```

El log del daemon muestra `VM shutdown hook was unable to remove the daemon
address from the registry` seguido de `IllegalStateException: Cannot start
managing file contention because this handler has been closed`. Esto es un
crash por falta de memoria (OOM) — Gradle se come toda la RAM del sistema
y el SO (o el propio JVM) mata el proceso.

**Fixes recomendados (aplicar todos):**

1. **Subir la RAM del daemon**: en `android/gradle.properties` añadir o
   modificar:
   ```properties
   org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError
   ```
   Si el PC tiene 8 GB de RAM usar `-Xmx3g`; si tiene 16 GB, `-Xmx4g`.

2. **Desactivar el daemon entre builds** (ahorra RAM si no compilas
   continuamente):
   ```properties
   org.gradle.daemon=false
   ```

3. **Cerrar Android Studio, Chrome y procesos pesados** antes de compilar.
   El build Gradle en modo Release con lint + dex es muy exigente.

4. **Compilar sin lint** (ya lo hacemos con `-x lintVitalAnalyzeRelease
   -x lintVitalRelease`). Verificar que sigue en el comando.

5. **Alternativa: usar EAS Build** en la nube para evitar limitaciones
   de hardware local:
   ```bash
   eas build --platform android --profile preview
   ```

### 3) NDK 26 vs 27
Cambio de NDK 26.1.10909125 a 27.1.12297006 via `ext.ndkVersion` en
root `android/build.gradle`. Ya esta en `apply-patches.js` y en el
config plugin `patch-expo-modules.js`. Todos los modulos expo leen
`rootProject.ext.ndkVersion` y lo usan automaticamente.

---

## Checklist de publicacion en Google Play

### Assets listos en el repo
- [x] Icono 512x512 → `assets/logo-appreton-512.png`
- [x] Feature graphic 1024x500 → `assets/feature-graphic.png`
- [x] Icono adaptativo 1024x1024 → `assets/adaptive-icon.png`
- [x] Politica de privacidad HTML → `docs/index.html`

### Configuracion tecnica
- [x] Keystore de firma → `appreton-release.keystore` (fuera de git)
- [x] Plugin signing-config.js → firma release automatica
- [x] Build optimizado arm64-v8a → compila en 15-25 min
- [x] `versionCode: 7` y `version: "1.6.0"` en `app.json`

### Lo que falta (manual)
- [ ] **Screenshots** del movil (2-8) → capturar desde el APK actual
- [ ] **AAB firmado** → `gradlew bundleRelease` (generando ahora)
- [ ] **Cuenta Google Play Console** ($25 one-time)
- [ ] **Activar GitHub Pages** para la URL de politica de privacidad
- [ ] Rellenar ficha en Play Console con los textos de `PLAY_STORE_INFO.md`
- [ ] Upload del AAB a Play Console → Internal testing primero
- [ ] Tras aprobacion interna → Production release

### Comando para generar AAB firmado
```
cd C:\Users\PC\Appreton\android
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%
gradlew bundleRelease -x lintVitalAnalyzeRelease -x lintVitalRelease
```
AAB resultante en:
`android\app\build\outputs\bundle\release\app-release.aab`

### Verificar firma del AAB
```
"%JAVA_HOME%\bin\jarsigner" -verify -verbose -certs android\app\build\outputs\bundle\release\app-release.aab | findstr "CN="
```
Debe mostrar el nombre del developer, NO "Android Debug".

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
- **Toca la Caca** reintegrado en pestaña "Juegos" junto a Cagatrivia.
- Badges / logros adicionales a los niveles (descubriste 5 bares,
  racha de 7 dias, etc.).
- Pantalla de historial de opiniones propias en Perfil.
- Moderacion de opiniones (reportar, ocultar).
- i18n (Espanol / Ingles).
- **Tamagotchi de caca** — mascota virtual vinculada al streak.
  Idea aparcada, implementable cuando haya mas usuarios activos.
- **Swipe de opiniones ajenas** — idea descartada a favor del
  simple boton ❤️ de me gusta en el detalle del sitio.
