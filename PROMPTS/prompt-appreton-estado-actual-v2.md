# Prompt Appreton — Estado actual + Pendientes producción (v2 — Mayo 2026)

---

## Contexto del proyecto

**App:** Appreton — app Android React Native + Expo donde usuarios valoran baños de establecimientos.  
**Package:** `com.miguelgp.appreton`  
**Stack:** React Native + Expo, Supabase (`gcperiixkrrqoydfmned`), Google Maps/Places API, Firebase (`appreton-16797`).  
**Entorno:** Windows 10/11, JAVA_HOME: `C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot`, proyecto en `C:\Users\PC\Appreton`.  
**Play Store:** Publicada en Prueba Interna. versionCode 4, versionName 1.0.0.

---

## Estado actual (post-sesión Mayo 2026)

### ✅ Resuelto hoy — Google Sign-In nativo

**Problema:** DEVELOPER_ERROR → Unacceptable audience in id_token.  
**Causa raíz:** Múltiples problemas encadenados:

1. APK no estaba firmado (keystore.properties con ruta relativa rota → cambiada a ruta absoluta).
2. `build.gradle` tenía `signingConfigs.release` fuera del bloque `android {}` → reestructurado correctamente.
3. `GOOGLE_WEB_CLIENT_ID` en `src/config.js` apuntaba al cliente iOS (`1012059070308-...`) → corregido al Web Client (`37060093629-icf40rgsgg3bm8qdnusc65dup7uj3k96.apps.googleusercontent.com`).
4. Configuración de Supabase se estaba haciendo en el proyecto equivocado (`ifqftuqkdgsepvtqwefp`) en vez del correcto (`gcperiixkrrqoydfmned`).

**Configuración final correcta:**
- `src/config.js` → `GOOGLE_WEB_CLIENT_ID = '37060093629-icf40rgsgg3bm8qdnusc65dup7uj3k96.apps.googleusercontent.com'`
- Supabase proyecto `gcperiixkrrqoydfmned` → Authentication → Google → Client IDs: `37060093629-icf40rgsgg3bm8qdnusc65dup7uj3k96.apps.googleusercontent.com`
- Firebase `appreton-16797` → SHA-1 registradas: `CF:3F:CD:71...` (upload key local) y `92:97:42:C4...` (Google Play App Signing).
- OAuth Client Android `37060093629-0cu450v1...` → ambas SHA-1 registradas.

### ✅ Firma de APK

- Keystore: `C:/Users/PC/Appreton/appreton-release.keystore`, alias `appreton-release`.
- `android/keystore.properties` → `storeFile` con ruta absoluta.
- `android/app/build.gradle` → `signingConfigs.release` dentro de `android {}`.
- Verificado con `apksigner verify --print-certs` → SHA-1: `CF:3F:CD:71...` ✅

### ✅ Play Store

- versionCode 4 subido a Prueba Interna.
- Google Play App Signing SHA-1: `92:97:42:C4:0D:9C:55:2A:45:D9:59:B8:85:5B:1A:FB:8F:FB:E6:D3`

---

## Comandos de compilación

```powershell
# Setear entorno
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
cd C:\Users\PC\Appreton\android

# AAB para Play Store
.\gradlew bundleRelease 2>&1 | Tee-Object -FilePath C:\Users\PC\compilacion-aab.log

# APK para instalar local (enviar por WhatsApp/Telegram)
.\gradlew assembleRelease -x lintVitalAnalyzeRelease -x lintVitalRelease 2>&1 | Tee-Object -FilePath C:\Users\PC\compilacion-apk.log
```

**Outputs:**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

**Nota:** `versionCode` se modifica en `android/app/build.gradle` (no en `app.json`) cuando se compila con Gradle directo.

---

## Advertencias críticas

- `JAVA_HOME` debe estar seteado antes de cualquier build con Gradle.
- El `google-services.json` vive en `android/app/google-services.json` para builds con Gradle. El de la raíz (`./google-services.json`) solo se usa durante `expo prebuild`.
- Si se hace `expo prebuild --clean`, se sobreescribe `android/app/build.gradle` y hay que re-aplicar los cambios de `signingConfigs`.
- El plugin `./plugins/signing-config` solo aplica durante `prebuild`, no durante builds directos con Gradle.
- No mezclar contexto con el proyecto Trading Journal. Prompts y CLAUDE.md separados.
- Imágenes >2000px rompen sesiones de Claude Code: resize antes de adjuntar.

---

## Pendientes para producción (no bloqueantes)

### Bug: "Racha de 1 día" siempre

**Síntoma:** El contador de racha siempre muestra "1 día" aunque el usuario lleve días sin entrar.  
**Archivo:** `src/data/auth.js` → función `computeDailyProgress`.  
**Probable causa:** Bug de zona horaria en `todayStr()` / `yesterdayStr()` — `new Date().toISOString()` devuelve UTC, no hora local España (CEST = UTC+2). Si el usuario entra entre las 00:00 y las 02:00 hora española, la fecha calculada es la del día anterior.  
**Fix sugerido:**

```javascript
function todayStr() {
  return new Date().toLocaleDateString('sv-SE'); // formato YYYY-MM-DD en hora local
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('sv-SE');
}
```

### Bug: Zona horaria en timestamps

Mismo problema raíz que el bug de racha. Revisar todos los `new Date().toISOString()` que se guardan en Supabase y verificar si deben ser UTC o hora local.

### Bug: Cobertura POIs

Verificar que los puntos de interés (establecimientos) se muestran correctamente en todas las zonas. Posible problema con radio de búsqueda o filtros de categoría en Google Places API.

### UGC Tools

Implementar:
- Reportar opinión (flag de usuario)
- Bloquear usuario
- Política de moderación visible para usuarios

### Restricción API Keys Google Cloud

- Maps API Key: restringir por package `com.miguelgp.appreton` + SHA-1.
- Places API Key: ídem.
- Configurar alertas de presupuesto en Google Cloud Console.

### Emails Supabase Auth

- Personalizar textos en español con branding APPreton.
- SMTP propio ya configurado (Resend, `smtp.resend.com`).
- Plantillas a personalizar: confirmación de registro, cambio de email, recuperación de contraseña.
- Ir a: Supabase → Authentication → Email Templates.

### Eliminar abiFilters para producción

En `android/app/build.gradle`, el bloque:

```gradle
ndk {
    abiFilters "arm64-v8a"
}
```

Fue añadido para acelerar builds de desarrollo. **Eliminarlo antes del lanzamiento a producción** para soportar todos los dispositivos (armeabi-v7a, x86, x86_64).

### AdMob (pendiente de implementación)

- Banner + Interstitial planificados pero no implementados.
- App ID de AdMob pendiente de configurar.

---

## Arquitectura de autenticación (estado actual)

```
loginWithGoogleNative()  →  GoogleSignin.signIn()  →  idToken (aud: 37060093629-...)
                         →  supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
                         →  GoTrue valida aud contra Client IDs configurados
                         →  Sesión Supabase creada
                         →  Perfil leído/creado en user_profiles
```

**Flujo alternativo (web OAuth):** `loginWithProvider('google')` → `signInWithOAuth` → WebBrowser. Funciona como fallback pero abre navegador.

---

## Supabase — Tablas principales

- `user_profiles` — perfiles de usuario (xp, nivel, racha, avatar)
- `reviews` — opiniones de baños (rating 1-5 💩, texto, checks, moderation_status)
- `avatars` bucket — imágenes de avatar

**Moderación de reviews:** `visible` / `pending_review` / `hidden`. Filtrado en `store.js` en Android.

---

## Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `src/config.js` | API keys y configuración global (GOOGLE_WEB_CLIENT_ID, GOOGLE_PLACES_API_KEY) |
| `src/data/auth.js` | Lógica de autenticación (Google nativo, email, OAuth) |
| `src/data/supabase.js` | Cliente Supabase |
| `android/app/build.gradle` | Config nativa Android (firma, versiones SDK, ABI) |
| `android/keystore.properties` | Credenciales keystore (NO subir a git) |
| `android/app/google-services.json` | Config Firebase para builds nativos |
| `google-services.json` (raíz) | Config Firebase para expo prebuild |
