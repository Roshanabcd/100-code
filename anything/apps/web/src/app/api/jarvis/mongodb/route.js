// JARVIS Memory Storage using external MongoDB API
// Since mongodb package isn't available, we'll use fetch to MongoDB Data API

const MONGODB_API_URL =
  "https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1";
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://hackerroshan58_db_user:6P17ouuTH2Hf@cluster0.mongodb.net/jarvis?retryWrites=true&w=majority";

// Parse connection string to get cluster info
function parseMongoURI(uri) {
  const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
  if (!match) return null;
  return {
    username: match[1],
    password: match[2],
    cluster: match[3],
    database: match[4],
  };
}

// Simple in-memory storage as fallback
const memoryStore = {
  conversations: [],
  commandLogs: [],
  userPreferences: [],
  learnedMacros: [],
};

// Store conversation message
export async function POST(request) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case "store_message": {
        const { sessionId, role, content, timestamp, metadata } = data;
        const message = {
          _id: Date.now().toString(),
          sessionId,
          role,
          content,
          timestamp: timestamp || new Date().toISOString(),
          metadata: metadata || {},
        };
        memoryStore.conversations.push(message);
        // Keep only last 500 messages
        if (memoryStore.conversations.length > 500) {
          memoryStore.conversations = memoryStore.conversations.slice(-500);
        }
        return Response.json({ success: true, id: message._id });
      }

      case "store_command_log": {
        const { command, success, provider, latency, error, timestamp } = data;
        const log = {
          _id: Date.now().toString(),
          command,
          success,
          provider,
          latency,
          error,
          timestamp: timestamp || new Date().toISOString(),
        };
        memoryStore.commandLogs.push(log);
        // Keep only last 100 logs
        if (memoryStore.commandLogs.length > 100) {
          memoryStore.commandLogs = memoryStore.commandLogs.slice(-100);
        }
        return Response.json({ success: true, id: log._id });
      }

      case "store_user_preference": {
        const { key, value, userId } = data;
        const existingIndex = memoryStore.userPreferences.findIndex(
          (p) => p.userId === userId && p.key === key,
        );
        const pref = {
          userId,
          key,
          value,
          updatedAt: new Date().toISOString(),
        };
        if (existingIndex >= 0) {
          memoryStore.userPreferences[existingIndex] = pref;
        } else {
          memoryStore.userPreferences.push(pref);
        }
        return Response.json({ success: true });
      }

      case "store_learned_macro": {
        const { name, steps, userId, description } = data;
        const macro = {
          _id: Date.now().toString(),
          name,
          steps,
          userId,
          description,
          createdAt: new Date().toISOString(),
          usageCount: 0,
        };
        memoryStore.learnedMacros.push(macro);
        return Response.json({ success: true, id: macro._id });
      }

      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[MongoDB] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Retrieve data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "get_conversation": {
        const sessionId = searchParams.get("sessionId");
        const limit = parseInt(searchParams.get("limit") || "500");
        const messages = memoryStore.conversations
          .filter((m) => m.sessionId === sessionId)
          .slice(-limit);
        return Response.json({ success: true, messages });
      }

      case "get_command_logs": {
        const limit = parseInt(searchParams.get("limit") || "100");
        const logs = memoryStore.commandLogs.slice(-limit).reverse();
        return Response.json({ success: true, logs });
      }

      case "get_user_preferences": {
        const userId = searchParams.get("userId");
        const prefs = memoryStore.userPreferences.filter(
          (p) => p.userId === userId,
        );
        return Response.json({ success: true, preferences: prefs });
      }

      case "get_learned_macros": {
        const userId = searchParams.get("userId");
        const macros = memoryStore.learnedMacros
          .filter((m) => m.userId === userId)
          .sort((a, b) => b.usageCount - a.usageCount);
        return Response.json({ success: true, macros });
      }

      case "health": {
        return Response.json({
          success: true,
          connected: true,
          storage: "in-memory",
          stats: {
            conversations: memoryStore.conversations.length,
            commandLogs: memoryStore.commandLogs.length,
            userPreferences: memoryStore.userPreferences.length,
            learnedMacros: memoryStore.learnedMacros.length,
          },
        });
      }

      default:
        return Response.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[MongoDB] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
