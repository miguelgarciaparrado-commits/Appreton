# Appreton - Informacion de tiendas (Google Play + App Store)

Este documento contiene toda la metadata y textos necesarios para publicar Appreton
tanto en **Google Play Store** (Android) como en la **Apple App Store** (iOS).

> Appreton es una app Expo / React Native, por lo que la misma base de codigo sirve
> para ambas plataformas. La version actual ya esta configurada para builds Android
> (EAS) y preparada para iOS — solo falta proyectar el build en EAS cuando haya
> cuenta de Apple Developer ($99/ano).

---

## 1. Nombre de la app

**Appreton - Te cagas? abreme**

- Nombre corto (Play): `Appreton`
- Nombre corto (iOS, max 30 car.): `Appreton`
- Subtitulo iOS (max 30 car.): `Te cagas? abreme`

## 2. Descripcion breve

- Google Play (max 80 car.): `Encuentra los banos publicos mas limpios cerca de ti. Te cagas? abreme!`
- App Store "Promotional text" (max 170 car.): `Encuentra los banos publicos mas limpios cerca de ti. Valora limpieza, papel, jabon y escobilla. Ranking de Appretoneros en tiempo real.`

## 3. Descripcion completa

¿Te ha pasado alguna vez que necesitas ir al bano urgentemente y no sabes donde ir? ¿Has entrado en un bar y el bano estaba asqueroso? Appreton es tu solucion.

Appreton es la app definitiva para encontrar y valorar los banos publicos de bares, gasolineras, centros comerciales, restaurantes y cualquier sitio publico.

🚽 ENCUENTRA BANOS CERCANOS
- Detecta tu ubicacion automaticamente
- Muestra los sitios con bano a menos de 1 km
- Te dice a cuantos metros esta cada uno

💩 VALORA LA LIMPIEZA
- Sistema de valoracion con cacas (de 1 a 5)
- Indica si hay papel, jabon y escobilla
- Comenta si te obligaron a pedir consumicion

🏆 RANKING DE LOS MEJORES BANOS
- Descubre los banos mas limpios cerca de ti
- Ranking en tiempo real segun las opiniones de los usuarios

👤 SUBE DE NIVEL
- Crea tu perfil con un divertido avatar de caca
- Gana experiencia con cada opinion
- Sube de nivel: desde "Cagoncete" hasta "Leyenda del Trono"
- Compite en el ranking de Appretoneros

🆓 GRATIS Y SIN PUBLICIDAD

## 4. Categoria

- Google Play: `Viajes y guias`
- App Store primaria: `Travel`
- App Store secundaria: `Lifestyle`

## 5. Etiquetas / keywords

banos, aseos, lavabos, WC, bares, gasolineras, limpieza, opiniones, reviews, toilet, bathroom

> En App Store el campo `keywords` tiene un limite de 100 caracteres separados por comas
> y cuenta para el algoritmo de busqueda. Sugerencia:
> `banos,aseos,WC,lavabo,toilet,bathroom,bar,limpieza,reviews,cerca`

## 6. Clasificacion de contenido

- Google Play: `Todos (E - Everyone)`
- App Store age rating: `4+` (sin contenido sensible; el tono humoristico sobre "caca"
  no implica contenido ofensivo segun las guidelines de Apple)

## 7. Permisos / privacidad

Permisos que la app solicita (los mismos en ambas plataformas):

| Permiso | Uso | iOS Info.plist key | Android |
|---|---|---|---|
| Ubicacion (en uso) | Buscar banos cercanos | `NSLocationWhenInUseUsageDescription` | `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` |
| Camara | Foto del bano en la review | `NSCameraUsageDescription` | `CAMERA` |
| Galeria de fotos | Elegir foto existente | `NSPhotoLibraryUsageDescription` | (scoped storage) |

**Politica de privacidad:** hay que alojar una URL publica (GitHub Pages, Notion, etc.)
antes de publicar en cualquier tienda. Debe cubrir: datos recogidos (ubicacion, fotos,
email opcional), almacenamiento local con AsyncStorage, que **no** compartimos con
terceros, y derechos del usuario.

**App Store App Privacy questionnaire** (resumen de respuestas):
- Data linked to you: None (por ahora todo es local).
- Data used to track you: None.
- Location: Coarse + Precise, usada en la app, no linked to identity, no tracking.
- User content: Photos, only used for app functionality, no linked to identity.

## 8. Assets graficos requeridos

### Google Play

- Icono: `assets/icon.png` (512x512, ya generado)
- Feature graphic: 1024x500 PNG (pendiente)
- Screenshots: minimo 2, recomendado 4-8, tamano phone entre 320-3840 px
- Adaptive icon: `assets/adaptive-icon.png` + background `#8B6914` (ya configurado)

### Apple App Store

- Icono iOS: 1024x1024 PNG sin alpha, sin esquinas redondeadas (Apple las aplica)
- Screenshots obligatorios:
  - iPhone 6.7" (1290x2796) — minimo 3
  - iPhone 6.5" (1242x2688 o 1284x2778) — opcional pero recomendado
  - iPad 12.9" (2048x2732) — solo si marcamos `supportsTablet: true`, que es el caso
- Video preview (opcional, max 30s)

> `generate_icons.py` ya produce los iconos Android. Para iOS, Expo usa `assets/icon.png`
> automaticamente al hacer `eas build --platform ios` — tiene que ser cuadrado 1024x1024.

## 9. Informacion tecnica

### Android (Google Play)
- `applicationId`: `com.appreton.app`
- `versionCode`: 1
- `versionName`: 1.0.0
- `minSdkVersion`: 24
- `targetSdkVersion`: 34
- `compileSdkVersion`: 35
- Build: EAS → `app-bundle (.aab)`
- Canal: `production`

### iOS (App Store)
- `bundleIdentifier`: `com.appreton.app`
- `buildNumber`: 1
- `version`: 1.0.0
- `deploymentTarget`: iOS 15.1 (minimo recomendado para Expo SDK 52)
- `supportsTablet`: true (iPad compatible)
- Build: EAS → `archive (.ipa)`
- Distribucion: `app-store`

### Requisitos para publicar en App Store
1. **Apple Developer Program** activo ($99/ano).
2. **App Store Connect**: crear la app con el bundle ID `com.appreton.app`.
3. **Certificados / provisioning**: EAS los gestiona automaticamente con
   `eas credentials` si se le da acceso a la cuenta Apple.
4. **eas submit --platform ios** para subir a TestFlight y luego a produccion.

## 10. Changelog (version 1.0.0)

- Primera version publica.
- Descubrir banos cercanos (<1 km) con distancia en metros.
- Reviews con rating de cacas, papel/jabon/escobilla, consumicion obligatoria.
- Cuentas de usuario, avatares de caca y ranking Appretoneros.
- Foto del bano opcional en la review (camara o galeria).
- Disponible en Android. Version iOS en preparacion.

---

## Roadmap multiplataforma

- [x] Base de codigo Expo / React Native (cross-platform desde el commit inicial).
- [x] Config iOS basica en `app.json` (`bundleIdentifier`, `supportsTablet`).
- [x] Permisos iOS declarados via plugins `expo-location` y `expo-image-picker`.
- [x] Perfiles de build iOS en `eas.json` (development, preview, production).
- [x] `infoPlist` con usage descriptions explicitas y `ITSAppUsesNonExemptEncryption`.
- [ ] Cuenta Apple Developer activa.
- [ ] Primer build iOS con `eas build --platform ios --profile preview`.
- [ ] Screenshots iPhone 6.7" y iPad 12.9".
- [ ] Politica de privacidad publicada.
- [ ] Ficha en App Store Connect rellenada.
- [ ] Submit a TestFlight y revision.
