import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUser, getLevelInfo, getAllLevels, logout, saveUserProfile } from '../data/auth';
import PoopAvatar, { getAllPoopAvatars } from '../components/PoopAvatar';
import { CURRENT_VERSION } from '../version';

export default function ProfileScreen({ onLogout, onEditProfile }) {
  const [user, setUser] = useState(null);
  const [levelInfo, setLevelInfo] = useState(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  async function loadUser() {
    const u = await getCurrentUser();
    if (u) {
      setUser(u);
      setLevelInfo(getLevelInfo(u.xp || 0));
    }
  }

  async function savePermanentAvatar(tempUri) {
    const fileName = `avatar_${user?.id || Date.now()}.jpg`;
    const destPath = FileSystem.documentDirectory + fileName;
    await FileSystem.copyAsync({ from: tempUri, to: destPath });
    return destPath;
  }

  async function pickAvatarFromGallery() {
    setAvatarModalVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galeria'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = await savePermanentAvatar(result.assets[0].uri);
        const updated = await saveUserProfile({ avatarType: 'custom', customAvatarUri: uri });
        setUser(updated);
      }
    } catch { Alert.alert('Error', 'No se pudo seleccionar la imagen'); }
  }

  async function pickAvatarFromCamera() {
    setAvatarModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a la camara'); return; }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = await savePermanentAvatar(result.assets[0].uri);
        const updated = await saveUserProfile({ avatarType: 'custom', customAvatarUri: uri });
        setUser(updated);
      }
    } catch { Alert.alert('Error', 'No se pudo tomar la foto'); }
  }

  async function selectPoopAvatar(avatarKey) {
    setAvatarModalVisible(false);
    const updated = await saveUserProfile({ avatarType: avatarKey, customAvatarUri: null });
    setUser(updated);
  }

  function handleLogout() {
    Alert.alert(
      'Cerrar sesion',
      'Seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onLogout();
          },
        },
      ]
    );
  }

  if (!user || !levelInfo) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allLevels = getAllLevels();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header / Avatar section */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={() => setAvatarModalVisible(true)} style={styles.avatarWrapper}>
            <PoopAvatar type={user.avatarType} customUri={user.customAvatarUri} size={110} />
            <View style={styles.editAvatarBadge}>
              <Text style={styles.editAvatarIcon}>{'\uD83D\uDCF8'}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <View style={styles.providerBadge}>
            <Text style={styles.providerText}>
              {user.provider === 'google' ? '\uD83C\uDF10' :
               user.provider === 'instagram' ? '\uD83D\uDCF7' :
               user.provider === 'facebook' ? '\uD83D\uDC64' : '\uD83C\uDF4F'}{' '}
              {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
            </Text>
          </View>
        </View>

        {/* Level badge */}
        <View style={styles.levelBadgeSection}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeEmoji}>
              {levelInfo.level <= 2 ? '\uD83D\uDCA9' :
               levelInfo.level <= 4 ? '\uD83D\uDCA9\u2728' : '\uD83D\uDCA9\uD83D\uDC51'}
            </Text>
            <Text style={styles.levelBadgeTitle}>{levelInfo.title}</Text>
            <Text style={styles.levelBadgeLevel}>Nivel {levelInfo.level}</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>Experiencia</Text>
            <Text style={styles.xpValue}>{levelInfo.xp} XP</Text>
          </View>
          {!levelInfo.isMaxLevel ? (
            <>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(levelInfo.progress * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.xpNext}>
                {levelInfo.xpForNext - levelInfo.xp} XP para el siguiente nivel
              </Text>
            </>
          ) : (
            <>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '100%' }]} />
              </View>
              <Text style={styles.xpNext}>Nivel maximo alcanzado!</Text>
            </>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user.totalReviews || 0}</Text>
            <Text style={styles.statLabel}>Opiniones</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{levelInfo.level}</Text>
            <Text style={styles.statLabel}>Nivel</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user.xp || 0}</Text>
            <Text style={styles.statLabel}>XP Total</Text>
          </View>
        </View>

        {/* Member since */}
        <View style={styles.memberSince}>
          <Text style={styles.memberSinceText}>
            Miembro desde {user.joinDate || 'hoy'}
          </Text>
        </View>

        {/* Level roadmap */}
        <View style={styles.roadmapSection}>
          <Text style={styles.roadmapTitle}>Niveles</Text>
          {allLevels.map((lvl) => {
            const isCurrent = lvl.level === levelInfo.level;
            const isUnlocked = user.xp >= lvl.minXp;
            return (
              <View
                key={lvl.level}
                style={[
                  styles.roadmapItem,
                  isCurrent && styles.roadmapItemCurrent,
                  !isUnlocked && styles.roadmapItemLocked,
                ]}
              >
                <View style={styles.roadmapLeft}>
                  <Text style={styles.roadmapLevel}>Nv.{lvl.level}</Text>
                </View>
                <View style={styles.roadmapCenter}>
                  <Text
                    style={[
                      styles.roadmapName,
                      isCurrent && styles.roadmapNameCurrent,
                      !isUnlocked && styles.roadmapNameLocked,
                    ]}
                  >
                    {lvl.title}
                  </Text>
                  <Text style={styles.roadmapXp}>{lvl.minXp} XP</Text>
                </View>
                <View style={styles.roadmapRight}>
                  <Text style={styles.roadmapCheck}>
                    {isUnlocked ? '\u2705' : '\uD83D\uDD12'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={styles.editBtn} onPress={onEditProfile}>
          <Text style={styles.editBtnText}>Editar perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Cerrar sesion</Text>
        </TouchableOpacity>

        <Text style={styles.versionFooter}>Appreton v{CURRENT_VERSION}</Text>
      </ScrollView>

      {/* Modal para cambiar avatar */}
      <Modal visible={avatarModalVisible} animationType="slide" transparent onRequestClose={() => setAvatarModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cambiar avatar</Text>

            <View style={styles.modalPhotoRow}>
              <TouchableOpacity style={styles.modalPhotoBtn} onPress={pickAvatarFromCamera}>
                <Text style={styles.modalPhotoIcon}>{'\uD83D\uDCF8'}</Text>
                <Text style={styles.modalPhotoBtnText}>Camara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPhotoBtn} onPress={pickAvatarFromGallery}>
                <Text style={styles.modalPhotoIcon}>{'\uD83D\uDDBC\uFE0F'}</Text>
                <Text style={styles.modalPhotoBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>O elige un avatar de caca</Text>
            <FlatList
              data={getAllPoopAvatars()}
              keyExtractor={(item) => item.key}
              numColumns={3}
              style={styles.avatarGrid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.avatarOption, user.avatarType === item.key && styles.avatarOptionSelected]}
                  onPress={() => selectPoopAvatar(item.key)}
                >
                  <PoopAvatar type={item.key} size={56} />
                  <Text style={styles.avatarLabel}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity style={styles.modalCancel} onPress={() => setAvatarModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  container: {
    paddingBottom: 40,
  },
  headerSection: {
    backgroundColor: '#8B6914',
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 24,
  },
  avatarWrapper: { position: 'relative' },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  editAvatarIcon: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginBottom: 16 },
  modalSubtitle: { fontSize: 14, fontWeight: '600', color: '#666', marginTop: 16, marginBottom: 10 },
  modalPhotoRow: { flexDirection: 'row', gap: 12 },
  modalPhotoBtn: {
    flex: 1,
    backgroundColor: '#FFF9E6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B6914',
    borderStyle: 'dashed',
  },
  modalPhotoIcon: { fontSize: 28 },
  modalPhotoBtnText: { fontSize: 13, color: '#8B6914', fontWeight: '600', marginTop: 6 },
  avatarGrid: { maxHeight: 280 },
  avatarOption: {
    flex: 1,
    margin: 6,
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#F5F0E1',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: { borderColor: '#8B6914', backgroundColor: '#FFF9E6' },
  avatarLabel: { fontSize: 10, color: '#666', marginTop: 4, fontWeight: '600' },
  modalCancel: { marginTop: 16, alignItems: 'center', padding: 14 },
  modalCancelText: { fontSize: 16, color: '#E74C3C', fontWeight: '600' },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  providerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  providerText: {
    color: '#FFF',
    fontSize: 12,
  },
  levelBadgeSection: {
    alignItems: 'center',
    marginTop: -20,
  },
  levelBadge: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#8B6914',
  },
  levelBadgeEmoji: {
    fontSize: 30,
  },
  levelBadgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B6914',
    marginTop: 4,
  },
  levelBadgeLevel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  xpSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  xpLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  xpValue: {
    fontSize: 14,
    color: '#8B6914',
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#EEE',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 12,
    backgroundColor: '#8B6914',
    borderRadius: 6,
  },
  xpNext: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  memberSince: {
    alignItems: 'center',
    marginTop: 16,
  },
  memberSinceText: {
    fontSize: 13,
    color: '#999',
  },
  roadmapSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  roadmapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  roadmapItemCurrent: {
    borderWidth: 2,
    borderColor: '#8B6914',
    backgroundColor: '#FFF9E6',
  },
  roadmapItemLocked: {
    opacity: 0.5,
  },
  roadmapLeft: {
    width: 44,
    alignItems: 'center',
  },
  roadmapLevel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8B6914',
  },
  roadmapCenter: {
    flex: 1,
    marginLeft: 8,
  },
  roadmapName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  roadmapNameCurrent: {
    color: '#8B6914',
  },
  roadmapNameLocked: {
    color: '#999',
  },
  roadmapXp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  roadmapRight: {
    marginLeft: 8,
  },
  roadmapCheck: {
    fontSize: 18,
  },
  gameBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#2C3E50',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    flexDirection: 'row',
    gap: 12,
  },
  gameBtnIcon: { fontSize: 32 },
  gameBtnText: { fontSize: 17, fontWeight: 'bold', color: '#FFF', flex: 1 },
  gameBtnSub: { fontSize: 12, color: '#AAA' },
  editBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#8B6914',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
  },
  editBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E74C3C',
  },
  logoutBtnText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionSection: {
    marginHorizontal: 20,
    marginTop: 28,
  },
  versionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  versionCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  versionBadge: {
    backgroundColor: '#8B6914',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  versionBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  versionDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  changeItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
    lineHeight: 18,
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: '#BBB',
    marginTop: 16,
    marginBottom: 32,
  },
});
