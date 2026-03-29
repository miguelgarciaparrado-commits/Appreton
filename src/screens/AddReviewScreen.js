import React, { useState } from 'react';
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
} from 'react-native';
import PoopRating from '../components/PoopRating';
import { addReview } from '../data/store';

export default function AddReviewScreen({ route, navigation }) {
  const { place } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasPaper, setHasPaper] = useState(false);
  const [hasSoap, setHasSoap] = useState(false);
  const [hasBrush, setHasBrush] = useState(false);
  const [requiredOrder, setRequiredOrder] = useState(null); // null = not answered, true = yes, false = no
  const [extras, setExtras] = useState([]);
  const [newExtra, setNewExtra] = useState('');

  function addExtra() {
    const trimmed = newExtra.trim();
    if (trimmed && !extras.includes(trimmed)) {
      setExtras([...extras, trimmed]);
      setNewExtra('');
    }
  }

  function removeExtra(index) {
    setExtras(extras.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Ey!', 'Pon una valoracion con las cacas 💩');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Ey!', 'Escribe un comentario sobre el bano');
      return;
    }

    await addReview({
      placeId: place.id,
      rating,
      comment: comment.trim(),
      hasPaper,
      hasSoap,
      hasBrush,
      requiredOrder,
      extras,
    });

    Alert.alert('Gracias! 💩', 'Tu opinion ha sido guardada', [
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
          <Text style={styles.title}>Opinar sobre</Text>
          <Text style={styles.placeName}>{place.name}</Text>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.label}>Limpieza del bano</Text>
            <View style={styles.ratingContainer}>
              <PoopRating rating={rating} onRate={setRating} size={40} />
            </View>
            <Text style={styles.ratingHint}>
              {rating === 0
                ? 'Toca las cacas para valorar'
                : rating <= 2
                ? 'Uf, que asco... 🤢'
                : rating <= 3
                ? 'Podria estar mejor 😐'
                : rating <= 4
                ? 'Bastante bien! 👍'
                : 'Impecable! ✨'}
            </Text>
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.label}>Tu opinion</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Cuenta como estaba el bano..."
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
            <Text style={styles.hint}>Te obligaron a pedir algo para usar el bano?</Text>
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
            <Text style={styles.label}>Extras</Text>
            <Text style={styles.hint}>Anade otros detalles (secador, cambiador...)</Text>

            <View style={styles.extraInputRow}>
              <TextInput
                style={styles.extraInput}
                placeholder="Ej: Secador de manos"
                placeholderTextColor="#999"
                value={newExtra}
                onChangeText={setNewExtra}
                onSubmitEditing={addExtra}
              />
              <TouchableOpacity style={styles.extraAddBtn} onPress={addExtra}>
                <Text style={styles.extraAddText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.extrasList}>
              {extras.map((extra, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.extraBadge}
                  onPress={() => removeExtra(index)}
                >
                  <Text style={styles.extraBadgeText}>✨ {extra} ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Enviar opinion 💩</Text>
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
  extraInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  extraInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  extraAddBtn: {
    backgroundColor: '#8B6914',
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraAddText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  extrasList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  extraBadge: {
    backgroundColor: '#EBF5FB',
    borderColor: '#3498DB',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  extraBadgeText: {
    fontSize: 13,
    color: '#2980B9',
  },
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
