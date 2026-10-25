import React, {useEffect, useRef, useState, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import {
  Bot,
  X,
  Send,
  Sparkles,
  MapPin,
  IndianRupee,
  Home,
} from 'lucide-react-native';
import {useAgentChat} from '../../hooks/useAgentChat';
import {extractSeoSlug, getDisplayText} from '../../utils/agentChatUtils';
import {getImageUri} from '../../utils/imageHandle';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const QUICK_PROMPTS = [
  '2 BHK in Pune under 90L',
  'Properties in Nagpur',
  'Schedule a site visit',
  'Talk to sales team',
];

const PROMPT_MAP = {
  '2 BHK in Pune under 90L': 'Show me 2 BHK apartments in Pune under 90 lakh',
  'Properties in Nagpur': 'What properties do you have in Nagpur?',
  'Schedule a site visit': 'I want to schedule a site visit next Saturday',
  'Talk to sales team': 'Connect me with a sales executive',
};

const TypingIndicator = memo(() => (
  <View style={styles.messageRowBot}>
    <View style={styles.botAvatar}>
      <Sparkles size={14} color="#5E23DC" strokeWidth={2.2} />
    </View>
    <View style={styles.typingBubble}>
      <View style={styles.typingDots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={styles.typingDot} />
        ))}
      </View>
    </View>
  </View>
));

const PropertyCard = memo(({property, onPress}) => {
  const imageUri = getImageUri(property.imageUrl);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.propertyCard}>
      {imageUri ? (
        <Image
          source={{uri: imageUri}}
          style={styles.propertyImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.propertyImagePlaceholder}>
          <Home size={20} color="rgba(138,56,245,0.5)" />
        </View>
      )}
      <View style={styles.propertyBody}>
        <Text style={styles.propertyName} numberOfLines={2}>
          {property.projectName || 'Property'}
        </Text>
        {property.location && (
          <View style={styles.propertyLocationRow}>
            <MapPin size={10} color="#868686" />
            <Text style={styles.propertyLocation} numberOfLines={1}>
              {property.location}
            </Text>
          </View>
        )}
        {property.bedrooms && (
          <Text style={styles.propertyBedrooms} numberOfLines={1}>
            {property.bedrooms}
          </Text>
        )}
        <View style={styles.propertyPriceRow}>
          <IndianRupee size={11} color="#5E23DC" />
          <Text style={styles.propertyPrice}>
            {property.price || 'Price on request'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ChatMessage = memo(({message, onPropertyPress}) => {
  if (message.role === 'error') {
    return (
      <View style={styles.errorBubble}>
        <Text style={styles.errorText}>{message.text}</Text>
      </View>
    );
  }

  const isUser = message.role === 'user';
  const displayText = isUser
    ? message.text
    : getDisplayText(message.text, message.properties);

  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowBot,
      ]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Sparkles size={14} color="#5E23DC" strokeWidth={2.2} />
        </View>
      )}
      <View
        style={[styles.messageContent, isUser && styles.messageContentUser]}>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText,
            ]}>
            {displayText}
          </Text>
        </View>

        {message.properties?.length > 0 && (
          <View style={styles.propertiesSection}>
            <Text style={styles.propertiesLabel}>
              {message.properties.length} PROPERTIES FOUND
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.propertiesRow}>
              {message.properties.map((property, index) => {
                const seoSlug = extractSeoSlug(property);
                return (
                  <PropertyCard
                    key={`${property.id || property.projectName}-${index}`}
                    property={property}
                    onPress={() => seoSlug && onPropertyPress(seoSlug)}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
});

export default function AgentWidget() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {height: windowHeight} = useWindowDimensions();
  const {user, token} = useSelector(state => state.auth);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const {
    connectionStatus,
    messages,
    isTyping,
    isSending,
    isLoadingHistory,
    sendMessage,
  } = useAgentChat(user, token, isOpen);

  // Auto scroll
  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({animated: true});
    }, 100);
    return () => clearTimeout(timeout);
  }, [messages, isTyping, isOpen]);

  // Auto focus input
  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!input.trim() || isSending) return;
    const success = sendMessage(input.trim());
    if (success) setInput('');
  };

  const handlePrompt = label => {
    const mapped = PROMPT_MAP[label] || label;
    sendMessage(mapped);
  };

  const handlePropertyPress = seoSlug => {
    setIsOpen(false);
    navigation.navigate('PropertyDetails', {seoSlug});
  };

  const isOnline = connectionStatus === 'connected';
  const canSend = Boolean(input.trim()) && !isSending;
  const panelHeight = Math.min(windowHeight * 0.76, 640);

  return (
    <>
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
          pointerEvents="box-none">
          <View
            style={[
              styles.panel,
              {height: panelHeight, paddingBottom: Math.max(insets.bottom, 12)},
            ]}>
            <View style={styles.sheetHeader}>
              <View style={styles.headerHandle} />

              <View style={styles.sheetHeaderRow}>
                <LinearGradient
                  colors={['#5E23DC', '#8B5CF6']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.headerIconWrap}>
                  <Sparkles size={20} color="#fff" strokeWidth={2.4} />
                </LinearGradient>

                <View style={styles.headerTextWrap}>
                  <View style={styles.titleStatusRow}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                      Reparv AI Advisor
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        !isOnline && styles.statusPillPending,
                      ]}>
                      <View
                        style={[
                          styles.statusDot,
                          isOnline
                            ? styles.statusDotOnline
                            : styles.statusDotPending,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          !isOnline && styles.statusTextPending,
                        ]}>
                        {isOnline ? 'Online' : 'Connecting'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    Ask about properties, budget, or site visits
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setIsOpen(false)}
                  style={styles.closeBtn}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  accessibilityRole="button"
                  accessibilityLabel="Close AI Advisor">
                  <X size={18} color="#6B7280" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* MESSAGES */}
            <View style={styles.messagesWrap}>
              <ScrollView
                ref={scrollRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() =>
                  scrollRef.current?.scrollToEnd({animated: true})
                }>
                {isLoadingHistory ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator color="#8A38F5" size="large" />
                    <Text style={styles.loadingText}>
                      Loading conversation...
                    </Text>
                  </View>
                ) : (
                  messages.map(msg => (
                    <ChatMessage
                      key={msg.id || msg.timestamp}
                      message={msg}
                      onPropertyPress={handlePropertyPress}
                    />
                  ))
                )}
                {isTyping && <TypingIndicator />}
              </ScrollView>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <View style={styles.promptsSection}>
                <Text style={styles.promptsLabel}>QUICK ASKS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.promptsRow}>
                  {QUICK_PROMPTS.map(label => (
                    <TouchableOpacity
                      key={label}
                      style={styles.promptChip}
                      disabled={isSending}
                      activeOpacity={0.75}
                      onPress={() => handlePrompt(label)}>
                      <Text style={styles.promptChipText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask about properties..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  editable={!isSending}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmit}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!canSend}
                  activeOpacity={0.85}
                  style={styles.sendBtn}>
                  <LinearGradient
                    colors={
                      canSend ? ['#5E23DC', '#8A38F5'] : ['#C4B5FD', '#DDD6FE']
                    }
                    style={styles.sendBtnGradient}>
                    {isSending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Send size={19} color="#fff" strokeWidth={2.5} />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* LAUNCHER */}
      {!isOpen && (
        <View style={[styles.launcherWrap, {bottom: 80 + insets.bottom}]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setIsOpen(true)}
            style={styles.launcherBtn}
            accessibilityLabel="Open Reparv AI Advisor">
            <LinearGradient
              colors={['#5308e7', '#5E23DC', '#8A38F5']}
              style={styles.launcherGradient}>
              <Bot size={26} color="#fff" strokeWidth={2} />
            </LinearGradient>
            <View style={styles.launcherBadge} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#4C1D95',
        shadowOffset: {width: 0, height: -10},
        shadowOpacity: 0.22,
        shadowRadius: 24,
      },
      android: {elevation: 24},
    }),
  },
  sheetHeader: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDE9FE',
  },
  headerHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexShrink: 0,
  },
  statusPillPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotOnline: {backgroundColor: '#10B981'},
  statusDotPending: {backgroundColor: '#F59E0B'},
  statusText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#B45309',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexShrink: 0,
  },
  messagesWrap: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#F5F3FF',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 14,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 60,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  messageRow: {width: '100%'},
  messageRowUser: {flexDirection: 'row', justifyContent: 'flex-end'},
  messageRowBot: {flexDirection: 'row', alignItems: 'flex-start', gap: 10},
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  messageContent: {flex: 1, gap: 8},
  messageContentUser: {alignItems: 'flex-end'},
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 13,
    maxWidth: '88%',
  },
  userBubble: {
    backgroundColor: '#5E23DC',
    borderBottomRightRadius: 6,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#5E23DC',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {elevation: 2},
    }),
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {color: '#fff', fontWeight: '500'},
  botMessageText: {color: '#1F2937'},
  errorBubble: {
    alignSelf: 'stretch',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 14,
  },
  errorText: {color: '#dc2626', fontSize: 14},

  propertiesSection: {marginTop: 6},
  propertiesLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingLeft: 4,
  },
  propertiesRow: {gap: 12, paddingRight: 8},

  propertyCard: {
    width: SCREEN_WIDTH > 400 ? 172 : 158,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(94, 35, 220, 0.18)',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  propertyImage: {width: '100%', height: 102},
  propertyImagePlaceholder: {
    width: '100%',
    height: 102,
    backgroundColor: '#f6f2fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyBody: {padding: 11, gap: 5},
  propertyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 18,
  },
  propertyLocationRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  propertyLocation: {flex: 1, fontSize: 11.5, color: '#6B7280'},
  propertyBedrooms: {fontSize: 12, color: '#4B5563'},
  propertyPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  propertyPrice: {fontSize: 13.5, fontWeight: '700', color: '#5E23DC'},

  typingBubble: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 17,
    paddingVertical: 14,
  },
  typingDots: {flexDirection: 'row', gap: 5},
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8A38F5',
    opacity: 0.7,
  },

  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -6},
        shadowOpacity: 0.1,
        shadowRadius: 14,
      },
      android: {elevation: 12},
    }),
  },
  promptsSection: {paddingTop: 12, paddingBottom: 8, paddingHorizontal: 16},
  promptsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  promptsRow: {gap: 9, paddingRight: 8},
  promptChip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 16,
    paddingVertical: 9.5,
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5E23DC',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 2,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 0,
    fontSize: 15,
    color: '#111827',
  },
  sendBtn: {borderRadius: 24, overflow: 'hidden'},
  sendBtnGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  launcherWrap: {
    position: 'absolute',
    right: 18,
    zIndex: 10000,
    elevation: 10000,
  },
  launcherBtn: {position: 'relative'},
  launcherGradient: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5E23DC',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  launcherBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34D399',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
});
