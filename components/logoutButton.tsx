import { authService } from "@/storage/authservices";
import { Platform, StyleSheet, Pressable, Text, View, useColorScheme } from "react-native";
import { useAuthStore } from "@/storage/useAuthStorage";
import FontAwesome from '@expo/vector-icons/FontAwesome';


// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}


export default function LogoutButton() {
  const setIsLogged = useAuthStore((state) => state.setIsLogged);
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={async () => {
          await authService.logout();
          setIsLogged(false);
        }}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <TabBarIcon
          name="sign-out"
          color={colorScheme === 'dark' ? '#FFF' : '#000'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  userName: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  pressed: {
    opacity: 0.75,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});