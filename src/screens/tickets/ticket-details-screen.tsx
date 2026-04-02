import { zodResolver } from "@hookform/resolvers/zod";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
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
import { useMemo, useState } from "react";

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

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
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

type DetailsRowProps = {
  label: string;
  value: string;
};

function DetailsRow({ label, value }: DetailsRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function TicketDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const ticketId = getRouteTicketId(params.id);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: "height" })}
      keyboardVerticalOffset={Platform.select({ ios: 20, android: 0 })}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.select({ ios: "interactive", android: "on-drag" })}
      >
      <Text style={styles.title}>{ticket.title}</Text>
      <Text style={styles.subtitle}>ID: {ticket.id}</Text>

      <View style={styles.badgesRow}>
        <Text style={styles.badge}>{mapStatusLabel(ticket.status)}</Text>
        <Text style={styles.badge}>{mapPriorityLabel(ticket.priority)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descricao</Text>
        <Text style={styles.description}>{ticket.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalhes</Text>
        <DetailsRow label="Solicitante" value={ticket.createdByUserName ?? ticket.createdByUserId} />
        <DetailsRow label="Departamento origem" value={originDepartmentName} />
        <DetailsRow label="Departamento destino" value={targetDepartmentName} />
        <DetailsRow label="Responsavel" value={ticket.assignedToUserId ?? "Nao atribuido"} />
        <DetailsRow label="Aberto em" value={formatDate(ticket.createdAt)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acoes do chamado</Text>
        {canAssignTicket ? (
          <Pressable
            style={[styles.primaryButton, assignTicketMutation.isPending && styles.primaryButtonDisabled]}
            disabled={assignTicketMutation.isPending}
            onPress={() => {
              void handleAssignTicketToSelf();
            }}
          >
            {assignTicketMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>Pegar chamado</Text>
            )}
          </Pressable>
        ) : null}

        <View style={styles.horizontalActions}>
          {canResolveTicket ? (
            <Pressable
              style={[styles.secondaryActionButton, resolveTicketMutation.isPending && styles.secondaryButtonDisabled]}
              disabled={resolveTicketMutation.isPending}
              onPress={() => {
                void handleResolveTicket();
              }}
            >
              {resolveTicketMutation.isPending ? (
                <ActivityIndicator size="small" color="#0b3f77" />
              ) : (
                <Text style={styles.secondaryActionText}>Resolver</Text>
              )}
            </Pressable>
          ) : null}

          {canCloseTicket ? (
            <Pressable
              style={[styles.secondaryActionButton, closeTicketMutation.isPending && styles.secondaryButtonDisabled]}
              disabled={closeTicketMutation.isPending}
              onPress={() => {
                void handleCloseTicket();
              }}
            >
              {closeTicketMutation.isPending ? (
                <ActivityIndicator size="small" color="#0b3f77" />
              ) : (
                <Text style={styles.secondaryActionText}>Concluir</Text>
              )}
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.helperText}>Prioridade</Text>
        <View style={styles.priorityRow}>
          {PRIORITY_OPTIONS.map((option) => {
            const isCurrentPriority = ticket.priority === option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.priorityChip,
                  isCurrentPriority && styles.priorityChipActive,
                  (!canUpdatePriority || updatePriorityMutation.isPending) && styles.secondaryButtonDisabled
                ]}
                disabled={!canUpdatePriority || updatePriorityMutation.isPending || isCurrentPriority}
                onPress={() => {
                  void handleUpdatePriority(option.value);
                }}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    isCurrentPriority && styles.priorityChipTextActive
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Anexos</Text>
          <Pressable
            style={[
              styles.secondaryButton,
              uploadAttachmentMutation.isPending && styles.secondaryButtonDisabled
            ]}
            disabled={uploadAttachmentMutation.isPending}
            onPress={() => {
              void handlePickAndUploadAttachment();
            }}
          >
            {uploadAttachmentMutation.isPending ? (
              <ActivityIndicator size="small" color="#0b3f77" />
            ) : (
              <Text style={styles.secondaryButtonText}>Adicionar arquivo</Text>
            )}
          </Pressable>
        </View>

        {attachmentsQuery.isLoading ? (
          <ActivityIndicator size="small" color="#0b3f77" />
        ) : attachments.length === 0 ? (
          <Text style={styles.helperText}>Nenhum anexo encontrado.</Text>
        ) : (
          <View style={styles.itemsStack}>
            {attachments.map((attachment) => (
              <Pressable
                key={attachment.id}
                style={styles.itemCard}
                onPress={() => {
                  void Linking.openURL(buildAttachmentUrl(attachment.fileUrl));
                }}
              >
                <Text style={styles.itemTitle}>{attachment.fileName}</Text>
                <Text style={styles.itemSubtitle}>{attachment.mimeType}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comentarios</Text>

        <Controller
          control={control}
          name="content"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <TextInput
                style={[styles.input, styles.commentTextArea]}
                multiline
                textAlignVertical="top"
                numberOfLines={4}
                placeholder="Digite seu comentario"
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
          style={[
            styles.primaryButton,
            createCommentMutation.isPending && styles.primaryButtonDisabled
          ]}
          disabled={createCommentMutation.isPending}
          onPress={handleSubmit(handleCreateComment)}
        >
          {createCommentMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Enviar comentario</Text>
          )}
        </Pressable>

        {commentsQuery.isLoading ? (
          <ActivityIndicator size="small" color="#0b3f77" />
        ) : comments.length === 0 ? (
          <Text style={styles.helperText}>Nenhum comentario encontrado.</Text>
        ) : (
          <View style={styles.itemsStack}>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.itemCard}>
                <View style={styles.commentHeader}>
                  <Text style={styles.itemTitle}>{comment.author.name}</Text>
                  {comment.isInternal ? <Text style={styles.internalBadge}>Interno</Text> : null}
                </View>
                <Text style={styles.itemSubtitle}>{formatDate(comment.createdAt)}</Text>
                <Text style={styles.commentBody}>{comment.content}</Text>
              </View>
            ))}
          </View>
        )}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb"
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 24
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f7fb",
    gap: 8
  },
  loaderText: {
    fontSize: 14,
    color: "#475569"
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#f5f7fb",
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b"
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#e2e8f0",
    color: "#334155",
    fontWeight: "600",
    fontSize: 12
  },
  section: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    backgroundColor: "#ffffff",
    padding: 12,
    gap: 10
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a"
  },
  description: {
    color: "#334155",
    fontSize: 14
  },
  row: {
    gap: 2
  },
  rowLabel: {
    color: "#64748b",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  rowValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600"
  },
  helperText: {
    color: "#64748b",
    fontSize: 13
  },
  itemsStack: {
    gap: 8
  },
  itemCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 10,
    gap: 4
  },
  itemTitle: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 13
  },
  itemSubtitle: {
    color: "#64748b",
    fontSize: 12
  },
  field: {
    gap: 4
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a"
  },
  commentTextArea: {
    minHeight: 88
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
  primaryButton: {
    borderRadius: 10,
    backgroundColor: "#0b3f77",
    paddingVertical: 11,
    alignItems: "center"
  },
  primaryButtonDisabled: {
    opacity: 0.7
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700"
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  secondaryButtonDisabled: {
    opacity: 0.7
  },
  secondaryButtonText: {
    color: "#0b3f77",
    fontSize: 12,
    fontWeight: "700"
  },
  horizontalActions: {
    flexDirection: "row",
    gap: 8
  },
  secondaryActionButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    paddingVertical: 10
  },
  secondaryActionText: {
    color: "#334155",
    fontWeight: "700",
    fontSize: 13
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
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  internalBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700"
  },
  commentBody: {
    fontSize: 13,
    color: "#1e293b"
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
  }
});
