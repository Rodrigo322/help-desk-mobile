import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ChevronDown, ChevronUp, Paperclip } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo, useState } from "react";

import { MobileBottomNav } from "../../components/layout/mobile-bottom-nav";
import { useDepartments } from "../../hooks/use-departments";
import { useCreateTicket } from "../../hooks/use-tickets";
import { createTicketSchema, CreateTicketFormData } from "../../schemas/tickets/create-ticket-schema";
import { getApiErrorMessage } from "../../services/api";
import { TicketPriority } from "../../types/ticket";

const PRIORITY_OPTIONS: Array<{ label: string; value: TicketPriority }> = [
  { label: "Baixa", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" }
];

export function CreateTicketScreen() {
  const router = useRouter();
  const createTicketMutation = useCreateTicket();
  const departmentsQuery = useDepartments();
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [isDepartmentListOpen, setIsDepartmentListOpen] = useState(false);

  const activeDepartments = useMemo(() => {
    return (departmentsQuery.data?.departments ?? []).filter((department) => department.isActive);
  }, [departmentsQuery.data?.departments]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      targetDepartmentId: ""
    }
  });

  const selectedPriority = watch("priority");
  const selectedDepartmentId = watch("targetDepartmentId");

  const selectedDepartment = activeDepartments.find(
    (department) => department.id === selectedDepartmentId
  );

  async function onSubmit(values: CreateTicketFormData) {
    try {
      setSubmitErrorMessage(null);
      const result = await createTicketMutation.mutateAsync(values);
      router.replace(`/tickets/${result.ticket.id}`);
    } catch (error) {
      setSubmitErrorMessage(getApiErrorMessage(error));
    }
  }

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
              <Text style={styles.headerTitle}>Novo Chamado</Text>
              <Image
                source={require("../../../assets/brand/new-holland-blue.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.subtitle}>
              Preencha os detalhes abaixo para solicitar assistencia tecnica ao departamento de destino.
            </Text>

            <View style={styles.formCard}>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.field}>
                    <Text style={styles.label}>Titulo</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: Falha no sistema hidraulico"
                      placeholderTextColor="#94a3b8"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    {errors.title?.message ? <Text style={styles.errorText}>{errors.title.message}</Text> : null}
                  </View>
                )}
              />

              <View style={styles.field}>
                <Text style={styles.label}>Departamento destino</Text>

                {departmentsQuery.isLoading ? (
                  <View style={styles.inlineLoader}>
                    <ActivityIndicator size="small" color="#123A74" />
                    <Text style={styles.inlineLoaderText}>Carregando departamentos...</Text>
                  </View>
                ) : null}

                {!departmentsQuery.isLoading && activeDepartments.length > 0 ? (
                  <>
                    <Pressable
                      style={styles.selectField}
                      onPress={() => setIsDepartmentListOpen((prev) => !prev)}
                    >
                      <Text
                        style={[
                          styles.selectText,
                          !selectedDepartment && styles.selectPlaceholder
                        ]}
                      >
                        {selectedDepartment?.name ?? "Selecione um departamento"}
                      </Text>
                      {isDepartmentListOpen ? (
                        <ChevronUp size={16} color="#64748b" />
                      ) : (
                        <ChevronDown size={16} color="#64748b" />
                      )}
                    </Pressable>

                    {isDepartmentListOpen ? (
                      <View style={styles.departmentList}>
                        {activeDepartments.map((department) => {
                          const isSelected = selectedDepartmentId === department.id;

                          return (
                            <Pressable
                              key={department.id}
                              style={[
                                styles.departmentOption,
                                isSelected && styles.departmentOptionSelected
                              ]}
                              onPress={() => {
                                setValue("targetDepartmentId", department.id, {
                                  shouldValidate: true,
                                  shouldDirty: true
                                });
                                setIsDepartmentListOpen(false);
                              }}
                            >
                              <Text
                                style={[
                                  styles.departmentOptionText,
                                  isSelected && styles.departmentOptionTextSelected
                                ]}
                              >
                                {department.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </>
                ) : null}

                {!departmentsQuery.isLoading && activeDepartments.length === 0 ? (
                  <Text style={styles.helperText}>Nenhum departamento ativo encontrado.</Text>
                ) : null}

                {errors.targetDepartmentId?.message ? (
                  <Text style={styles.errorText}>{errors.targetDepartmentId.message}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Prioridade</Text>
                <View style={styles.priorityRow}>
                  {PRIORITY_OPTIONS.map((option) => {
                    const isSelected = selectedPriority === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        style={[styles.priorityOption, isSelected && styles.priorityOptionSelected]}
                        onPress={() => setValue("priority", option.value, { shouldValidate: true })}
                      >
                        <Text style={[styles.priorityOptionLabel, isSelected && styles.priorityOptionLabelSelected]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.priority?.message ? <Text style={styles.errorText}>{errors.priority.message}</Text> : null}
              </View>

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.field}>
                    <Text style={styles.label}>Descricao</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                      placeholder="Descreva o problema ou solicitacao com detalhes"
                      placeholderTextColor="#94a3b8"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                    {errors.description?.message ? (
                      <Text style={styles.errorText}>{errors.description.message}</Text>
                    ) : null}
                  </View>
                )}
              />

              <View style={styles.field}>
                <Text style={styles.label}>Anexos</Text>
                <View style={styles.attachmentBox}>
                  <View style={styles.attachmentCircle}>
                    <Paperclip size={16} color="#d4a90d" />
                  </View>
                  <Text style={styles.attachmentTitle}>Adicionar no detalhe</Text>
                  <Text style={styles.attachmentSubtitle}>
                    Os anexos podem ser enviados apos abrir o chamado.
                  </Text>
                </View>
              </View>

              {submitErrorMessage ? (
                <View style={styles.submitErrorBox}>
                  <Text style={styles.submitErrorTitle}>Nao foi possivel criar o chamado</Text>
                  <Text style={styles.submitErrorText}>{submitErrorMessage}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.submitButton, createTicketMutation.isPending && styles.submitButtonDisabled]}
                disabled={createTicketMutation.isPending}
                onPress={handleSubmit(onSubmit)}
              >
                {createTicketMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Abrir chamado</Text>
                )}
              </Pressable>

              <Pressable
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={createTicketMutation.isPending}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </ScrollView>

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
    paddingBottom: 120,
    gap: 14
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
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
    flex: 1,
    marginLeft: 10,
    fontSize: 26,
    fontWeight: "800",
    color: "#102448"
  },
  headerLogo: {
    width: 132,
    height: 22
  },
  subtitle: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 14
  },
  field: {
    gap: 8
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155"
  },
  input: {
    borderWidth: 1,
    borderColor: "#dbe2ef",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a"
  },
  textArea: {
    minHeight: 120
  },
  selectField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#dbe2ef",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  selectText: {
    color: "#1e293b",
    fontSize: 15,
    fontWeight: "600"
  },
  selectPlaceholder: {
    color: "#94a3b8",
    fontWeight: "500"
  },
  departmentList: {
    borderWidth: 1,
    borderColor: "#dbe2ef",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden"
  },
  departmentOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7"
  },
  departmentOptionSelected: {
    backgroundColor: "#eff6ff"
  },
  departmentOptionText: {
    fontSize: 14,
    color: "#334155"
  },
  departmentOptionTextSelected: {
    color: "#123A74",
    fontWeight: "700"
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfd7e6",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  priorityOptionSelected: {
    borderColor: "#1d4ed8",
    backgroundColor: "#eff6ff"
  },
  priorityOptionLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "800",
    textTransform: "uppercase"
  },
  priorityOptionLabelSelected: {
    color: "#123A74"
  },
  attachmentBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cfd7e6",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 6
  },
  attachmentCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center"
  },
  attachmentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155"
  },
  attachmentSubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 10
  },
  helperText: {
    fontSize: 13,
    color: "#64748b"
  },
  inlineLoader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  inlineLoaderText: {
    fontSize: 13,
    color: "#475569"
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12
  },
  submitErrorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 12,
    gap: 4
  },
  submitErrorTitle: {
    color: "#991b1b",
    fontWeight: "700",
    fontSize: 13
  },
  submitErrorText: {
    color: "#b91c1c",
    fontSize: 13
  },
  submitButton: {
    borderRadius: 12,
    backgroundColor: "#0b3f77",
    paddingVertical: 14,
    alignItems: "center"
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700"
  },
  cancelButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4dce9",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    alignItems: "center"
  },
  cancelButtonText: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700"
  }
});
