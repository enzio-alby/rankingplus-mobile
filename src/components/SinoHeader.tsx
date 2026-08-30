import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { contarNaoLidas } from '@/api/notificacoes';
import { colors } from '@/theme/tokens';

/** Sino de notificações — vai no `headerRight` das abas. */
export function SinoHeader() {
  const { sessao } = useSession();
  const nav = useNavigation<any>();
  const q = useQuery({
    queryKey: ['nao-lidas', sessao?.tipo, sessao?.id],
    queryFn: () => contarNaoLidas(sessao!.tipo, sessao!.id),
    enabled: !!sessao,
    refetchInterval: 30000,
  });
  const n = q.data ?? 0;

  return (
    <Pressable
      onPress={() => nav.navigate('Notificacoes')}
      hitSlop={10}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={n > 0 ? `Notificações, ${n} não lidas` : 'Notificações'}
    >
      <Ionicons name="notifications-outline" size={22} color="#fff" />
      {n > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{n > 9 ? '9+' : n}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingVertical: 6 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
