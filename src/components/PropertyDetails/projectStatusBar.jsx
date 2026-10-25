import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const ProjectStatusBar = ({projectBy, availableCount = 0, bookedCount = 0}) => {
  return (
    <View style={styles.wrapper}>
      {/* Project By */}
      {projectBy && (
        <Text style={styles.projectBy}>
          Project By : <Text style={styles.projectName}>{projectBy}</Text>
        </Text>
      )}

      {/* Status Pills */}
      {(availableCount > 0 || bookedCount > 0) && (
        <View style={styles.row}>
          {/* Available */}
          <View style={styles.availablePill}>
            <Text style={styles.availableLabel}>Available</Text>
            <View style={styles.innerBadge}>
              <Text style={styles.availableCount}>
                {String(availableCount).padStart(2, '0')}
              </Text>
            </View>
          </View>

          {/* Booked */}
          <View style={styles.bookedPill}>
            <Text style={styles.bookedLabel}>Booked</Text>
            <View style={styles.innerBadge}>
              <Text style={styles.bookedCount}>
                {String(bookedCount).padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default ProjectStatusBar;
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,

    borderRadius: 12,
  },

  projectBy: {
    fontSize: 14,
    paddingHorizontal: 6,
    color: '#000000',
    marginBottom: 16,
  },

  projectName: {
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    gap: 14,
  },

  /* Available Pill */
  availablePill: {
    gap: 10,
    height: 40,
    backgroundColor: '#F6F2FF',
    borderRadius: 30,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  availableLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7C3AED',
  },

  /* Booked Pill */
  bookedPill: {
    // flex: 1,
    gap: 15,
    justifyContent: 'space-between',
    height: 40,
    backgroundColor: '#FFF1F1',
    borderRadius: 30,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bookedLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF0000',
  },

  /* Inner Count Capsule */
  innerBadge: {
    backgroundColor: '#FFFFFF',
    minWidth: 52,
    height: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  availableCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },

  bookedCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF0000',
  },
});
