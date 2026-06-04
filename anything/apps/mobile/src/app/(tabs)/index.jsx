import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Speech from "expo-speech";
import { Mic, MicOff, Send } from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

export default function JarvisHome() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold });

  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [providerStatus, setProviderStatus] = useState(null);

  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Check provider health on mount
    checkProviderHealth();
    // Add welcome message
    addMessage("assistant", "Hello, sir. JARVIS online and ready.");
    speakText("Hello, sir. JARVIS online and ready.");
  }, []);

  const checkProviderHealth = async () => {
    try {
      const response = await fetch("/api/jarvis/ai-providers");
      const data = await response.json();
      setProviderStatus(data);
    } catch (error) {
      console.error("Provider health check failed:", error);
    }
  };

  const addMessage = (role, content, metadata = {}) => {
    const message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      ...metadata,
    };
    setMessages((prev) => [...prev, message]);
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      100,
    );
  };

  const speakText = (text, options = {}) => {
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 1.0,
      ...options,
    });
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      setIsListening(false);
      // In a real implementation, this would stop speech recognition
      // For now, we'll simulate with a test command
      const testCommand = "What's the weather today?";
      setCurrentInput(testCommand);
      await processCommand(testCommand);
    } else {
      setIsListening(true);
      speakText("Listening, sir.");
      // In a real implementation, this would start speech recognition
      // expo-speech-recognition would be used here if available
    }
  };

  const processCommand = async (command) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    addMessage("user", command);

    try {
      // Call cognitive orchestrator
      const response = await fetch("/api/jarvis/cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: command,
          sessionId,
          context: {},
        }),
      });

      const result = await response.json();

      if (result.success) {
        const responseText = result.plan.response;
        addMessage("assistant", responseText, {
          provider: result.provider,
          latency: result.latency,
          plan: result.plan,
        });
        speakText(responseText);

        // Log command
        await fetch("/api/jarvis/mongodb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "store_command_log",
            data: {
              command,
              success: true,
              provider: result.provider,
              latency: result.latency,
              timestamp: new Date(),
            },
          }),
        });
      } else {
        addMessage(
          "assistant",
          "I encountered an error processing that request, sir.",
        );
        speakText("I encountered an error, sir.");
      }
    } catch (error) {
      console.error("Command processing error:", error);
      addMessage(
        "assistant",
        "Connection error. Please check your network, sir.",
      );
      speakText("Connection error, sir.");
    } finally {
      setIsProcessing(false);
      setCurrentInput("");
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
          JARVIS 2.0
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Inter_400Regular",
            color: "#6B7280",
            marginTop: 2,
          }}
        >
          Cognitive Core •{" "}
          {providerStatus?.status === "online" ? "Online" : "Offline"}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={{
              marginBottom: 16,
              alignItems: message.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <View
              style={{
                backgroundColor:
                  message.role === "user" ? "#2563EB" : "#FFFFFF",
                borderRadius: 12,
                borderWidth: message.role === "assistant" ? 1 : 0,
                borderColor: "#E5E7EB",
                paddingHorizontal: 16,
                paddingVertical: 12,
                maxWidth: "80%",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: message.role === "user" ? "#FFFFFF" : "#111827",
                  lineHeight: 20,
                }}
              >
                {message.content}
              </Text>
              {message.provider && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: "#E5E7EB",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "#EFF6FF",
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: "Inter_600SemiBold",
                        color: "#2563EB",
                      }}
                    >
                      {message.provider}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: "Inter_400Regular",
                      color: "#6B7280",
                      marginLeft: 8,
                    }}
                  >
                    {message.latency}ms
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Inter_400Regular",
                color: "#6B7280",
                marginTop: 4,
              }}
            >
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
        {isProcessing && (
          <View style={{ alignItems: "flex-start", marginBottom: 16 }}>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Voice Input Button */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={handleVoiceInput}
          disabled={isProcessing}
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: isListening ? "#EF4444" : "#2563EB",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {isListening ? (
            <MicOff color="#FFFFFF" size={32} />
          ) : (
            <Mic color="#FFFFFF" size={32} />
          )}
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Inter_600SemiBold",
            color: "#6B7280",
            marginTop: 8,
          }}
        >
          {isListening ? "Listening..." : "Tap to speak"}
        </Text>
      </View>
    </View>
  );
}
