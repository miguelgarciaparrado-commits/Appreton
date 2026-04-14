import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import PoopRating from '../components/PoopRating';
import { upsertReview, getUserReviewForPlace } from '../data/store';

const EXTRAS_OPTIONS = [
  { icon: '💨', label: 'Secador de manos' },
  { icon: '👶', label: 'Cambiador de bebes' },
  { icon: '♿', label: 'Accesible' },
  { icon: '🗑️', label: 'Papelera con tapa' },
  { icon: '🪟', label: 'Buena ventilacion' },
  { icon: '🌸', label: 'Buen olor' },
  { icon: '🔒', label: 'Cierre en la puerta' },
  { icon: '💡', label: 'Buena iluminacion' },
  { icon: '🪞', label: 'Espejo' },
  { icon: '🧽', label: 'Bien limpio' },
];

export default function AddReviewScreen({ route, navigation }) {
  const { place } = route.params;
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasPaper, setHasPaper] = useState(false);
  const [hasSoap, setHasSoap] = useState(false);
  const [hasBrush, setHasBrush] = useState(false);
  const [requiredOrder, setRequiredOrder] = useState(null); // null = not answered, true = yes, false = no
  const [extras, setExtras] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Al montar, comprobamos si el usuario ya habia opinado este sitio.
  // Si si, entramos en modo edicion y precargamos el formulario.
  useEffect(() => {
    (async () => {
      try {
        const existing = await getUserReviewForPlace(place.id);
        if (existing) {
          setIsEditMode(true);
          setRating(existing.rating || 0);
          setComment(existing.comment || '');
          setHasPaper(!!existing.hasPaper);
          setHasSoap(!!existing.hasSoap);
          setHasBrush(!!existing.hasBrush);
          setRequiredOrder(
            existing.requiredOrder === undefined ? null : existing.requiredOrder
          );
          setExtras(existing.extras || []);
        }
      } catch {}
      setLoading(false);
    })();
  }, [place.id]);

  async function handleSubmit() {
    if (submitting) return; // evita doble-tap
    if (rating === 0) {
      Alert.alert('Ey!', 'Pon una valoracion con las cacas 💩');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Ey!', 'Escribe un comentario sobre el WC');
      return;
    }

    setSubmitting(true);

    // Capturamos la ubicacion del usuario para el bonus "estaba en el sitio"
    // (si hay permiso). Silenciamos errores: si no hay GPS, simplemente no
    // cuenta como on-site.
    let userCoords = null;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        userCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
      }
    } catch {}

    let result;
    try {
      result = await upsertReview(
        {
          placeId: place.id,
          rating,
          comment: comment.trim(),
          hasPaper,
          hasSoap,
          hasBrush,
          requiredOrder,
          extras,
        },
        { userCoords }
      );
    } catch (e) {
      setSubmitting(false);
      Alert.alert('Error', e?.message || 'No se pudo guardar tu opinion. Intentalo de nuevo.');
      return;
    }

    if (result.wasEdit) {
      Alert.alert('Guardado 📝', 'Tu opinion se ha actualizado (sin XP por editar)', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // Nueva opinion: mostramos feedback con el XP ganado
    let msg;
    if (result.dailyCapHit) {
      msg = 'Tu opinion se ha guardado. Hoy ya has superado el limite diario de XP (10 opiniones).';
    } else {
      const parts = [`+${result.xpGained} XP`];
      if (result.bonuses?.isFirstOnPlace) parts.push('🏆 Primer opinador (+15)');
      if (result.bonuses?.isOnSite) parts.push('📍 Estabas alli (+15)');
      if (result.bonuses?.hasLongComment) parts.push('📝 Detallado (+5)');
      msg = parts.join('\n');
      if (result.leveledUp && result.levelInfo) {
        msg += `\n\n🎉 Has subido a nivel ${result.levelInfo.level}: ${result.levelInfo.title}!`;
      }
    }
    Alert.alert('Gracias! 💩', msg, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#8B6914" />
            </View>
          )}

          {isEditMode && !loading && (
            <View style={styles.editBanner}>
              <Text style={styles.editBannerIcon}>✏️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.editBannerTitle}>Estas editando tu opinion</Text>
                <Text style={styles.editBannerText}>
                  Los cambios no dan XP. Solo la primera opinion de un sitio puntua.
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.title}>
            {isEditMode ? 'Editar opinion de' : 'Opinar sobre'}
          </Text>
          <Text style={styles.placeName}>{place.name}</Text>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.label}>Limpieza del WC</Text>
            <View style={styles.ratingContainer}>
              <PoopRating rating={rating} onRate={setRating} size={40} />
            </View>
            <Text style={styles.ratingHint}>
              {rating === 0
                ? 'Toca las cacas para valorar'
                : rating === 1
                ? 'Terrible, mejor aguantarse 🤮'
                : rating === 2
                ? 'Bastante malo, que asco 🤢'
                : rating === 3
                ? 'Podria estar mejor 😐'
                : rating === 4
                ? 'Bastante bien! 👍'
                : 'Impecable, un placer 🌟'}
            </Text>
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.label}>Tu opinion</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Cuenta como estaba el WC..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.label}>Equipamiento</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🧻 Hay papel</Text>
              <Switch
                value={hasPaper}
                onValueChange={setHasPaper}
                trackColor={{ false: '#DDD', true: '#8B6914' }}
                thumbColor={hasPaper ? '#FFF' : '#FFF'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🧴 Hay jabon</Text>
              <Switch
                value={hasSoap}
                onValueChange={setHasSoap}
                trackColor={{ false: '#DDD', true: '#8B6914' }}
                thumbColor={hasSoap ? '#FFF' : '#FFF'}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>🪥 Hay escobilla</Text>
              <Switch
                value={hasBrush}
                onValueChange={setHasBrush}
                trackColor={{ false: '#DDD', true: '#8B6914' }}
                thumbColor={hasBrush ? '#FFF' : '#FFF'}
              />
            </View>
          </View>

          {/* Required order */}
          <View style={styles.section}>
            <Text style={styles.label}>Consumicion obligatoria</Text>
            <Text style={styles.hint}>Te obligaron a pedir algo para usar el WC?</Text>
            <View style={styles.orderRow}>
              <TouchableOpacity
                style={[
                  styles.orderBtn,
                  requiredOrder === true && styles.orderBtnYes,
                ]}
                onPress={() => setRequiredOrder(true)}
              >
                <Text style={[
                  styles.orderBtnText,
                  requiredOrder === true && styles.orderBtnTextActive,
                ]}>
                  🍺 Me toco pedir consumicion
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.orderBtn,
                  requiredOrder === false && styles.orderBtnNo,
                ]}
                onPress={() => setRequiredOrder(false)}
              >
                <Text style={[
                  styles.orderBtnText,
                  requiredOrder === false && styles.orderBtnTextActive,
                ]}>
                  🆓 Pude entrar y salir sin pedir nada
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Extras */}
          <View style={styles.section}>
            <Text style={styles.label}>Extras del WC</Text>
            <Text style={styles.hint}>Selecciona lo que tiene</Text>
            <View style={styles.extraGrid}>
              {EXTRAS_OPTIONS.map((opt) => {
                const selected = extras.includes(opt.label);
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.extraChip, selected && styles.extraChipSelected]}
                    onPress={() =>
                      setExtras(
                        selected
                          ? extras.filter((e) => e !== opt.label)
                          : [...extras, opt.label]
                      )
                    }
                  >
                    <Text style={styles.extraChipIcon}>{opt.icon}</Text>
                    <Text style={[styles.extraChipText, selected && styles.extraChipTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>
                {isEditMode ? 'Guardar cambios' : 'Enviar opinion 💩'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingBox: {
    alignItems: 'center',
    padding: 20,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#F0C400',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  editBannerIcon: { fontSize: 20 },
  editBannerTitle: { fontSize: 14, fontWeight: '800', color: '#7A5D00', marginBottom: 2 },
  editBannerText: { fontSize: 12, color: '#7A5D00', lineHeight: 17 },
  title: {
    fontSize: 16,
    color: '#666',
  },
  placeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  ratingHint: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  commentInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  switchLabel: {
    fontSize: 16,
    color: '#2C3E50',
  },
  orderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  orderBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  orderBtnYes: {
    backgroundColor: '#FDEDEC',
    borderColor: '#E74C3C',
  },
  orderBtnNo: {
    backgroundColor: '#D5F5E3',
    borderColor: '#27AE60',
  },
  orderBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  orderBtnTextActive: {
    color: '#2C3E50',
  },
  extraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  extraChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    gap: 6,
  },
  extraChipSelected: {
    backgroundColor: '#FFF9E6',
    borderColor: '#8B6914',
  },
  extraChipIcon: { fontSize: 16 },
  extraChipText: { fontSize: 13, color: '#888', fontWeight: '500' },
  extraChipTextSelected: { color: '#8B6914', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#8B6914',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
