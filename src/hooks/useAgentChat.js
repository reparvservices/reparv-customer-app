import {useCallback, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config/api';
import {AI_AGENT_PUBLIC_KEY} from '../config/agent';
import {createMessageId, WELCOME_MESSAGE} from '../utils/agentChatUtils';

const STORAGE_GUEST = 'reparv_ai_guest_id';

async function getOrCreateGuestId() {
  const stored = await AsyncStorage.getItem(STORAGE_GUEST);
  if (stored) {
    return stored;
  }

  const id = `guest:${createMessageId()}`;
  await AsyncStorage.setItem(STORAGE_GUEST, id);
  return id;
}

function buildPayload(message, user) {
  const payload = {
    type: 'chat',
    message,
    language: 'hinglish',
  };

  if (user?.id) {
    payload.mode = 'user';
    payload.userId = String(user.id);
  } else {
    payload.mode = 'guest';
    payload.guestId = null;
  }

  return payload;
}

async function resolveGuestId(payload) {
  if (payload.mode !== 'guest') {
    return payload;
  }
  return {...payload, guestId: await getOrCreateGuestId()};
}

async function fetchConversationHistory(token) {
  const res = await fetch(`${API_BASE_URL}/user/agent/conversation-history`, {
    headers: {
      Accept: 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
  });

  if (res.status === 401) {
    return [];
  }
  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return Array.isArray(data.messages) ? data.messages : [];
}

async function sendViaHttp(payload, token) {
  const body = {
    ...payload,
    ...(AI_AGENT_PUBLIC_KEY ? {apiKey: AI_AGENT_PUBLIC_KEY} : {}),
  };

  const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Server returned an invalid response.');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Failed to reach AI advisor.');
  }

  return data;
}

export function useAgentChat(user, token, enabled) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const busyRef = useRef(false);
  const userRef = useRef(user);
  const tokenRef = useRef(token);
  const initRef = useRef(false);

  userRef.current = user;
  tokenRef.current = token;

  const addMessage = useCallback(msg => {
    setMessages(prev => [...prev, {id: createMessageId(), ...msg}]);
  }, []);

  const handleReply = useCallback(
    data => {
      if (data.type === 'error') {
        setIsSending(false);
        setIsTyping(false);
        busyRef.current = false;
        addMessage({
          role: 'error',
          text: data.message || 'Something went wrong',
        });
        return;
      }

      if (data.type === 'reply') {
        setIsSending(false);
        setIsTyping(false);
        busyRef.current = false;
        setConnectionStatus('connected');

        if (data.session?.guestId) {
          AsyncStorage.setItem(STORAGE_GUEST, data.session.guestId);
        }

        addMessage({
          role: 'bot',
          text: data.reply || "I couldn't find an answer. Please try again.",
          properties: data.properties,
        });
      }
    },
    [addMessage],
  );

  const sendMessage = useCallback(
    text => {
      const message = text.trim();
      if (!message || busyRef.current) {
        return false;
      }

      addMessage({role: 'user', text: message});

      busyRef.current = true;
      setIsSending(true);
      setIsTyping(true);
      setConnectionStatus('connecting');

      resolveGuestId(buildPayload(message, userRef.current))
        .then(payload => sendViaHttp(payload, tokenRef.current))
        .then(handleReply)
        .catch(() => {
          setIsSending(false);
          setIsTyping(false);
          busyRef.current = false;
          setConnectionStatus('disconnected');
          addMessage({
            role: 'error',
            text: 'AI advisor se connect nahi ho paya. Thodi der baad try karein.',
          });
        });

      return true;
    },
    [addMessage, handleReply],
  );

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('disconnected');
      setMessages([]);
      setIsLoadingHistory(false);
      initRef.current = false;
      return;
    }

    setConnectionStatus('connected');

    if (initRef.current) {
      return;
    }
    initRef.current = true;

    const initChat = async () => {
      if (user?.id) {
        setIsLoadingHistory(true);
        try {
          const history = await fetchConversationHistory(tokenRef.current);
          if (history.length > 0) {
            setMessages(history);
            return;
          }
        } catch {
          // Fall through to welcome message
        } finally {
          setIsLoadingHistory(false);
        }
      }

      setMessages([
        {
          id: createMessageId(),
          role: 'bot',
          text: WELCOME_MESSAGE,
        },
      ]);
    };

    initChat();
  }, [enabled, user?.id]);

  return {
    connectionStatus,
    messages,
    isTyping,
    isSending,
    isLoadingHistory,
    sendMessage,
  };
}
