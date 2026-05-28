import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReviews, reportReview, blockUser } from '../data/store';
import { getCurrentUser } from '../data/auth';
import PoopRating from '../components/PoopRating';
import AmenitiesBadges from '../components/AmenitiesBadges';

const TYPE_LABELS = {
  bar: '🍺 Bar',
  restaurante: '🍽️ Restaurante',
  gasolinera: '⛽ Gasolinera',
  centro_comercial: '🛒 Centro Comercial',
  otro: '🏢 Otro',
};

// T8 — Política de moderación visible
function showModerationPolicy() {
  Alert.alert(
    'Politica de contenido de Appreton',
    'Las opiniones deben ser honestas y referirse al estado del WC del establecimiento.\n\n' +
    'No se permite contenido ofensivo, spam ni informacion falsa.\n\n' +
    'Las opiniones reportadas por multiples usuarios seran revisadas y podran ser ocultadas si incumplen estas normas.',
    [{ text: 'Entendido', style: 'default' }]
  );
}

export default function PlaceDetailScreen({ route, navigation }) {
  const { place } = route.params;
  const [reviews, setReviews] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const [data, user] = await Promise.all([
      getReviews(place.id),
      getCurrentUser(),
    ]);
    setReviews(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setCurrentUser(user);
  }

  // T3 — Reportar opinión
  function handleReportPress(reviewId) {
    Alert.alert(
      'Reportar opinion',
      '¿Por que quieres reportar esta opinion?',
      [
        { text: 'Spam',               onPress: () => submitReport(reviewId, 'spam') },
        { text: 'Contenido ofensivo', onPress: () => submitReport(reviewId, 'ofensivo') },
        { text: 'Informacion falsa',  onPress: () => submitReport(reviewId, 'falso') },
        { text: 'Otro',               onPress: () => submitReport(reviewId, 'otro') },
        { text: 'Ver politica de contenido', onPress: showModerationPolicy },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }

  async function submitReport(reviewId, reason) {
    try {
      await reportReview(reviewId, reason);
      Alert.alert('Gracias', 'Gracias por tu reporte. Lo revisaremos pronto.');
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo enviar el reporte');
    }
  }

  // T7 — Bloquear usuario
  function handleBlockPress(userId) {
    Alert.alert(
      'Bloquear usuario',
      'No veras mas opiniones de este usuario. ¿Confirmas?',
      [
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: () => submitBlock(userId),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }

  async function submitBlock(userId) {
    try {
      await blockUser(userId);
      // Recargar lista sin las reviews del bloqueado
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo bloquear al usuario');
    }
  }

  // Calculate amenities summary
  const totalReviews = reviews.length;
  const paperPercent = totalReviews
    ? Math.round((reviews.filter((r) => r.hasPaper).length / totalReviews) * 100)
    : 0;
  const soapPercent = totalReviews
    ? Math.round((reviews.filter((r) => r.hasSoap).length / totalReviews) * 100)
    : 0;
  const brushPercent = totalReviews
    ? Math.round((reviews.filter((r) => r.hasBrush).length / totalReviews) * 100)
    : 0;
  const orderReviews = reviews.filter((r) => r.requiredOrder != null);
  const orderPercent = orderReviews.length
    ? Math.round((orderReviews.filter((r) => r.requiredOrder).length / orderReviews.length) * 100)
    : null;

  const renderHeader = () => (
    <View>
      <View style={styles.placeHeader}>
        <Text style={styles.type}>{TYPE_LABELS[place.type] || '🏢 Otro'}</Text>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.address}>{place.address}</Text>
        <View style={styles.ratingRow}>
          <PoopRating rating={place.avgRating} size={28} readonly />
          <Text style={styles.ratingText}>{place.avgRating.toFixed(1)}/5</Text>
        </View>
      </View>

      {totalReviews > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de equipamiento</Text>
          <AmenityBar label="🧻 Papel" percent={paperPercent} />
          <AmenityBar label="🧴 Jabon" percent={soapPercent} />
          <AmenityBar label="🪥 Escobilla" percent={brushPercent} />
          {orderPercent != null && (
            <AmenityBar label="🍺 Piden consumir" percent={orderPercent} />
          )}
        </View>
      )}

      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewsTitle}>Opiniones ({totalReviews})</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddReview', { place })}
        >
          <Text style={styles.addBtnText}>+ Opinar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReview = ({ item }) => {
    const isOwnReview = currentUser && item.userId === currentUser.id;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewTop}>
          <PoopRating rating={item.rating} size={18} readonly />
          <Text style={styles.reviewDate}>{item.date}</Text>
        </View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
        <AmenitiesBadges review={item} />

        {/* T3+T7 — Botones de moderación (solo en reviews ajenas) */}
        {!isOwnReview && (
          <View style={styles.moderationRow}>
            <TouchableOpacity
              style={styles.moderationBtn}
              onPress={() => handleReportPress(item.id)}
            >
              <Text style={styles.moderationBtnText}>⚑ Reportar</Text>
            </TouchableOpacity>
            {item.userId && (
              <TouchableOpacity
                style={[styles.moderationBtn, styles.blockBtn]}
                onPress={() => handleBlockPress(item.userId)}
              >
                <Text style={[styles.moderationBtnText, styles.blockBtnText]}>🚫 Bloquear</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderReview}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aun no hay opiniones</Text>
            <Text style={styles.emptySubtext}>Se el primero en opinar!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function AmenityBar({ label, percent }) {
  return (
    <View style={styles.amenityRow}>
      <Text style={styles.amenityLabel}>{label}</Text>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percent}%`,
              backgroundColor: percent >= 70 ? '#27AE60' : percent >= 40 ? '#F39C12' : '#E74C3C',
            },
          ]}
        />
      </View>
      <Text style={styles.amenityPercent}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#F5F0E1' },
  list:           { paddingBottom: 40 },
  placeHeader:    { backgroundColor: '#8B6914', padding: 20, paddingTop: 10 },
  type:           { fontSize: 14, color: '#F5DEB3', marginBottom: 4 },
  name:           { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  address:        { fontSize: 14, color: '#F5DEB3', marginBottom: 12 },
  ratingRow:      { flexDirection: 'row', alignItems: 'center' },
  ratingText:     { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginLeft: 10 },
  summaryCard:    { backgroundColor: '#FFF', margin: 16, borderRadius: 16, padding: 16, elevation: 2 },
  summaryTitle:   { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  amenityRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  amenityLabel:   { width: 90, fontSize: 13 },
  barBg:          { flex: 1, height: 10, backgroundColor: '#EAECEE', borderRadius: 5, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 5 },
  amenityPercent: { width: 40, textAlign: 'right', fontSize: 13, fontWeight: '600', color: '#2C3E50' },
  reviewsHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  reviewsTitle:   { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  addBtn:         { backgroundColor: '#8B6914', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText:     { color: '#FFF', fontWeight: '600', fontSize: 14 },
  reviewCard:     { backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 6, borderRadius: 12, padding: 14, elevation: 1 },
  reviewTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewDate:     { fontSize: 12, color: '#999' },
  reviewComment:  { fontSize: 14, color: '#2C3E50', marginTop: 8, lineHeight: 20 },
  moderationRow:  { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  moderationBtn:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FAFAFA' },
  moderationBtnText: { fontSize: 12, color: '#888' },
  blockBtn:       { borderColor: '#FADBD8' },
  blockBtnText:   { color: '#C0392B' },
  empty:          { alignItems: 'center', paddingTop: 40 },
  emptyText:      { fontSize: 16, color: '#666' },
  emptySubtext:   { fontSize: 14, color: '#999', marginTop: 4 },
});
