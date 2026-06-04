import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_500Medium,
} from "@expo-google-fonts/inter";

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_500Medium,
  });

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, success, error

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/jarvis/mongodb?action=get_command_logs&limit=100",
      );
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "success") return log.success;
    if (filter === "error") return !log.success;
    return true;
  });

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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 24,
                fontFamily: "Inter_600SemiBold",
                color: "#111827",
                letterSpacing: -0.5,
              }}
            >
              Debug Console
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: "#6B7280",
                marginTop: 2,
              }}
            >
              {filteredLogs.length} entries
            </Text>
          </View>
          <TouchableOpacity onPress={fetchLogs}>
            <RefreshCw color="#6B7280" size={20} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          {["all", "success", "error"].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 2,
                borderBottomColor: filter === f ? "#2563EB" : "transparent",
                marginBottom: -1,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily:
                    filter === f ? "Inter_600SemiBold" : "Inter_400Regular",
                  color: filter === f ? "#111827" : "#6B7280",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logs List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : filteredLogs.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: "#6B7280",
              }}
            >
              No logs found
            </Text>
          </View>
        ) : (
          filteredLogs.map((log, index) => (
            <View
              key={log._id || index}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                padding: 16,
                marginBottom: 12,
              }}
            >
              {/* Status and Provider */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                {log.success ? (
                  <CheckCircle color="#10B981" size={16} />
                ) : (
                  <XCircle color="#EF4444" size={16} />
                )}
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_600SemiBold",
                    color: log.success ? "#10B981" : "#EF4444",
                    marginLeft: 6,
                  }}
                >
                  {log.success ? "SUCCESS" : "ERROR"}
                </Text>
                {log.provider && (
                  <View
                    style={{
                      backgroundColor: "#EFF6FF",
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      marginLeft: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: "Inter_600SemiBold",
                        color: "#2563EB",
                      }}
                    >
                      {log.provider}
                    </Text>
                  </View>
                )}
              </View>

              {/* Command */}
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                {log.command}
              </Text>

              {/* Error Message */}
              {log.error && (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    color: "#EF4444",
                    marginBottom: 8,
                  }}
                >
                  {log.error}
                </Text>
              )}

              {/* Metadata */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Clock color="#6B7280" size={12} />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "Inter_400Regular",
                    color: "#6B7280",
                    marginLeft: 4,
                  }}
                >
                  {new Date(log.timestamp).toLocaleString()}
                </Text>
                {log.latency && (
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Inter_500Medium",
                      color: "#6B7280",
                      marginLeft: 12,
                    }}
                  >
                    {log.latency}ms
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
