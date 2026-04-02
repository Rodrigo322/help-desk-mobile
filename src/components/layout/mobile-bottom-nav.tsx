import { Bell, Home, Ticket, UserRound } from "lucide-react-native";
import { usePathname, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <Pressable style={styles.navItem} onPress={() => router.replace("/")}>
        <Home size={20} color={isActivePath(pathname, "/") ? "#0B3F77" : "#94a3b8"} />
        <Text
          style={[
            styles.navLabel,
            isActivePath(pathname, "/") && styles.navLabelActive
          ]}
        >
          Inicio
        </Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => router.replace("/tickets")}>
        <Ticket size={20} color={isActivePath(pathname, "/tickets") ? "#0B3F77" : "#94a3b8"} />
        <Text
          style={[
            styles.navLabel,
            isActivePath(pathname, "/tickets") && styles.navLabelActive
          ]}
        >
          Chamados
        </Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => router.replace("/notifications")}>
        <Bell size={20} color={isActivePath(pathname, "/notifications") ? "#0B3F77" : "#94a3b8"} />
        <Text
          style={[
            styles.navLabel,
            isActivePath(pathname, "/notifications") && styles.navLabelActive
          ]}
        >
          Alertas
        </Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => router.replace("/")}>
        <UserRound size={20} color="#94a3b8" />
        <Text style={styles.navLabel}>Perfil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    minWidth: 64
  },
  navLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600"
  },
  navLabelActive: {
    color: "#0B3F77",
    fontWeight: "700"
  }
});
