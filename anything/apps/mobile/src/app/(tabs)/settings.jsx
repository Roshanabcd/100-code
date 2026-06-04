import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronRight, Check } from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_500Medium,
} from "@expo-google-fonts/inter";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_500Medium,
  });

  const [providerStatus, setProviderStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    continuousListening: true,
    pitch: 1.0,
    rate: 1.0,
    language: "en-US",
  });

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const fetchProviderStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/jarvis/ai-providers");
      const data = await response.json();
      setProviderStatus(data);
    } catch (error) {
      console.error("Failed to fetch provider status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontFamily: "Inter_600SemiBold",
            color: "#111827",
            letterSpacing: -0.5,
          }}
        >
          Settings
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Inter_400Regular",
            color: "#6B7280",
            marginTop: 2,
          }}
        >
          Configure JARVIS behavior
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Providers Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            AI Providers
          </Text>

          {isLoading ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                overflow: "hidden",
              }}
            >
              {providerStatus?.providers?.map((provider, index) => (
                <View
                  key={provider.name}
                  style={{
                    padding: 16,
                    borderBottomWidth:
                      index < providerStatus.providers.length - 1 ? 1 : 0,
                    borderBottomColor: "#E5E7EB",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Inter_600SemiBold",
                          color: "#111827",
                        }}
                      >
                        {provider.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter_400Regular",
                          color: "#6B7280",
                          marginTop: 2,
                        }}
                      >
                        {provider.model}
                      </Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          backgroundColor: "#EFF6FF",
                          borderRadius: 999,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          marginRight: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: "Inter_600SemiBold",
                            color: "#2563EB",
                          }}
                        >
                          Priority {provider.priority}
                        </Text>
                      </View>
                      {provider.hasKey && <Check color="#10B981" size={16} />}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Voice Settings */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Voice Settings
          </Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_600SemiBold",
                    color: "#111827",
                  }}
                >
                  Enable Vocal Output
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    color: "#6B7280",
                    marginTop: 2,
                  }}
                >
                  JARVIS speaks responses
                </Text>
              </View>
              <Switch
                value={settings.voiceEnabled}
                onValueChange={(value) =>
                  setSettings({ ...settings, voiceEnabled: value })
                }
                trackColor={{ false: "#E5E7EB", true: "#2563EB" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View
              style={{
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_600SemiBold",
                    color: "#111827",
                  }}
                >
                  Continuous Listening
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    color: "#6B7280",
                    marginTop: 2,
                  }}
                >
                  Hands-free conversation mode
                </Text>
              </View>
              <Switch
                value={settings.continuousListening}
                onValueChange={(value) =>
                  setSettings({ ...settings, continuousListening: value })
                }
                trackColor={{ false: "#E5E7EB", true: "#2563EB" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Language Settings */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Language
          </Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              overflow: "hidden",
            }}
          >
            {["en-US", "hi-IN", "ne-NP"].map((lang, index) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setSettings({ ...settings, language: lang })}
                style={{
                  padding: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottomWidth: index < 2 ? 1 : 0,
                  borderBottomColor: "#E5E7EB",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily:
                      settings.language === lang
                        ? "Inter_600SemiBold"
                        : "Inter_400Regular",
                    color: "#111827",
                  }}
                >
                  {lang === "en-US"
                    ? "English (US)"
                    : lang === "hi-IN"
                      ? "Hindi"
                      : "Nepali"}
                </Text>
                {settings.language === lang && (
                  <Check color="#2563EB" size={20} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            About
          </Text>

          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_600SemiBold",
                color: "#111827",
                marginBottom: 4,
              }}
            >
              JARVIS 2.0 Cognitive Core
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: "#6B7280",
                lineHeight: 18,
              }}
            >
              AI-native voice assistant with multi-provider fallback, episodic
              memory, and cognitive planning.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
