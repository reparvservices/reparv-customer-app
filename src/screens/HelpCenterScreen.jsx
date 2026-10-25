import React, {useCallback, useEffect, useState} from 'react';
import {API_BASE_URL} from '../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Clock,
  Phone,
  MessageCircle,
  ChevronDown,
} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import RaiseSupportTicketModal from '../components/help/RaiseSupportTicketModal';
import Svg, {Path} from 'react-native-svg';
import {useSelector} from 'react-redux';
import ContactUs from '../components/help/ContactUS';

const PURPLE = '#7C3AED';
const BG = '#F7F7FB';

export default function HelpCenterScreen() {
  const [openFAQ, setOpenFAQ] = useState();
  const navigation = useNavigation();
  const {user} = useSelector(state => state.auth);
  const [open, setOpen] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [contactUs, setContactus] = useState(false);
  const phoneNumber = '8010881965';

  const handleCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    const message = 'Hello, I need urgent help regarding my property.';
    const url = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(
      message,
    )}`;
    Linking.openURL(url);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTickets();
      fetchFaqs();
    }, []),
  );

  useEffect(() => {
    fetchTickets();
  }, [open]);

  const fetchTickets = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/customerapp/ticket/get/${user?.contact}`,
      );
      const data = await res.json();
      setTickets(data || []);
    } catch (err) {
      console.log('Ticket fetch error', err);
    }
  };

  const fetchFaqs = async () => {
    try {
      setFaqLoading(true);

      const res = await fetch(
        `${API_BASE_URL}/admin/faqs/active/Reparv Contact Us Page`,
      );

      const data = await res.json();

      // API already returns correct structure
      setFaqs(data || []);
    } catch (error) {
      console.log('FAQ fetch error', error);
    } finally {
      setFaqLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Help Center</Text>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => setOpen(true)}>
          <Svg
            width="18"
            height="18"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <Path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M1.06323 6.38014C1.06323 3.44375 3.4435 1.06348 6.3799 1.06348C9.31629 1.06348 11.6966 3.44375 11.6966 6.38014C11.6966 9.31654 9.31629 11.6968 6.3799 11.6968C3.4435 11.6968 1.06323 9.31654 1.06323 6.38014ZM6.3799 2.12681C5.25184 2.12681 4.16999 2.57493 3.37234 3.37258C2.57468 4.17024 2.12657 5.25209 2.12657 6.38014C2.12657 7.5082 2.57468 8.59005 3.37234 9.3877C4.16999 10.1854 5.25184 10.6335 6.3799 10.6335C7.50795 10.6335 8.58981 10.1854 9.38746 9.3877C10.1851 8.59005 10.6332 7.5082 10.6332 6.38014C10.6332 5.25209 10.1851 4.17024 9.38746 3.37258C8.58981 2.57493 7.50795 2.12681 6.3799 2.12681Z"
              fill="white"
            />
            <Path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M6.91161 3.72161C6.91161 3.5806 6.85559 3.44537 6.75589 3.34566C6.65618 3.24596 6.52095 3.18994 6.37994 3.18994C6.23893 3.18994 6.1037 3.24596 6.004 3.34566C5.90429 3.44537 5.84827 3.5806 5.84827 3.72161V5.84827H3.72161C3.5806 5.84827 3.44537 5.90429 3.34566 6.004C3.24596 6.1037 3.18994 6.23893 3.18994 6.37994C3.18994 6.52095 3.24596 6.65618 3.34566 6.75589C3.44537 6.85559 3.5806 6.91161 3.72161 6.91161H5.84827V9.03828C5.84827 9.17928 5.90429 9.31451 6.004 9.41422C6.1037 9.51393 6.23893 9.56994 6.37994 9.56994C6.52095 9.56994 6.65618 9.51393 6.75589 9.41422C6.85559 9.31451 6.91161 9.17928 6.91161 9.03828V6.91161H9.03828C9.17928 6.91161 9.31451 6.85559 9.41422 6.75589C9.51393 6.65618 9.56994 6.52095 9.56994 6.37994C9.56994 6.23893 9.51393 6.1037 9.41422 6.004C9.31451 5.90429 9.17928 5.84827 9.03828 5.84827H6.91161V3.72161Z"
              fill="white"
            />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 120}}>
        {/* Help Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <HelpCircle color="#fff" size={20} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.bannerTitle}>How can we help you?</Text>
            <Text style={styles.bannerText}>
              Our support team is here to assist you with any questions or
              concerns about your property journey.
            </Text>
          </View>
        </View>

        {/* Action Cards */}
        <View style={styles.actionRow}>
          <ActionCard
            icon={<AlertCircle color="#EF4444" size={22} />}
            title="Raise a Complaint"
            subtitle="Report an issue"
            onPress={() => setOpen(true)}
            bg={'#FFE2E2'}
          />
          <ActionCard
            icon={<HelpCircle color="#3B82F6" size={22} />}
            title="General Enquiry"
            subtitle="Ask a question"
            onPress={() => setContactus(true)}
            bg={'#E3F2FF'}
          />
        </View>

        {/* My Tickets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Tickets</Text>
          <Text style={styles.activeText}>
            {tickets.filter(t => t.status !== 'Resolved').length} Active
          </Text>
        </View>

        {tickets.map(item => (
          <TicketCard key={item.ticketid} ticket={item} />
        ))}

        {/* FAQ */}

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {faqLoading ? (
          <Text style={{textAlign: 'center', marginTop: 16, color: '#6B7280'}}>
            Loading FAQs...
          </Text>
        ) : (
          faqs.length > 0 &&
          faqs.map((item, i) => {
            const isOpen = openFAQ === i;

            return (
              <View key={item.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setOpenFAQ(isOpen ? null : i)}>
                  <Text style={styles.faqText}>{item.question}</Text>

                  <ChevronDown
                    size={18}
                    style={{
                      transform: [{rotate: isOpen ? '180deg' : '0deg'}],
                    }}
                  />
                </TouchableOpacity>

                {isOpen && <Text style={styles.faqAnswer}>{item.answer}</Text>}
              </View>
            );
          })
        )}

        <View style={{height: 200, padding: 10}} />
      </ScrollView>

      {/* Bottom Help */}
      <View style={styles.bottomHelp}>
        <HelpCircle color="#fff" size={28} />

        <Text style={styles.bottomTitle}>Need Urgent Help?</Text>
        <Text style={styles.bottomSub}>Our support team is available 24/7</Text>

        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            pointerEvents="auto">
            <Phone size={18} />
            <Text style={styles.callText}>Call Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={handleWhatsApp}
            pointerEvents="auto">
            <MessageCircle size={18} color="#fff" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      <RaiseSupportTicketModal visible={open} onClose={() => setOpen(false)} />
      <ContactUs visible={contactUs} onClose={() => setContactus(false)} />
    </SafeAreaView>
  );
}

const getStatusStyle = status => {
  switch (status) {
    case 'Resolved':
    case 'Closed':
      return {
        bg: '#DCFCE7',
        text: '#16A34A',
      };
    case 'Pending':
      return {
        bg: '#FEF3C7',
        text: '#D97706',
      };
    default:
      return {
        bg: '#E5E7EB',
        text: '#374151',
      };
  }
};

/* ---------------- Components ---------------- */

const ActionCard = ({icon, title, subtitle, onPress, bg}) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <View style={[styles.actionIcon, {backgroundColor: bg}]}>{icon}</View>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSub}>{subtitle}</Text>
  </TouchableOpacity>
);
const TicketCard = ({ticket}) => {
  const statusStyle = getStatusStyle(ticket.status);
  const hasResponse = ticket?.response && ticket.response.trim().length > 0;

  return (
    <TouchableOpacity style={styles.ticketCard} activeOpacity={0.8}>
      {/* Top Row */}
      <View style={styles.ticketTop}>
        <View style={[styles.chip, {backgroundColor: statusStyle.bg}]}>
          <Text style={[styles.chipText, {color: statusStyle.text}]}>
            {ticket.status}
          </Text>
        </View>

        <ChevronRight size={18} color="#6B7280" />
      </View>

      {/* Issue */}
      <Text style={styles.ticketTitle}>{ticket.issue}</Text>

      {/* Details */}
      <Text style={styles.ticketDesc} numberOfLines={2}>
        {ticket.details}
      </Text>

      {/* ✅ Response Section (only when exists) */}
      {hasResponse && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Response</Text>
          <Text style={styles.responseText}>{ticket.response}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.ticketFooter}>
        <View style={styles.timeRow}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.timeText}>{ticket.updated_at}</Text>
        </View>

        <Text style={styles.ticketId}>#{ticket.ticketno}</Text>
      </View>
    </TouchableOpacity>
  );
};

/*  Styles  */

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BG},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    color: '#000',
  },
  headerTitle: {fontSize: 18, fontWeight: '600', color: '#000'},
  headerIcon: {
    width: 32,
    height: 32,
    backgroundColor: PURPLE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  banner: {
    backgroundColor: PURPLE,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {color: '#fff', fontSize: 16, fontWeight: '600'},
  bannerText: {color: '#EDE9FE', marginTop: 4, fontSize: 13},

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  actionCard: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 0.5,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {fontWeight: '600', fontSize: 14, color: '#000'},
  actionSub: {fontSize: 12, color: '#6B7280', marginTop: 2},

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 24,
    color: '#000',
  },
  activeText: {color: '#6B7280'},
  divider: {
    width: 325,
    height: 1,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 32,
    marginVertical: 12,
  },

  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderColor: 'gray',
    borderWidth: 0.5,
    padding: 16,
    margin: 16,
    marginTop: 12,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chipRow: {flexDirection: 'row', gap: 8},
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    color: '#000',
  },
  chipText: {fontSize: 12, fontWeight: '500', color: '#000'},

  ticketTitle: {fontSize: 15, fontWeight: '600', marginTop: 10, color: '#000'},
  ticketDesc: {fontSize: 13, color: '#6B7280', marginTop: 4},

  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeRow: {flexDirection: 'row', gap: 6},
  timeText: {fontSize: 12, color: '#6B7280'},
  ticketId: {color: PURPLE, fontSize: 12, fontWeight: '600'},

  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },

  faqText: {fontWeight: '500', color: '#000'},
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  faqAnswer: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
  },

  bottomHelp: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PURPLE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  bottomTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  bottomSub: {color: '#EDE9FE', fontSize: 13, marginTop: 2},

  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  callBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  callText: {fontWeight: '600', color: '#000'},

  whatsappBtn: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  whatsappText: {color: '#fff', fontWeight: '600'},
  responseBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 4,
  },

  responseText: {
    fontSize: 13,
    color: '#065F46',
  },
});
