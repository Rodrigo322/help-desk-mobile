import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo, useState } from "react";

import { MobileBottomNav } from "../../components/layout/mobile-bottom-nav";
import {
  useMarkAllMyNotificationsAsRead,
  useMarkNotificationAsRead,
  useMyNotifications
} from "../../hooks/use-notifications";
import { useAuth } from "../../hooks/use-auth";
import { getApiErrorMessage } from "../../services/api";
import { Notification } from "../../types/notification";

function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(parsed);
}

function mapEventTypeLabel(eventType: Notification["eventType"]) {
  switch (eventType) {
    case "CREATED":
      return "Criacao";
    case "ASSIGNED":
      return "Atribuicao";
    case "UPDATED":
      return "Atualizacao";
    default:
      return eventType;
  }
}

type NotificationRowProps = {
  notification: Notification;
  isMarkingAsRead: boolean;
  onMarkAsRead: (notificationId: string) => void;
  onOpenTicket: (ticketId: string, notificationId: string, readAt: string | null) => void;
};

function NotificationRow({
  notification,
  isMarkingAsRead,
  onMarkAsRead,
  onOpenTicket
}: NotificationRowProps) {
  return (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationEvent}>{mapEventTypeLabel(notification.eventType)}</Text>
        {notification.readAt ? (
          <Text style={styles.readLabel}>Lida</Text>
        ) : (
          <Text style={styles.unreadLabel}>Nao lida</Text>
        )}
      </View>

      <Text style={styles.notificationMessage}>{notification.message}</Text>
      <Text style={styles.notificationDate}>{formatDate(notification.createdAt)}</Text>

      <View style={styles.notificationActions}>
        {!notification.readAt ? (
          <Pressable
            style={styles.markReadButton}
            disabled={isMarkingAsRead}
            onPress={() => onMarkAsRead(notification.id)}
          >
            {isMarkingAsRead ? (
              <ActivityIndicator size="small" color="#0b3f77" />
            ) : (
              <Text style={styles.markReadButtonText}>Marcar como lida</Text>
            )}
          </Pressable>
        ) : null}

        {notification.ticketId ? (
          <Pressable
            style={styles.openTicketButton}
            onPress={() =>
              onOpenTicket(notification.ticketId!, notification.id, notification.readAt)
            }
          >
            <Text style={styles.openTicketButtonText}>Abrir chamado</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isManagerArea = user?.role === "MANAGER" || user?.role === "ADMIN";

  const notificationsQuery = useMyNotifications(isManagerArea);
  const markNotificationAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllMyNotificationsAsRead();

  const [actionError, setActionError] = useState<string | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications]
  );

  async function handleMarkAsRead(notificationId: string) {
    try {
      setActionError(null);
      setLastActionMessage(null);

      await markNotificationAsReadMutation.mutateAsync(notificationId);
      setLastActionMessage("Notificacao marcada como lida.");
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleMarkAllAsRead() {
    try {
      setActionError(null);
      setLastActionMessage(null);

      const result = await markAllAsReadMutation.mutateAsync();
      setLastActionMessage(`${result.updatedCount} notificacao(oes) marcada(s) como lida(s).`);
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleOpenTicket(ticketId: string, notificationId: string, readAt: string | null) {
    if (!readAt) {
      try {
        await markNotificationAsReadMutation.mutateAsync(notificationId);
      } catch {
        // Segue para o ticket mesmo se a leitura falhar.
      }
    }

    router.push(`/tickets/${ticketId}`);
  }

  if (!isManagerArea) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Notificacoes</Text>
          <Text style={styles.helperText}>
            Area disponivel apenas para gestores e administradores.
          </Text>
        </View>
        <MobileBottomNav />
      </SafeAreaView>
    );
  }

  if (notificationsQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0b3f77" />
          <Text style={styles.helperText}>Carregando notificacoes...</Text>
        </View>
        <MobileBottomNav />
      </SafeAreaView>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Erro ao carregar notificacoes</Text>
          <Text style={styles.errorText}>{getApiErrorMessage(notificationsQuery.error)}</Text>
        </View>
        <MobileBottomNav />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Notificacoes</Text>
            <Text style={styles.badge}>{unreadCount} nao lidas</Text>
          </View>

          <Text style={styles.helperText}>
            Notificacoes de novos chamados e atualizacoes do departamento.
          </Text>

          <Pressable
            style={[
              styles.markAllButton,
              (markAllAsReadMutation.isPending || unreadCount === 0) && styles.disabledButton
            ]}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            onPress={() => {
              void handleMarkAllAsRead();
            }}
          >
            {markAllAsReadMutation.isPending ? (
              <ActivityIndicator size="small" color="#0b3f77" />
            ) : (
              <Text style={styles.markAllButtonText}>Marcar todas como lidas</Text>
            )}
          </Pressable>

          {lastActionMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{lastActionMessage}</Text>
            </View>
          ) : null}

          {actionError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          ) : null}

          {!notifications.length ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Nenhuma notificacao</Text>
              <Text style={styles.emptyText}>Sem novos eventos no momento.</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={notificationsQuery.isRefetching}
                  onRefresh={() => {
                    void notificationsQuery.refetch();
                  }}
                />
              }
              renderItem={({ item }) => (
                <NotificationRow
                  notification={item}
                  isMarkingAsRead={
                    markNotificationAsReadMutation.isPending &&
                    markNotificationAsReadMutation.variables === item.id
                  }
                  onMarkAsRead={(notificationId) => {
                    void handleMarkAsRead(notificationId);
                  }}
                  onOpenTicket={(ticketId, notificationId, readAt) => {
                    void handleOpenTicket(ticketId, notificationId, readAt);
                  }}
                />
              )}
            />
          )}
        </View>

        <MobileBottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fb"
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb"
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 10
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f7fb",
    padding: 20,
    gap: 8
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e3a8a"
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: "700"
  },
  helperText: {
    color: "#64748b",
    fontSize: 13
  },
  markAllButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  markAllButtonText: {
    color: "#0b3f77",
    fontWeight: "700",
    fontSize: 12
  },
  disabledButton: {
    opacity: 0.6
  },
  listContent: {
    gap: 10,
    paddingVertical: 8,
    paddingBottom: 8
  },
  notificationCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 8
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  notificationEvent: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#334155",
    fontWeight: "700"
  },
  unreadLabel: {
    color: "#b45309",
    backgroundColor: "#fef3c7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700"
  },
  readLabel: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700"
  },
  notificationMessage: {
    color: "#0f172a",
    fontSize: 14
  },
  notificationDate: {
    color: "#64748b",
    fontSize: 12
  },
  notificationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  markReadButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  markReadButtonText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 12
  },
  openTicketButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  openTicketButtonText: {
    color: "#0b3f77",
    fontWeight: "700",
    fontSize: 12
  },
  emptyBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 4
  },
  emptyTitle: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 14
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13
  },
  successBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
    padding: 10
  },
  successText: {
    color: "#166534",
    fontSize: 13
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 10
  },
  errorTitle: {
    color: "#991b1b",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center"
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13
  }
});
