import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSession } from '@/auth/session';
import { SplashScreen } from '@/screens/SplashScreen';
import { DemoSelectScreen } from '@/screens/DemoSelectScreen';
import { LoginEmailScreen } from '@/screens/LoginEmailScreen';
import { OtpScreen } from '@/screens/OtpScreen';
import { TermsScreen } from '@/screens/TermsScreen';
import { EditarLancamentoScreen } from '@/screens/professor/EditarLancamentoScreen';
import { ConversaScreen } from '@/screens/ConversaScreen';
import { NovaConversaScreen } from '@/screens/NovaConversaScreen';
import { NotificacoesScreen } from '@/screens/NotificacoesScreen';
import { RelatoriosScreen } from '@/screens/aluno/RelatoriosScreen';
import { PerfilAtsScreen } from '@/screens/aluno/PerfilAtsScreen';
import { RelatorioPreviewScreen } from '@/screens/RelatorioPreviewScreen';
import { TalentosScreen } from '@/screens/empresa/TalentosScreen';
import { RoleTabs } from '@/navigation/RoleTabs';

const TalentosReadonly = () => <TalentosScreen readonly />;
import type { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { sessao } = useSession();
  // sessao nunca é null aqui (só monta com sessão), mas o TS não sabe
  return <RoleTabs papel={sessao?.tipo ?? 'aluno'} />;
}

export function RootNavigator() {
  const { sessao, carregando } = useSession();

  if (carregando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {sessao ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="EditarLancamento"
              component={EditarLancamentoScreen}
              options={{ headerShown: true, title: 'Editar lançamento' }}
            />
            <Stack.Screen
              name="Conversa"
              component={ConversaScreen}
              options={({ route }) => ({ headerShown: true, title: route.params.nome })}
            />
            <Stack.Screen
              name="NovaConversa"
              component={NovaConversaScreen}
              options={{ headerShown: true, title: 'Nova conversa' }}
            />
            <Stack.Screen
              name="Notificacoes"
              component={NotificacoesScreen}
              options={{ headerShown: true, title: 'Notificações' }}
            />
            <Stack.Screen
              name="Relatorios"
              component={RelatoriosScreen}
              options={{ headerShown: true, title: 'Relatórios' }}
            />
            <Stack.Screen
              name="PerfilAts"
              component={PerfilAtsScreen}
              options={{ headerShown: true, title: 'Currículo / Perfil profissional' }}
            />
            <Stack.Screen
              name="RelatorioPreview"
              component={RelatorioPreviewScreen}
              options={{ headerShown: true, title: 'Prévia do relatório' }}
            />
            <Stack.Screen
              name="Talentos"
              component={TalentosReadonly}
              options={{ headerShown: true, title: 'Portal de Talentos' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="DemoSelect" component={DemoSelectScreen} />
            <Stack.Screen
              name="LoginEmail"
              component={LoginEmailScreen}
              options={{ headerShown: true, title: 'Entrar', headerBackTitle: 'Voltar' }}
            />
            <Stack.Screen
              name="Otp"
              component={OtpScreen}
              options={{ headerShown: true, title: 'Verificação' }}
            />
          </>
        )}
        {/* Termos: acessível tanto deslogado (tela inicial) quanto logado/demo */}
        <Stack.Screen
          name="Termos"
          component={TermsScreen}
          options={{ headerShown: true, title: 'Termos e privacidade' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
