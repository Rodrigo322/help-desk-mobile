import { Menu, Plus, Search, UserRound } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileBottomNav } from "../../components/layout/mobile-bottom-nav";
import { useTickets } from "../../hooks/use-tickets";
import { getApiErrorMessage } from "../../services/api";
import { Ticket, TicketListingScope, TicketPriority, TicketStatus } from "../../types/ticket";

const SCOPES: Array<{ label: string; value: TicketListingScope }> = [
  { label: "Tecnico", value: "department" },
  { label: "Criados por mim", value: "created" },
  { label: "Atribuidos a mim", value: "assigned" }
];

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todos os chamados", value: "ALL" },
  { label: "Novo", value: "NEW" },
  { label: "Aberto", value: "OPEN" },
  { label: "Em andamento", value: "IN_PROGRESS" },
  { label: "Pendente", value: "PENDING" },
  { label: "Em espera", value: "ON_HOLD" },
  { label: "Resolvido", value: "RESOLVED" },
  { label: "Fechado", value: "CLOSED" }
];

const PRIORITY_FILTERS: Array<{ label: string; value: string }> = [
  { label: "Todas prioridades", value: "ALL" },
  { label: "Baixa", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" }
];

function mapStatusLabel(status: TicketStatus) {
  switch (status) {
    case "NEW":
      return "ABERTO";
    case "OPEN":
      return "ABERTO";
    case "IN_PROGRESS":
      return "EM ANDAMENTO";
    case "PENDING":
      return "PENDENTE";
    case "ON_HOLD":
      return "EM ESPERA";
    case "RESOLVED":
      return "RESOLVIDO";
    case "CLOSED":
      return "FECHADO";
    default:
      return status;
  }
}

function mapPriorityLabel(priority: TicketPriority) {
  switch (priority) {
    case "LOW":
      return "BAIXA";
    case "MEDIUM":
      return "MEDIA";
    case "HIGH":
      return "ALTA";
    default:
      return priority;
  }
}

function badgeColorForStatus(status: TicketStatus) {
  if (status === "RESOLVED" || status === "CLOSED") {
    return { backgroundColor: "#dcfce7", color: "#15803d" };
  }

  if (status === "IN_PROGRESS") {
    return { backgroundColor: "#ffedd5", color: "#ea580c" };
  }

  return { backgroundColor: "#dbeafe", color: "#2563eb" };
}

function badgeColorForPriority(priority: TicketPriority) {
  if (priority === "HIGH") {
    return { backgroundColor: "#fee2e2", color: "#dc2626" };
  }

  if (priority === "MEDIUM") {
    return { backgroundColor: "#fef9c3", color: "#a16207" };
  }

  return { backgroundColor: "#e2e8f0", color: "#334155" };
}

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

type TicketRowProps = {
  ticket: Ticket;
  onPress: (ticketId: string) => void;
};

function TicketRow({ ticket, onPress }: TicketRowProps) {
  const statusColors = badgeColorForStatus(ticket.status);
  const priorityColors = badgeColorForPriority(ticket.priority);

  return (
    <Pressable style={styles.ticketCard} onPress={() => onPress(ticket.id)}>
      <View style={styles.ticketTopRow}>
        <Text style={styles.ticketId}>#{ticket.id.slice(0, 4)}</Text>
        <View style={styles.badgesRow}>
          <Text style={[styles.badge, statusColors]}>{mapStatusLabel(ticket.status)}</Text>
          <Text style={[styles.badge, priorityColors]}>{mapPriorityLabel(ticket.priority)}</Text>
        </View>
      </View>

      <Text style={styles.ticketTitle} numberOfLines={2}>
        {ticket.title}
      </Text>
      <Text style={styles.ticketDescription} numberOfLines={1}>
        {ticket.description}
      </Text>

      <View style={styles.ticketFooter}>
        <View style={styles.userWrap}>
          <UserRound size={18} color="#f97316" />
          <Text style={styles.userText}>{ticket.createdByUserName ?? "Solicitante"}</Text>
        </View>
        <Text style={styles.ticketDate}>{formatDate(ticket.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export function TicketsScreen() {
  const router = useRouter();
  const [scope, setScope] = useState<TicketListingScope>("department");
  const [statusValue, setStatusValue] = useState("ALL");
  const [priorityValue, setPriorityValue] = useState("ALL");

  const status = statusValue === "ALL" ? undefined : (statusValue as TicketStatus);
  const priority = priorityValue === "ALL" ? undefined : (priorityValue as TicketPriority);

  const ticketsQuery = useTickets({
    scope,
    status,
    priority,
    page: 1,
    pageSize: 20
  });

  const errorMessage = useMemo(() => {
    if (!ticketsQuery.error) {
      return null;
    }

    return getApiErrorMessage(ticketsQuery.error);
  }, [ticketsQuery.error]);

  const tickets = ticketsQuery.data?.items ?? [];

  if (ticketsQuery.isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0b3f77" />
        <Text style={styles.loaderText}>Carregando chamados...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon}>
            <Menu size={18} color="#f97316" />
          </Pressable>
          <Image
            source={require("../../../assets/brand/new-holland-blue.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Pressable style={styles.headerIcon}>
            <Search size={18} color="#0f172a" />
          </Pressable>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterButton}>
            <Picker
              selectedValue={statusValue}
              onValueChange={(value) => setStatusValue(String(value))}
              style={styles.filterPicker}
              dropdownIconColor="#334155"
            >
              {STATUS_FILTERS.map((filter) => (
                <Picker.Item key={filter.value} label={filter.label} value={filter.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterButton}>
            <Picker
              selectedValue={priorityValue}
              onValueChange={(value) => setPriorityValue(String(value))}
              style={styles.filterPicker}
              dropdownIconColor="#334155"
            >
              {PRIORITY_FILTERS.map((filter) => (
                <Picker.Item key={filter.value} label={filter.label} value={filter.value} />
              ))}
            </Picker>
          </View>

          <View style={styles.filterButton}>
            <Picker
              selectedValue={scope}
              onValueChange={(value) => setScope(value as TicketListingScope)}
              style={styles.filterPicker}
              dropdownIconColor="#334155"
            >
              {SCOPES.map((filter) => (
                <Picker.Item key={filter.value} label={filter.label} value={filter.value} />
              ))}
            </Picker>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Erro ao carregar chamados</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={ticketsQuery.isRefetching}
              onRefresh={() => {
                void ticketsQuery.refetch();
              }}
            />
          }
          ListEmptyComponent={
            !errorMessage ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Nenhum chamado encontrado</Text>
                <Text style={styles.emptyText}>Ajuste os filtros para continuar.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TicketRow
              ticket={item}
              onPress={(ticketId) => {
                router.push(`/tickets/${ticketId}`);
              }}
            />
          )}
        />

        <Pressable style={styles.floatingButton} onPress={() => router.push("/tickets/create")}>
          <Plus size={30} color="#0f172a" />
        </Pressable>

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
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f7fb",
    gap: 8
  },
  loaderText: {
    color: "#475569",
    fontSize: 14
  },
  header: {
    height: 56,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14
  },
  headerIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a"
  },
  headerLogo: {
    width: 190,
    height: 34
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12
  },
  filterButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
    height: 52,
    justifyContent: "center"
  },
  filterPicker: {
    color: "#334155",
    fontSize: 12,
    marginLeft: -6
  },
  listContent: {
    padding: 12,
    gap: 10,
    paddingBottom: 100
  },
  ticketCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 8
  },
  ticketTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  ticketId: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700"
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: "800"
  },
  ticketTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e293b"
  },
  ticketDescription: {
    color: "#64748b",
    fontSize: 14
  },
  ticketFooter: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  userWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  userText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700"
  },
  ticketDate: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600"
  },
  errorBox: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 12,
    gap: 4
  },
  errorTitle: {
    color: "#991b1b",
    fontWeight: "700",
    fontSize: 13
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13
  },
  emptyBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    padding: 12,
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
  floatingButton: {
    position: "absolute",
    right: 16,
    bottom: 76,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FACC15",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  }
});
