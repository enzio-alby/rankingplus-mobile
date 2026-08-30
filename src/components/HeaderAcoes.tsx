import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useSession } from '@/auth/session';
import { contarNaoLidas } from '@/api/notificacoes';
import { colors } from '@/theme/tokens';

/** headerRight das abas: sino de notificações + menu de conta (Termos / Sair). */
export function HeaderAcoes() {
  const { sessao, sair } = useSession();
  const nav = useNavigation<any>();

  const q = useQuery({
    queryKey: ['nao-lidas', sessao?.tipo, sessao?.id],
    queryFn: () => contarNaoLidas(sessao!.tipo, sessao!.id),
    enabled: !!sessao,
    refetchInterval: 30000,
  });
  const n = q.data ?? 0;

  function menu() {
    Alert.alert(sessao?.nome ?? 'Conta', sessao?.demo ? 'Modo demonstração' : undefined, [
      { text: 'Termos e privacidade', onPress: () => nav.navigate('Termos', { origem: 'app' }) },
      { text: 'Sair', style: 'destructive', onPress: () => void sair() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => nav.navigate('Notificacoes')}
        hitSlop={8}
        style={styles.btn}
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

      <Pressable
        onPress={menu}
        hitSlop={8}
        style={styles.btn}
        accessibilityRole="button"
        accessibilityLabel="Conta e sair"
      >
        <Ionicons name="person-circle-outline" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  btn: { paddingHorizontal: 8, paddingVertical: 6 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 4,
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
