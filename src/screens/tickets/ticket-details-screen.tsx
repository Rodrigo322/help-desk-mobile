import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FileText } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo, useState } from "react";

import { MobileBottomNav } from "../../components/layout/mobile-bottom-nav";
import { useAuth } from "../../hooks/use-auth";
import { useDepartments } from "../../hooks/use-departments";
import { useTicketAttachments, useUploadTicketAttachment } from "../../hooks/use-ticket-attachments";
import { useTicketComments, useCreateTicketComment } from "../../hooks/use-ticket-comments";
import {
  useAssignTicketToSelf,
  useCloseTicket,
  useResolveTicket,
  useTicketDetails,
  useUpdateTicketPriority
} from "../../hooks/use-ticket-details";
import { createCommentSchema, CreateCommentFormData } from "../../schemas/tickets/comment-schema";
import { api, getApiErrorMessage } from "../../services/api";
import { TicketPriority, TicketStatus } from "../../types/ticket";

const PRIORITY_OPTIONS: Array<{ label: string; value: TicketPriority }> = [
  { label: "Baixa", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" }
];

function mapStatusLabel(status: TicketStatus) {
  switch (status) {
    case "NEW":
      return "Novo";
    case "OPEN":
      return "Aberto";
    case "IN_PROGRESS":
      return "Em andamento";
    case "PENDING":
      return "Pendente";
    case "ON_HOLD":
      return "Em espera";
    case "RESOLVED":
      return "Resolvido";
    case "CLOSED":
      return "Fechado";
    default:
      return status;
  }
}

function mapPriorityLabel(priority: TicketPriority) {
  switch (priority) {
    case "LOW":
      return "Baixa";
    case "MEDIUM":
      return "Media";
    case "HIGH":
      return "Alta";
    default:
      return priority;
  }
}

function getStatusBadgeColors(status: TicketStatus) {
  if (status === "CLOSED") {
    return { backgroundColor: "#e2e8f0", color: "#334155" };
  }

  if (status === "RESOLVED") {
    return { backgroundColor: "#dcfce7", color: "#15803d" };
  }

  if (status === "IN_PROGRESS") {
    return { backgroundColor: "#dbeafe", color: "#1d4ed8" };
  }

  return { backgroundColor: "#ffedd5", color: "#c2410c" };
}

function getPriorityBadgeColors(priority: TicketPriority) {
  if (priority === "HIGH") {
    return { backgroundColor: "#fee2e2", color: "#dc2626" };
  }

  if (priority === "MEDIUM") {
    return { backgroundColor: "#fef9c3", color: "#a16207" };
  }

  return { backgroundColor: "#e2e8f0", color: "#334155" };
}

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

function getRouteTicketId(input: string | string[] | undefined): string | undefined {
  if (!input) {
    return undefined;
  }

  return Array.isArray(input) ? input[0] : input;
}

function buildAttachmentUrl(fileUrl: string): string {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  const apiBaseUrl = api.defaults.baseURL ?? "";
  const serverBaseUrl = apiBaseUrl.replace(/\/v1\/?$/, "");
  const normalizedPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;

  return `${serverBaseUrl}${normalizedPath}`;
}

export function TicketDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const ticketId = getRouteTicketId(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const canCreateInternalComment = user?.role === "MANAGER" || user?.role === "ADMIN";

  const ticketDetailsQuery = useTicketDetails(ticketId);
  const departmentsQuery = useDepartments();
  const commentsQuery = useTicketComments(ticketId, {
    includeInternal: canCreateInternalComment
  });
  const attachmentsQuery = useTicketAttachments(ticketId);
  const createCommentMutation = useCreateTicketComment(ticketId);
  const uploadAttachmentMutation = useUploadTicketAttachment(ticketId);
  const assignTicketMutation = useAssignTicketToSelf(ticketId);
  const resolveTicketMutation = useResolveTicket(ticketId);
  const closeTicketMutation = useCloseTicket(ticketId);
  const updatePriorityMutation = useUpdateTicketPriority(ticketId);

  const [screenError, setScreenError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateCommentFormData>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: {
      content: "",
      isInternal: false
    }
  });

  const isInternalComment = watch("isInternal") ?? false;

  const pageError = useMemo(() => {
    if (!ticketDetailsQuery.error) {
      return null;
    }

    return getApiErrorMessage(ticketDetailsQuery.error);
  }, [ticketDetailsQuery.error]);

  async function handleCreateComment(values: CreateCommentFormData) {
    try {
      setScreenError(null);
      setActionMessage(null);

      await createCommentMutation.mutateAsync(values);
      reset({
        content: "",
        isInternal: false
      });
    } catch (error) {
      setScreenError(getApiErrorMessage(error));
    }
  }

  async function handlePickAndUploadAttachment() {
    try {
      setScreenError(null);
      setActionMessage(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      await uploadAttachmentMutation.mutateAsync({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream"
      });

      setActionMessage("Anexo enviado com sucesso.");
    } catch (error) {
      setScreenError(getApiErrorMessage(error));
    }
  }

  async function handleAssignTicketToSelf() {
    try {
      setScreenError(null);
      setActionMessage(null);
      await assignTicketMutation.mutateAsync();
      setActionMessage("Chamado assumido com sucesso.");
    } catch (error) {
      setScreenError(getApiErrorMessage(error));
    }
  }

  async function handleResolveTicket() {
    try {
      setScreenError(null);
      setActionMessage(null);
      await resolveTicketMutation.mutateAsync();
      setActionMessage("Chamado marcado como resolvido.");
    } catch (error) {
      setScreenError(getApiErrorMessage(error));
    }
  }

  async function handleCloseTicket() {
    try {
      setScreenError(null);
      setActionMessage(null);
      await closeTicketMutation.mutateAsync();
      setActionMessage("Chamado concluido com sucesso.");
    } catch (error) {
      setScreenError(getApiErrorMessage(error));
    }
  }

  async function handleUpdatePriority(priority: TicketPriority) {
    try {
      setScreenError(null);
      setActionMessage(null);
      await updatePriorityMutation.mutateAsync(priority);
      setActionMessage(`Prioridade alterada para ${mapPriorityLabel(priority)}.`);
    } catch (error) {
      setScreenError(getApiErrorMessage(error));
    }
  }

  if (ticketDetailsQuery.isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0b3f77" />
        <Text style={styles.loaderText}>Carregando detalhes do chamado...</Text>
      </View>
    );
  }

  if (pageError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Nao foi possivel carregar o chamado</Text>
        <Text style={styles.errorText}>{pageError}</Text>
      </View>
    );
  }

  const ticket = ticketDetailsQuery.data?.ticket;

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Chamado nao encontrado</Text>
      </View>
    );
  }

  const comments = commentsQuery.data?.comments ?? [];
  const attachments = attachmentsQuery.data?.attachments ?? [];

  const departmentsById = new Map(
    (departmentsQuery.data?.departments ?? []).map((department) => [department.id, department.name])
  );

  const originDepartmentName = departmentsById.get(ticket.originDepartmentId) ?? ticket.originDepartmentId;
  const targetDepartmentName = departmentsById.get(ticket.targetDepartmentId) ?? ticket.targetDepartmentId;
  const requesterName = ticket.createdByUserName ?? ticket.createdByUserId;

  const canAssignTicket = Boolean(
    user &&
      !ticket.assignedToUserId &&
      ticket.status !== "RESOLVED" &&
      ticket.status !== "CLOSED" &&
      user.departmentId === ticket.targetDepartmentId
  );

  const canManageTicket = Boolean(
    user &&
      (ticket.assignedToUserId === user.id ||
        (user.role === "MANAGER" && user.departmentId === ticket.targetDepartmentId) ||
        user.role === "ADMIN")
  );

  const canResolveTicket = canManageTicket && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED";
  const canCloseTicket = canManageTicket && ticket.status !== "CLOSED";
  const canUpdatePriority = canManageTicket;

  const assignedName =
    ticket.assignedToUserId === user?.id
      ? "Voce"
      : ticket.assignedToUserId ?? "Nao atribuido";

  const statusBadge = getStatusBadgeColors(ticket.status);
  const priorityBadge = getPriorityBadgeColors(ticket.priority);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.select({ ios: 16, android: 0 })}
      >
        <View style={styles.container}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.select({ ios: "interactive", android: "on-drag" })}
          >
            <View style={styles.headerRow}>
              <Pressable style={styles.headerIconButton} onPress={() => router.back()}>
                <ArrowLeft size={20} color="#123A74" />
              </Pressable>
              <Text style={styles.headerTitle}>Chamado #{ticket.id.slice(0, 8)}</Text>
              <Image
                source={require("../../../assets/brand/new-holland-blue.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.badgesRow}>
              <Text style={[styles.badge, statusBadge]}>{mapStatusLabel(ticket.status)}</Text>
              <Text style={[styles.badge, priorityBadge]}>{mapPriorityLabel(ticket.priority)}</Text>
            </View>

            <View style={styles.problemCard}>
              <Text style={styles.problemLabel}>Problema relatado</Text>
              <Text style={styles.problemTitle}>{ticket.title}</Text>
              <View style={styles.infoDivider} />

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Solicitante</Text>
                  <Text style={styles.infoValue}>{requesterName}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Departamento</Text>
                  <Text style={styles.infoValue}>{targetDepartmentName}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Descricao do problema</Text>
              <View style={styles.sectionCard}>
                <Text style={styles.description}>{ticket.description}</Text>

                <View style={styles.attachmentsHeader}>
                  <Text style={styles.sectionSubheading}>Anexos ({attachments.length})</Text>
                  <Pressable
                    style={[styles.smallButton, uploadAttachmentMutation.isPending && styles.disabledButton]}
                    disabled={uploadAttachmentMutation.isPending}
                    onPress={() => {
                      void handlePickAndUploadAttachment();
                    }}
                  >
                    {uploadAttachmentMutation.isPending ? (
                      <ActivityIndicator size="small" color="#123A74" />
                    ) : (
                      <Text style={styles.smallButtonText}>Adicionar</Text>
                    )}
                  </Pressable>
                </View>

                {attachmentsQuery.isLoading ? (
                  <ActivityIndicator size="small" color="#0b3f77" />
                ) : attachments.length === 0 ? (
                  <Text style={styles.helperText}>Nenhum anexo encontrado.</Text>
                ) : (
                  <View style={styles.attachmentsGrid}>
                    {attachments.map((attachment) => (
                      <Pressable
                        key={attachment.id}
                        style={styles.attachmentCard}
                        onPress={() => {
                          void Linking.openURL(buildAttachmentUrl(attachment.fileUrl));
                        }}
                      >
                        <FileText size={20} color="#123A74" />
                        <Text numberOfLines={2} style={styles.attachmentName}>{attachment.fileName}</Text>
                        <Text style={styles.attachmentMeta}>{attachment.mimeType}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Acoes do chamado</Text>
              <View style={styles.sectionCard}>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsLabel}>Origem</Text>
                    <Text style={styles.detailsValue}>{originDepartmentName}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsLabel}>Destino</Text>
                    <Text style={styles.detailsValue}>{targetDepartmentName}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsLabel}>Responsavel</Text>
                    <Text style={styles.detailsValue}>{assignedName}</Text>
                  </View>
                  <View style={styles.detailsItem}>
                    <Text style={styles.detailsLabel}>Abertura</Text>
                    <Text style={styles.detailsValue}>{formatDate(ticket.createdAt)}</Text>
                  </View>
                </View>

                <Text style={styles.sectionSubheading}>Prioridade</Text>
                <View style={styles.priorityRow}>
                  {PRIORITY_OPTIONS.map((option) => {
                    const isCurrentPriority = ticket.priority === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.priorityChip,
                          isCurrentPriority && styles.priorityChipActive,
                          (!canUpdatePriority || updatePriorityMutation.isPending) && styles.disabledButton
                        ]}
                        disabled={!canUpdatePriority || updatePriorityMutation.isPending || isCurrentPriority}
                        onPress={() => {
                          void handleUpdatePriority(option.value);
                        }}
                      >
                        <Text style={[styles.priorityChipText, isCurrentPriority && styles.priorityChipTextActive]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>Historico e comentarios</Text>
              <View style={styles.sectionCard}>
                <Controller
                  control={control}
                  name="content"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.field}>
                      <TextInput
                        style={[styles.input, styles.commentInput]}
                        multiline
                        textAlignVertical="top"
                        numberOfLines={4}
                        placeholder="Digite um comentario"
                        placeholderTextColor="#94a3b8"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                      {errors.content?.message ? (
                        <Text style={styles.errorInline}>{errors.content.message}</Text>
                      ) : null}
                    </View>
                  )}
                />

                {canCreateInternalComment ? (
                  <View style={styles.internalSwitchRow}>
                    <Text style={styles.helperText}>Comentario interno</Text>
                    <Switch
                      value={isInternalComment}
                      onValueChange={(value) => {
                        setValue("isInternal", value, { shouldDirty: true });
                      }}
                    />
                  </View>
                ) : null}

                <Pressable
                  style={[styles.smallPrimaryButton, createCommentMutation.isPending && styles.disabledButton]}
                  disabled={createCommentMutation.isPending}
                  onPress={handleSubmit(handleCreateComment)}
                >
                  {createCommentMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.smallPrimaryButtonText}>Enviar comentario</Text>
                  )}
                </Pressable>

                {commentsQuery.isLoading ? (
                  <ActivityIndicator size="small" color="#0b3f77" />
                ) : comments.length === 0 ? (
                  <Text style={styles.helperText}>Nenhum comentario encontrado.</Text>
                ) : (
                  <View style={styles.timelineStack}>
                    {comments.map((comment) => (
                      <View key={comment.id} style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineCard}>
                          <View style={styles.timelineHeader}>
                            <Text style={styles.timelineAuthor}>{comment.author.name}</Text>
                            <Text style={styles.timelineTime}>{formatDate(comment.createdAt)}</Text>
                          </View>
                          {comment.isInternal ? <Text style={styles.internalBadge}>Interno</Text> : null}
                          <Text style={styles.timelineContent}>{comment.content}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {actionMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{actionMessage}</Text>
              </View>
            ) : null}

            {screenError ? (
              <View style={styles.screenErrorBox}>
                <Text style={styles.screenErrorText}>{screenError}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.stickyActionWrap}>
            {canAssignTicket ? (
              <Pressable
                style={[styles.mainActionButton, assignTicketMutation.isPending && styles.disabledButton]}
                disabled={assignTicketMutation.isPending}
                onPress={() => {
                  void handleAssignTicketToSelf();
                }}
              >
                {assignTicketMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.mainActionButtonText}>Iniciar atendimento</Text>
                )}
              </Pressable>
            ) : canResolveTicket ? (
              <Pressable
                style={[styles.mainActionButton, resolveTicketMutation.isPending && styles.disabledButton]}
                disabled={resolveTicketMutation.isPending}
                onPress={() => {
                  void handleResolveTicket();
                }}
              >
                {resolveTicketMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.mainActionButtonText}>Marcar como resolvido</Text>
                )}
              </Pressable>
            ) : canCloseTicket ? (
              <Pressable
                style={[styles.mainActionButton, closeTicketMutation.isPending && styles.disabledButton]}
                disabled={closeTicketMutation.isPending}
                onPress={() => {
                  void handleCloseTicket();
                }}
              >
                {closeTicketMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.mainActionButtonText}>Concluir chamado</Text>
                )}
              </Pressable>
            ) : (
              <View style={styles.mainActionButtonDisabled}>
                <Text style={styles.mainActionButtonDisabledText}>Sem acoes disponiveis</Text>
              </View>
            )}
          </View>

          <MobileBottomNav />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f7"
  },
  container: {
    flex: 1,
    backgroundColor: "#f3f4f7"
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 186,
    gap: 14
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f7",
    gap: 8
  },
  loaderText: {
    fontSize: 14,
    color: "#475569"
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#f3f4f7",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8
  },
  errorTitle: {
    fontSize: 17,
    color: "#991b1b",
    fontWeight: "700",
    textAlign: "center"
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
    textAlign: "center"
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff"
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#102448",
    flex: 1,
    marginLeft: 10,
    marginRight: 10
  },
  headerLogo: {
    width: 118,
    height: 20
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontWeight: "700",
    fontSize: 12
  },
  problemCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 10
  },
  problemLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700"
  },
  problemTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1e293b",
    lineHeight: 40
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#e5eaf3"
  },
  infoGrid: {
    flexDirection: "row",
    gap: 10
  },
  infoItem: {
    flex: 1,
    gap: 4
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: "700"
  },
  infoValue: {
    fontSize: 18,
    color: "#1e293b",
    fontWeight: "700"
  },
  sectionWrap: {
    gap: 8
  },
  sectionHeading: {
    fontSize: 25,
    fontWeight: "800",
    color: "#1e3a8a"
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 12
  },
  description: {
    color: "#334155",
    fontSize: 17,
    lineHeight: 25
  },
  attachmentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  sectionSubheading: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "700"
  },
  smallButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  smallButtonText: {
    color: "#0b3f77",
    fontSize: 12,
    fontWeight: "700"
  },
  attachmentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  attachmentCard: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 10,
    gap: 6
  },
  attachmentName: {
    color: "#1e293b",
    fontWeight: "700",
    fontSize: 13
  },
  attachmentMeta: {
    color: "#64748b",
    fontSize: 12
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  detailsItem: {
    width: "48%",
    gap: 4
  },
  detailsLabel: {
    color: "#64748b",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: "700"
  },
  detailsValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "700"
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8
  },
  priorityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  priorityChipActive: {
    backgroundColor: "#0b3f77",
    borderColor: "#0b3f77"
  },
  priorityChipText: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700"
  },
  priorityChipTextActive: {
    color: "#ffffff"
  },
  field: {
    gap: 4
  },
  input: {
    borderWidth: 1,
    borderColor: "#dbe2ef",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a"
  },
  commentInput: {
    minHeight: 90
  },
  errorInline: {
    color: "#dc2626",
    fontSize: 12
  },
  internalSwitchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  smallPrimaryButton: {
    borderRadius: 10,
    backgroundColor: "#0b3f77",
    paddingVertical: 11,
    alignItems: "center"
  },
  smallPrimaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700"
  },
  timelineStack: {
    gap: 10
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 10,
    backgroundColor: "#123A74"
  },
  timelineCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 10,
    gap: 4
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  timelineAuthor: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "700"
  },
  timelineTime: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600"
  },
  internalBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700",
    alignSelf: "flex-start"
  },
  timelineContent: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18
  },
  helperText: {
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
  screenErrorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 10
  },
  screenErrorText: {
    color: "#b91c1c",
    fontSize: 13
  },
  stickyActionWrap: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 68,
    zIndex: 4
  },
  mainActionButton: {
    borderRadius: 14,
    backgroundColor: "#0b3f77",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center"
  },
  mainActionButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700"
  },
  mainActionButtonDisabled: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    backgroundColor: "#f1f5f9",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center"
  },
  mainActionButtonDisabledText: {
    color: "#64748b",
    fontWeight: "700"
  },
  disabledButton: {
    opacity: 0.7
  }
});
