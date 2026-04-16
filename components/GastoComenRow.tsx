import { GastoComun } from "@/storage/types";
import { Pressable, View as RNView,} from "react-native";
import { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import Card from "./card";
import { Text, View } from "./Themed";

const ICON_MAP: Record<string, string> = {
  Alquiler:          'home',
  Supermercado:      'shopping-cart',
  Servicios:         'bolt',
  Ocio:              'gamepad',
  Gimnasio:          'heartbeat',
  Transporte:        'car',
  Salud:             'medkit',
  Mascota:           'paw',
  'Electrodomésticos': 'plug',
  Otros:             'ellipsis-h',
};

export default function GastoComunRow({ gasto, isDark, onEliminar }: {
  gasto: GastoComun;
  isDark: boolean;
  onEliminar: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable onPress={() => setExpanded(p => !p)}>
      <Card>
        {/* Fila principal */}
        <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Ícono */}
          <RNView style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: isDark ? '#1C3A5E' : '#E8F4FF',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <FontAwesome
              name={(ICON_MAP[gasto.categoria] ?? 'tag') as any}
              size={15}
              color="#007AFF"
            />
          </RNView>

          {/* Texto */}
          <RNView style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ fontSize: 15, fontWeight: '700' }}
              lightColor="#1A1A1A" darkColor="#FFF"
              numberOfLines={1}
            >
              {gasto.descripcion}
            </Text>
            <Text
              style={{ fontSize: 12, marginTop: 2 }}
              lightColor="#888" darkColor="#666"
            >
              {gasto.categoria}
            </Text>
          </RNView>

          {/* Monto */}
          <Text style={{ fontSize: 16, fontWeight: '800', flexShrink: 0 }} lightColor="#1A1A1A" darkColor="#FFF">
            ${Number(gasto.monto).toLocaleString('es-CL')}
          </Text>

          {/* Chevron */}
          <FontAwesome
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={11}
            color={isDark ? '#555' : '#BBB'}
          />
        </RNView>

        {/* Detalle expandido */}
        {expanded && (
          <>
            <RNView style={{ height: 1, backgroundColor: isDark ? '#2C2C2E' : '#F0F0F0', marginVertical: 10 }} />
            <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12 }} lightColor="#888" darkColor="#666">
                Pagado por: {gasto.quienPago ?? 'Compartido'}
              </Text>
              <Pressable
                onPress={onEliminar}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: '#FF3B3015', paddingHorizontal: 12,
                  paddingVertical: 6, borderRadius: 8,
                }}
              >
                <FontAwesome name="trash" size={12} color="#FF3B30" />
                <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: '600' }}>
                  Eliminar
                </Text>
              </Pressable>
            </RNView>
          </>
        )}
      </Card>
    </Pressable>
  );
}