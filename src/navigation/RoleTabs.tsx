import React, { type ComponentType } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Papel } from '@/types/api';
import { DashboardScreen } from '@/screens/aluno/DashboardScreen';
import { BoletimScreen } from '@/screens/aluno/BoletimScreen';
import { RankingScreen } from '@/screens/aluno/RankingScreen';
import { MeuPerfilScreen } from '@/screens/aluno/MeuPerfilScreen';
import { VagasScreen } from '@/screens/aluno/VagasScreen';
import { ProfDashboardScreen } from '@/screens/professor/DashboardScreen';
import { ProfTurmasScreen } from '@/screens/professor/TurmasScreen';
import { ProfPerfilScreen } from '@/screens/professor/PerfilScreen';
import { TalentosScreen } from '@/screens/empresa/TalentosScreen';
import { FavoritosScreen } from '@/screens/empresa/FavoritosScreen';

const TalentosReadonly = () => <TalentosScreen readonly />;
import { EmpVagasScreen } from '@/screens/empresa/VagasScreen';
import { ContratacoesScreen } from '@/screens/empresa/ContratacoesScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { SinoHeader } from '@/components/SinoHeader';
import { colors } from '@/theme/tokens';

const Tab = createBottomTabNavigator();

type TabDef = {
  name: string;
  titulo: string;
  icon: keyof typeof Ionicons.glyphMap;
  component: ComponentType<any>;
};

const TABS: Record<Papel, TabDef[]> = {
  aluno: [
    { name: 'AlunoDashboard', titulo: 'Início', icon: 'home', component: DashboardScreen },
    { name: 'AlunoBoletim', titulo: 'Boletim', icon: 'document-text', component: BoletimScreen },
    { name: 'AlunoRanking', titulo: 'Ranking', icon: 'trophy', component: RankingScreen },
    { name: 'AlunoVagas', titulo: 'Vagas', icon: 'briefcase', component: VagasScreen },
    { name: 'AlunoMensagens', titulo: 'Chat', icon: 'chatbubbles', component: ChatScreen },
    { name: 'AlunoPerfil', titulo: 'Perfil', icon: 'person', component: MeuPerfilScreen },
  ],
  professor: [
    { name: 'ProfDashboard', titulo: 'Início', icon: 'home', component: ProfDashboardScreen },
    { name: 'ProfTurmas', titulo: 'Turmas', icon: 'people', component: ProfTurmasScreen },
    { name: 'ProfTalentos', titulo: 'Talentos', icon: 'search', component: TalentosReadonly },
    { name: 'ProfMensagens', titulo: 'Chat', icon: 'chatbubbles', component: ChatScreen },
    { name: 'ProfPerfil', titulo: 'Perfil', icon: 'person', component: ProfPerfilScreen },
  ],
  empresa: [
    { name: 'EmpTalentos', titulo: 'Talentos', icon: 'search', component: TalentosScreen },
    { name: 'EmpFavoritos', titulo: 'Favoritos', icon: 'star', component: FavoritosScreen },
    { name: 'EmpVagas', titulo: 'Vagas', icon: 'briefcase', component: EmpVagasScreen },
    { name: 'EmpContratacoes', titulo: 'Contratações', icon: 'ribbon', component: ContratacoesScreen },
    { name: 'EmpMensagens', titulo: 'Chat', icon: 'chatbubbles', component: ChatScreen },
  ],
};

export function RoleTabs({ papel }: { papel: Papel }) {
  const tabs = TABS[papel];
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTitleStyle: { color: '#fff', fontSize: 17, fontWeight: '700' },
        headerTintColor: '#fff',
        headerRight: () => <SinoHeader />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const def = tabs.find((t) => t.name === route.name);
          return <Ionicons name={def?.icon ?? 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      {tabs.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} options={{ title: t.titulo }} />
      ))}
    </Tab.Navigator>
  );
}
