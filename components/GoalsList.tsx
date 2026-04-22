import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Habilita LayoutAnimation en Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Goal {
  id: string;
  objetivo: string;
  montoMeta: number;
}

interface GoalsListProps {
  goals?: Goal[];
  fmt: (value: number) => string;
  onCreateGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goal: Goal) => void;
}

// ─── GoalRow ─────────────────────────────────────────────────────────────────
interface GoalRowProps {
  goal: Goal;
  fmt: (value: number) => string;
  colors:{
    bg: string,
    card: string,
    cardBorder: string,
    primary: string,
    label:string,
    border:string,
    text: string,
  };
  onEdit: () => void;
  onDelete: () => void;
  isLast: boolean;
}

const GoalRow: React.FC<GoalRowProps> = ({ goal, colors, fmt, onEdit, onDelete, isLast }) => {
  return (
    <View
      style={[
        rowStyles.container,
        !isLast && { borderBottomWidth: 0.5, borderColor: colors.border },
      ]}
    >
      {/* Info */}
      <View style={rowStyles.info}>
        <Text style={[rowStyles.objetivo, { color: colors.text }]} numberOfLines={1}>
          {goal.objetivo}
        </Text>
        <Text style={[rowStyles.monto, { color: colors.label }]}>
          Meta: {fmt(goal.montoMeta)}
        </Text>
      </View>

      {/* Acciones */}
      <View style={rowStyles.actions}>
        {/* Editar */}
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            rowStyles.actionBtn,
            { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' },
            pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
          ]}
          hitSlop={6}
        >
          <FontAwesome name="pencil" size={13} color={colors.primary} />
        </Pressable>

        {/* Eliminar */}
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            rowStyles.actionBtn,
            {
              backgroundColor: (colors.danger ?? '#EF4444') + '18',
              borderColor: (colors.danger ?? '#EF4444') + '40',
            },
            pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
          ]}
          hitSlop={6}
        >
          <FontAwesome name="trash" size={13} color={colors.danger ?? '#EF4444'} />
        </Pressable>
      </View>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  info: {
    flex: 1,
    marginRight: 10,
  },
  objetivo: {
    fontSize: 15,
    fontWeight: '600',
  },
  monto: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── GoalsList ────────────────────────────────────────────────────────────────
const GoalsList: React.FC<GoalsListProps> = ({
  goals,
  fmt,
  onCreateGoal,
  onEditGoal,
  onDeleteGoal,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasGoals = goals && goals.length > 0;
  
  const isDark = useColorScheme() === 'dark';

  const colors = {
    bg: isDark ? '#121212' : '#F5F7FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    cardBorder: isDark ? '#2C2C2E' : '#F0F0F0',
    primary: isDark ? '#FFFFFF' : '#1A1A1A',
    label: isDark ? '#8E8E93' : '#8E8E93',
    border: isDark ? '#2C2C2E' : '#EFEFEF',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
  };
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  return (
    <View style={[listStyles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      
      {/* ── Header (siempre visible) ── */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          listStyles.header,
          { borderBottomWidth: expanded ? 0.5 : 0, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={listStyles.headerLeft}>
          <FontAwesome name="flag-o" size={14} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[listStyles.headerTitle, { color: colors.text }]}>Mis Goals</Text>
          {hasGoals && (
            <View style={[listStyles.badge, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[listStyles.badgeText, { color: colors.primary }]}>{goals!.length}</Text>
            </View>
          )}
        </View>
        <FontAwesome
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={colors.label}
        />
      </Pressable>

      {/* ── Contenido colapsable ── */}
      {expanded && (
        <View>
          {hasGoals ? (
            goals!.map((goal, index) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                colors={colors}
                fmt={fmt}
                onEdit={() => onEditGoal(goal)}
                onDelete={() => onDeleteGoal(goal)}
                isLast={index === goals!.length - 1}
              />
            ))
          ) : (
            <Text style={[listStyles.emptyText, { color: colors.label }]}>
              Próximamente podrás crear metas de ahorro y ver tu progreso aquí.
            </Text>
          )}

          {/* ── Botón crear ── */}
          <Pressable
            onPress={onCreateGoal}
            style={({ pressed }) => [
              listStyles.createBtn,
              { borderTopWidth: 0.5, borderColor: colors.border },
              pressed && { opacity: 0.6 },
            ]}
          >
            <FontAwesome name="plus-circle" size={14} color={colors.primary} />
            <Text style={[listStyles.createBtnText, { color: colors.primary }]}>
              {hasGoals ? 'Nueva meta' : 'Crear tu primera meta'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const listStyles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    padding: 14,
    fontSize: 14,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GoalsList;
