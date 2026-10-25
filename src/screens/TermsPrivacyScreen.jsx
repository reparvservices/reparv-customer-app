import {ArrowLeft} from 'lucide-react-native';
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';

const TermsPrivacyScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState('terms');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <ArrowLeft size={22} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Terms & Privacy</Text>

          <View style={{width: 22}} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'terms' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('terms')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'terms' && styles.activeTabText,
              ]}>
              Terms of Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'privacy' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('privacy')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'privacy' && styles.activeTabText,
              ]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          {activeTab === 'terms' ? (
            <>
              <Text style={styles.sectionTitle}>Terms and Conditions</Text>

              <Text style={styles.paragraph}>
                Welcome to Reparv Services Private Limited ("Reparv", "we",
                "our", or "us"). These Terms and Conditions govern your use of
                our website www.reparv.in.
              </Text>

              <Text style={styles.subTitle}>1. Eligibility</Text>
              <Text style={styles.paragraph}>
                You must be at least 18 years old to use the Platform.
              </Text>

              <Text style={styles.subTitle}>2. Platform Overview</Text>
              <Text style={styles.paragraph}>
                • Browse and inquire real estate properties{'\n'}• Register
                brokers as freelance partners{'\n'}• Connect buyers with
                verified sellers
              </Text>

              <Text style={styles.subTitle}>3. User Accounts</Text>
              <Text style={styles.paragraph}>
                Users must maintain confidentiality of their credentials.
              </Text>

              <Text style={styles.subTitle}>4. User Responsibilities</Text>
              <Text style={styles.paragraph}>
                Ethical usage is mandatory. Misuse may lead to termination.
              </Text>

              <Text style={styles.subTitle}>5. Intellectual Property</Text>
              <Text style={styles.paragraph}>
                All content belongs to Reparv Services Pvt Ltd.
              </Text>

              <Text style={styles.subTitle}>6. Limitation of Liability</Text>
              <Text style={styles.paragraph}>
                Reparv shall not be liable for indirect or consequential
                damages.
              </Text>

              <Text style={styles.subTitle}>15. Contact Us</Text>
              <Text style={styles.paragraph}>
                Reparv Services Private Limited{'\n'}
                Email: support@reparv.in
              </Text>
            </>
          ) : (
            <Text style={styles.paragraph}>
              Privacy Policy content goes here...
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.updatedText}>Last Updated: Jan 2026</Text>
            <TouchableOpacity>
              <Text style={styles.supportText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default TermsPrivacyScreen;
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },

  backBtn: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F4F4F4',
    padding: 4,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#7B3FE4',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E8E',
  },

  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },

  subTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginTop: 14,
    marginBottom: 4,
  },

  paragraph: {
    fontSize: 14,

    color: '#4A4A4A',
    marginBottom: 12,
  },

  footer: {
    marginTop: 24,
    alignItems: 'center',
  },

  updatedText: {
    fontSize: 13,
    color: '#9B9B9B',
    marginBottom: 6,
  },

  supportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B3FE4',
  },
});
