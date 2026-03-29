import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentUser, getLevelInfo, getAllLevels, logout } from '../data/auth';
import PoopAvatar from '../components/PoopAvatar';

export default function ProfileScreen({ onLogout, onEditProfile }) {
  const [user, setUser] = useState(null);
  const [levelInfo, setLevelInfo] = useState(null);

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
          <PoopAvatar
            type={user.avatarType}
            customUri={user.customAvatarUri}
            size={110}
          />
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
      </ScrollView>
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
});
