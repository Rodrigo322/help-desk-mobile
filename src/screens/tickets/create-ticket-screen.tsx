import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useMemo, useState } from "react";

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
        <Text style={styles.title}>Novo chamado</Text>
        <Text style={styles.subtitle}>Abra um chamado para um departamento de destino.</Text>

      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.field}>
            <Text style={styles.label}>Titulo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Falha no sistema"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.title?.message ? <Text style={styles.errorText}>{errors.title.message}</Text> : null}
          </View>
        )}
      />

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
              placeholder="Descreva o problema em detalhes"
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
        <Text style={styles.label}>Prioridade</Text>
        <View style={styles.optionsWrap}>
          {PRIORITY_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.optionChip,
                selectedPriority === option.value && styles.optionChipActive
              ]}
              onPress={() => setValue("priority", option.value, { shouldValidate: true })}
            >
              <Text
                style={[
                  styles.optionChipText,
                  selectedPriority === option.value && styles.optionChipTextActive
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {errors.priority?.message ? <Text style={styles.errorText}>{errors.priority.message}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Departamento de destino</Text>
        {departmentsQuery.isLoading ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color="#0b3f77" />
            <Text style={styles.inlineLoaderText}>Carregando departamentos...</Text>
          </View>
        ) : null}

        {!departmentsQuery.isLoading && activeDepartments.length === 0 ? (
          <Text style={styles.helperText}>Nenhum departamento ativo encontrado.</Text>
        ) : null}

        <View style={styles.optionsWrap}>
          {activeDepartments.map((department) => (
            <Pressable
              key={department.id}
              style={[
                styles.optionChip,
                selectedDepartmentId === department.id && styles.optionChipActive
              ]}
              onPress={() =>
                setValue("targetDepartmentId", department.id, {
                  shouldValidate: true,
                  shouldDirty: true
                })
              }
            >
              <Text
                style={[
                  styles.optionChipText,
                  selectedDepartmentId === department.id && styles.optionChipTextActive
                ]}
              >
                {department.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {errors.targetDepartmentId?.message ? (
          <Text style={styles.errorText}>{errors.targetDepartmentId.message}</Text>
        ) : null}
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
            <Text style={styles.submitButtonText}>Criar chamado</Text>
          )}
        </Pressable>
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
    gap: 14,
    paddingBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b"
  },
  field: {
    gap: 8
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155"
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a"
  },
  textArea: {
    minHeight: 110
  },
  optionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  optionChip: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  optionChipActive: {
    backgroundColor: "#0b3f77",
    borderColor: "#0b3f77"
  },
  optionChipText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600"
  },
  optionChipTextActive: {
    color: "#ffffff"
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
    borderRadius: 10,
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
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "#0b3f77",
    paddingVertical: 12,
    alignItems: "center"
  },
  submitButtonDisabled: {
    opacity: 0.7
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  }
});
