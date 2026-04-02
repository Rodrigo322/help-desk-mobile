import { Bell, CheckCircle2, Clock3, Menu, Ticket } from "lucide-react-native";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";
import { ReactNode } from "react";

import { MobileBottomNav } from "../../components/layout/mobile-bottom-nav";
import { useAuth } from "../../hooks/use-auth";
import { useMyNotifications } from "../../hooks/use-notifications";
import { useTickets } from "../../hooks/use-tickets";

type StatCardProps = {
  title: string;
  value: string | number;
  variation: string;
  icon: ReactNode;
  iconBg: string;
  variationColor: string;
  onPress: () => void;
};

function StatCard({
  title,
  value,
  variation,
  icon,
  iconBg,
  variationColor,
  onPress
}: StatCardProps) {
  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={[styles.statVariation, { color: variationColor }]}>{variation}</Text>
    </Pressable>
  );
}

export function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isManagerArea = user?.role === "MANAGER" || user?.role === "ADMIN";

  const notificationsQuery = useMyNotifications(isManagerArea);
  const openTicketsQuery = useTickets({ scope: "department", status: "OPEN", page: 1, pageSize: 1 });
  const inProgressTicketsQuery = useTickets({
    scope: "department",
    status: "IN_PROGRESS",
    page: 1,
    pageSize: 1
  });
  const resolvedTicketsQuery = useTickets({
    scope: "department",
    status: "RESOLVED",
    page: 1,
    pageSize: 1
  });

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  );

  const openCount = openTicketsQuery.data?.meta.total ?? 0;
  const inProgressCount = inProgressTicketsQuery.data?.meta.total ?? 0;
  const resolvedCount = resolvedTicketsQuery.data?.meta.total ?? 0;

  const recentNotifications = notifications.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.menuButton}>
                <Menu size={16} color="#334155" />
              </View>
              <View>
                <Image
                  source={require("../../../assets/brand/new-holland-blue.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <Text style={styles.brandSub}>Gestao de Frota</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Pressable style={styles.iconButton} onPress={() => router.push("/notifications")}>
                <Bell size={18} color="#0f172a" />
              </Pressable>
              <Pressable style={styles.avatarButton} onPress={() => void signOut()}>
                <Text style={styles.avatarText}>{(user?.name ?? "JT").slice(0, 2).toUpperCase()}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.pageTitle}>Dashboard Geral</Text>
            <Text style={styles.pageSubtitle}>Visao geral da operacao de hoje.</Text>
          </View>

          <View style={styles.statsWrap}>
            <StatCard
              title="Chamados abertos"
              value={openCount}
              variation={openCount > 0 ? `+${openCount}` : "+0"}
              icon={<Ticket size={18} color="#0B3F77" />}
              iconBg="#dbeafe"
              variationColor="#16a34a"
              onPress={() => router.push("/tickets")}
            />
            <StatCard
              title="Em andamento"
              value={inProgressCount}
              variation={inProgressCount > 0 ? `+${inProgressCount}` : "+0"}
              icon={<Clock3 size={18} color="#0B3F77" />}
              iconBg="#fef3c7"
              variationColor="#f97316"
              onPress={() => router.push("/tickets")}
            />
            <StatCard
              title="Resolvidos"
              value={resolvedCount}
              variation={resolvedCount > 0 ? `+${resolvedCount}` : "+0"}
              icon={<CheckCircle2 size={18} color="#0B3F77" />}
              iconBg="#dcfce7"
              variationColor="#16a34a"
              onPress={() => router.push("/tickets")}
            />
            <StatCard
              title="Notificacoes"
              value={unreadCount}
              variation={unreadCount > 0 ? `+${unreadCount}` : "+0"}
              icon={<Bell size={18} color="#0B3F77" />}
              iconBg="#ffe4e6"
              variationColor="#dc2626"
              onPress={() => router.push("/notifications")}
            />
          </View>

          <Text style={styles.sectionTitle}>Analise de Performance</Text>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Distribuicao por Categoria</Text>
            <View style={styles.distributionRow}>
              <View style={styles.donut}>
                <Text style={styles.donutValue}>{openCount + inProgressCount + resolvedCount}</Text>
                <Text style={styles.donutLabel}>TOTAL</Text>
              </View>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#0B3F77" }]} />
                  <Text style={styles.legendText}>Corretiva</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#FACC15" }]} />
                  <Text style={styles.legendText}>Preventiva</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Atividades Recentes</Text>
          <View style={styles.panel}>
            {recentNotifications.length === 0 ? (
              <Text style={styles.emptyText}>Sem atividades recentes.</Text>
            ) : (
              recentNotifications.map((notification) => (
                <View key={notification.id} style={styles.activityItem}>
                  <View
                    style={[
                      styles.activityDot,
                      { backgroundColor: notification.readAt ? "#94a3b8" : "#FACC15" }
                    ]}
                  />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.activityMeta}>
                      {new Date(notification.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <MobileBottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6"
  },
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6"
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 18,
    gap: 14
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  menuButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B3F77"
  },
  brandLogo: {
    width: 144,
    height: 24
  },
  brandSub: {
    fontSize: 11,
    color: "#94a3b8"
  },
  headerRight: {
    flexDirection: "row",
    gap: 8
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0B3F77",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700"
  },
  titleBlock: {
    gap: 4
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1e3a8a"
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748b"
  },
  statsWrap: {
    gap: 10
  },
  statCard: {
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  statContent: {
    flex: 1
  },
  statTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700"
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 2
  },
  statVariation: {
    fontSize: 12,
    fontWeight: "700"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e3a8a"
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 12
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e3a8a"
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  donut: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 8,
    borderColor: "#0B3F77",
    alignItems: "center",
    justifyContent: "center"
  },
  donutValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e3a8a"
  },
  donutLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700"
  },
  legend: {
    gap: 8
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600"
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4
  },
  activityContent: {
    flex: 1,
    gap: 2
  },
  activityText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600"
  },
  activityMeta: {
    fontSize: 12,
    color: "#94a3b8"
  },
  emptyText: {
    fontSize: 13,
    color: "#94a3b8"
  }
});
