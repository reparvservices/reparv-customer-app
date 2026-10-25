import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {useState} from 'react';

export const PropertyIntro = ({propertyDescription}) => {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  if (!propertyDescription || !String(propertyDescription).trim()) return null;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionTitle}>About This Property</Text>

      <Text
        style={styles.description}
        numberOfLines={expanded ? undefined : 4}
        onTextLayout={e => {
          // ✅ Only measure while collapsed so isTruncated is never overwritten
          if (!expanded) {
            setIsTruncated(e.nativeEvent.lines.length > 4);
          }
        }}>
        {propertyDescription}
      </Text>

      {(isTruncated || expanded) && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.readMore}>
            {expanded ? 'Read less' : 'Read more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#555',
  },
  readMore: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6C2BD9',
  },
});
