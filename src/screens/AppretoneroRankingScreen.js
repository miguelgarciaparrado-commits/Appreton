import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllUsersForRanking, getCurrentUser, getLevelInfo } from '../data/auth';
import PoopAvatar from '../components/PoopAvatar';

function getMedalEmoji(index) {
  if (index === 0) return '\uD83E\uDD47';
  if (index === 1) return '\uD83E\uDD48';
  if (index === 2) return '\uD83E\uDD49';
  return `#${index + 1}`;
}

export default function AppretoneroRankingScreen() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const current = await getCurrentUser();
    if (current) setCurrentUserId(current.id);
    const allUsers = await getAllUsersForRanking();
    setUsers(allUsers);
  }

  const renderItem = ({ item, index }) => {
    const isMe = item.id === currentUserId;
    const info = getLevelInfo(item.xp || 0);

    return (
      <View style={[styles.card, isMe && styles.cardHighlight]}>
        {/* Position */}
        <View style={[styles.rank, index < 3 && styles.rankTop]}>
          <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>
            {getMedalEmoji(index)}
          </Text>
        </View>

        {/* Avatar */}
        <PoopAvatar
          type={item.avatarType}
          customUri={item.customAvatarUri}
          size={48}
        />

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.name, isMe && styles.nameMe]}>
            {item.displayName}
            {isMe ? ' (tu)' : ''}
          </Text>
          <Text style={styles.levelTitle}>{info.title}</Text>
        </View>

        {/* XP / Level */}
        <View style={styles.xpSection}>
          <Text style={styles.xpText}>{item.xp}</Text>
          <Text style={styles.xpLabel}>XP</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{'\uD83D\uDCA9'} Appretoneros</Text>
        <Text style={styles.subtitle}>Ranking de usuarios</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{'\uD83D\uDCA9'}</Text>
            <Text style={styles.emptyText}>Aun no hay Appretoneros</Text>
            <Text style={styles.emptySubtext}>Se el primero en unirte!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  header: {
    backgroundColor: '#8B6914',
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#F5DEB3',
    marginTop: 2,
  },
  list: {
    paddingVertical: 10,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
  },
  cardHighlight: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#8B6914',
  },
  rank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F0E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankTop: {
    backgroundColor: '#FFF9E6',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B6914',
  },
  rankTextTop: {
    fontSize: 20,
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  nameMe: {
    color: '#8B6914',
  },
  levelTitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  xpSection: {
    alignItems: 'center',
    marginLeft: 8,
  },
  xpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B6914',
  },
  xpLabel: {
    fontSize: 11,
    color: '#999',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
