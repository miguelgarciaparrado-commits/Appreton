# Cambios pendientes de compilar en APK

Estos cambios estan en el codigo pero el APK actual (ff5c53d) NO los incluye.
El APK debe compilarse desde el commit c4e8baf para tenerlos todos.

## Cambios funcionales principales

### Explorar
- Eliminada categoria "otro" — establecimientos sin tipo conocido se descartan
- Google Places filtra solo establecimientos OPERATIONAL (no barrios ni areas)

### Opiniones (AmenitiesBadges)
- Solo se muestran los badges que el usuario marco (papel, jabon, escobilla)
- Antes aparecian todos en rojo aunque no estuvieran seleccionados

### Rating
- La puntuacion se calcula desde las opiniones reales cargadas
- Antes mostraba 0.0 porque usaba el dato estatico de Google Places

### Opiniones en Explorar
- Arreglado: las opiniones aparecen al volver a Explorar tras dejar una
- Causa: getReviews ordenaba por created_at (no existe) en vez de date

### Perfil
- 18 avatares de caca para elegir (antes 6)
- Edicion de foto de perfil desde la pantalla de Perfil
- Foto personalizada persiste al cerrar la app (se copia a carpeta permanente)
- Version mostrada solo como numero en el pie (sin historial)

### Mapa
- Mapa real de Google Maps con markers de establecimientos
- Colores por tipo: bar=naranja, restaurante=rojo, gasolinera=azul, centro comercial=morado
- Boton para centrar en ubicacion actual

### Login / Password
- "Olvide mi password" envia email de reset desde APPRETON
- Al pulsar el enlace del email, la app abre pantalla para poner nueva contrasena
- El enlace redirige a appreton:// en vez de localhost:3000

### Rendimiento build Android
- Gradle con menos memoria (768m) y sin paralelismo para evitar crash del Worker Daemon

## Commits que faltan en el APK actual

| Commit  | Descripcion                                      |
|---------|--------------------------------------------------|
| 9bfe2f2 | Elimina categoria otro de Google Places           |
| fcddccf | Mapa real con Google Maps                         |
| c8d3043 | Oculta historial de versiones                     |
| 624da13 | Badges solo activos, rating desde reviews reales  |
| 285364d | getReviews ordena por date, cache correcto        |
| 0d21065 | Foto de avatar persiste al cerrar app             |
| 57a41d2 | 18 avatares, edicion de foto desde Perfil         |
| 3d7b061 | Mini juego (luego retirado del build)             |
| 6f03383 | Reset password: texto y redirectTo deep link      |
| 5cf72f4 | Reset password: pantalla nueva contrasena         |
| a79052f | iOS: Google Maps API key                          |
| 699324e | Gradle: menos memoria, sin paralelismo            |
| c4e8baf | Juego retirado temporalmente del build            |

## Pasos para compilar el APK correcto

En C:\Users\PC\Appreton ejecutar en CMD (no PowerShell):

```
git pull origin claude/recover-appleton-conversation-kT6dB
git log --oneline -3
```

El primer commit debe ser: c4e8baf

Luego:
```
npx expo prebuild --platform android --clean
echo sdk.dir=C\:\\Users\\PC\\AppData\\Local\\Android\\Sdk > android\local.properties
cd android
gradlew assembleRelease
```

APK final en: android\app\build\outputs\apk\release\app-release.apk
