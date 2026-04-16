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
- **Cagatrivia** (nueva pestaña del TabBar): mini-juego de trivia con 30
  preguntas sobre cultura escatologica, records absurdos y curiosidades
  del WC. 10 preguntas aleatorias por partida, high score persistido.
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
- **Mapa mejorado**: markers custom con emoji del tipo + badge con el
  rating numerico y color (verde/naranja/rojo/gris) para ver de un
  vistazo los mejores WCs. Contador real filtrado a 600m del usuario.
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
- **Email al admin** cuando un usuario sugiere un sitio (feature flag
  via SUBMISSION_WEBHOOK_URL en config.js — sin activar por defecto).

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
XXXXXXX fix: Filtro anti-conduccion en geofencing (velocidad + distancia GPS)
d32f4f7 feat(ios): Prepara proyecto para build iOS en el futuro
53b9c45 feat(login): "Recuperar contraseña" visible y acentos en spanish
4f56dff docs: Refresca .md con estado completo previo a compilar 1.6.0
23c1021 fix: Icono de notificacion real (cacita silueta) en status bar
d964445 fix(map): contador real + markers con rating visible
68459d2 feat: Cagatrivia + boton me gusta en opiniones (1.6.0)
55c739d docs: Actualiza .md con estado 1.6.0 en curso
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
   ```
6. **Supabase → Storage**: crear bucket **`avatars`** con acceso **publico**.
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

## Compilacion para iOS (futuro)

El proyecto ya esta preparado para compilar para iOS. La compilacion
en si requiere un Mac con Xcode instalado (Apple no permite compilar
apps iOS desde Windows/Linux nativamente). Dos caminos:

### Opcion A — Compilar en un Mac local

En un Mac con Xcode 15+, Node 18+, y CocoaPods instalado:

```bash
cd Appreton
npm install
npx expo prebuild --platform ios --clean
cd ios
pod install
cd ..
npx expo run:ios --configuration Release
```

Requisitos adicionales:
- **Apple Developer Account** ($99/año) para compilar y firmar
  APPs que se puedan instalar en dispositivos reales. Sin la cuenta
  solo puedes probar en el simulador.
- **Provisioning profile** y **signing certificate** configurados
  en Xcode (con la cuenta Developer).

### Opcion B — EAS Build (se compila en la nube de Expo)

La forma mas facil sin necesidad de Mac:

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile preview
```

EAS compila en sus servidores Mac, te devuelve un `.ipa` que puedes
instalar en dispositivos via TestFlight o Apple Configurator.

Tambien necesitas una cuenta Apple Developer para firmar — aunque
EAS puede gestionar certificados automaticamente con `eas credentials`.

### Configuracion ya preparada en el repo

- `app.json` tiene la seccion `ios`:
  - `bundleIdentifier: "com.appreton.app"`
  - `buildNumber: "7"` (equivalente al versionCode de Android)
  - `NSLocationWhenInUseUsageDescription` y `NSLocationAlwaysAndWhenInUseUsageDescription`
    con acentos correctos.
  - `NSCameraUsageDescription` y `NSPhotoLibraryUsageDescription`
    para el picker de avatar.
  - `UIBackgroundModes: [location, fetch, processing]` para el
    geofencing en background.
  - `ITSAppUsesNonExemptEncryption: false` para saltar el tramite
    de exportacion de criptografia de Apple.
- `expo-build-properties` plugin con `ios.deploymentTarget: "15.1"`
  y `useFrameworks: "static"` — lo segundo es obligatorio para que
  `@react-native-google-signin/google-signin` v13 enlace bien con
  CocoaPods.
- `@react-native-google-signin/google-signin` plugin con
  `iosUrlScheme` ya configurado.
- `eas.json` con los tres perfiles (`development`, `preview`,
  `production`) listos para iOS.

### Lo que hay que hacer en Apple / Google Cloud para iOS

1. **Apple Developer Portal** (cuando tengas la cuenta):
   - Register App ID: `com.appreton.app`
   - Habilita capabilities: Push Notifications, Maps, Background Modes
     (Location updates, Background fetch).
   - Crea un provisioning profile Development y otro Distribution.

2. **Google Cloud → Auth Platform → Clientes**:
   - Crear un nuevo **OAuth Client iOS** con `com.appreton.app`
     como Bundle ID. Google te dara un Client ID tipo
     `1012059070308-xxxxx.apps.googleusercontent.com`.
   - El `iosUrlScheme` que tenemos en `app.json` sigue siendo el del
     Web Client ID (GoogleSignin.configure acepta el WebClientId
     tanto en Android como iOS). Pero Google necesita ver el cliente
     iOS registrado para que Apple no rechace el login.

3. **Google Maps API Key iOS**:
   - En Google Cloud → Credentials, edita la API Key actual de
     Google Maps y añade un **bundle restriction** para
     `com.appreton.app` (para iOS) ademas del paquete Android.
   - O crea una API Key separada solo para iOS.

4. **Supabase**: no hay que tocar nada — la configuracion de Google
   provider ya vale para ambas plataformas.

### Posibles ajustes especificos iOS cuando llegues a compilar

- `MapView` con `PROVIDER_GOOGLE` requiere Google Maps SDK iOS —
  cocoapods lo instala automaticamente con el plugin de react-native-maps.
- `expo-notifications` con notificaciones locales (las que usamos)
  funciona en iOS sin APNs. Si en el futuro quieres enviar push
  remoto necesitaras configurar APNs en Apple Developer Portal.
- `expo-task-manager` con geofencing funciona en iOS pero requiere
  permiso de ubicacion "Always" que el usuario debe conceder
  explicitamente. El flujo de permiso lo gestiona `expo-location`.
- Las notificaciones en iOS usan el icono de la app automaticamente —
  no se usa el `notification-icon.png` monocromo (ese es solo
  Android).
- **Fingerprint de firma**: en iOS no existe el concepto de SHA-1
  para OAuth — Apple usa bundle ID + Team ID. No hay que
  preocuparse por el keystore.

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
