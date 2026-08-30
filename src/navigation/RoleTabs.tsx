import React, { type ComponentType } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Papel } from '@/types/api';
import { makePlaceholder } from '@/screens/common/PlaceholderScreen';
import { DashboardScreen } from '@/screens/aluno/DashboardScreen';
import { BoletimScreen } from '@/screens/aluno/BoletimScreen';
import { RankingScreen } from '@/screens/aluno/RankingScreen';
import { ProfDashboardScreen } from '@/screens/professor/DashboardScreen';
import { ProfTurmasScreen } from '@/screens/professor/TurmasScreen';
import { TalentosScreen } from '@/screens/empresa/TalentosScreen';
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
    { name: 'AlunoVagas', titulo: 'Vagas', icon: 'briefcase', component: makePlaceholder('Vagas') },
    { name: 'AlunoPerfil', titulo: 'Perfil', icon: 'person', component: makePlaceholder('Meu Perfil') },
  ],
  professor: [
    { name: 'ProfDashboard', titulo: 'Início', icon: 'home', component: ProfDashboardScreen },
    { name: 'ProfTurmas', titulo: 'Turmas', icon: 'people', component: ProfTurmasScreen },
    { name: 'ProfPerfil', titulo: 'Perfil', icon: 'person', component: makePlaceholder('Perfil') },
  ],
  empresa: [
    { name: 'EmpTalentos', titulo: 'Talentos', icon: 'search', component: TalentosScreen },
    { name: 'EmpFavoritos', titulo: 'Favoritos', icon: 'star', component: makePlaceholder('Favoritos') },
    { name: 'EmpVagas', titulo: 'Vagas', icon: 'briefcase', component: makePlaceholder('Minhas Vagas') },
    { name: 'EmpMensagens', titulo: 'Mensagens', icon: 'chatbubbles', component: makePlaceholder('Mensagens') },
  ],
};

export function RoleTabs({ papel }: { papel: Papel }) {
  const tabs = TABS[papel];
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
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
