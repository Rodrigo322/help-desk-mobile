import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";

import { useSignIn } from "../../hooks/use-sign-in";
import { signInSchema, SignInFormData } from "../../schemas/auth/sign-in-schema";
import { getApiErrorMessage } from "../../services/api";

export function SignInScreen() {
  const signInMutation = useSignIn();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function onSubmit(data: SignInFormData) {
    try {
      setErrorMessage(null);
      await signInMutation.mutateAsync(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: "padding", android: "height" })}
        keyboardVerticalOffset={Platform.select({ ios: 20, android: 0 })}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.select({ ios: "interactive", android: "on-drag" })}
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>JT</Text>
            </View>
            <Text style={styles.brandTitle}>Justi Tratores</Text>
            <Text style={styles.brandSubtitle}>Solucoes em maquinario pesado</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Acesse sua conta</Text>
            <Text style={styles.subtitle}>Informe suas credenciais para continuar</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>E-mail</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="seu@email.com"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  {formState.errors.email?.message ? (
                    <Text style={styles.errorText}>{formState.errors.email.message}</Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Senha</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                    <TextInput
                      style={styles.input}
                      secureTextEntry
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="*******"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  {formState.errors.password?.message ? (
                    <Text style={styles.errorText}>{formState.errors.password.message}</Text>
                  ) : null}
                </View>
              )}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <Pressable
              style={styles.button}
              disabled={signInMutation.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              {signInMutation.isPending ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.footer}>© 2026 Justi Tratores. Todos os direitos reservados.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B4B97"
  },
  container: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    justifyContent: "center",
    gap: 18
  },
  brandBlock: {
    alignItems: "center",
    gap: 6
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  logoText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0B4B97"
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#ffffff"
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#dbeafe"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    gap: 12
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a"
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 8
  },
  field: {
    gap: 6
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155"
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a"
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#FACC15",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14
  },
  buttonText: {
    color: "#0f172a",
    fontSize: 17,
    fontWeight: "800"
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13
  },
  footer: {
    textAlign: "center",
    color: "#bfdbfe",
    fontSize: 12
  }
});
