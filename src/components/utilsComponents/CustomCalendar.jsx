import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';

/* ─── Constants ─────────────────────────────────────────────────── */
const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MIN_YEAR = 1924;
const MAX_YEAR = new Date().getFullYear();
const ALL_YEARS = Array.from(
  {length: MAX_YEAR - MIN_YEAR + 1},
  (_, i) => MAX_YEAR - i,
);

const VIEW = {YEAR: 'year', MONTH: 'month', CALENDAR: 'cal'};

const PURPLE = '#7C3AED';
const PURPLE_BG = '#F5F3FF';

/* ─── Component ─────────────────────────────────────────────────── */
export default function CustomCalendar({
  visible,
  onClose,
  onSelect,
  currentMonth,
  setCurrentMonth,
}) {
  const [view, setView] = useState(VIEW.YEAR);
  const yearListRef = useRef(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reset to YEAR every time modal opens
  useEffect(() => {
    if (visible) setView(VIEW.YEAR);
  }, [visible]);

  // Auto-scroll to selected year after list renders
  useEffect(() => {
    if (view === VIEW.YEAR) {
      const idx = ALL_YEARS.indexOf(year);
      if (idx !== -1) {
        setTimeout(() => {
          yearListRef.current?.scrollToIndex({
            index: idx,
            animated: false,
            viewPosition: 0.5,
          });
        }, 150);
      }
    }
  }, [view]);

  /* ── Build day grid ── */
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [
    ...Array(firstDay).fill(null),
    ...Array.from(
      {length: daysInMonth},
      (_, i) => new Date(year, month, i + 1),
    ),
  ];

  const fmt = d =>
    `${String(d.getDate()).padStart(2, '0')}/${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}/${d.getFullYear()}`;

  /* ════════════════════════════════════════════════
     STEP 1 — YEAR PICKER
  ════════════════════════════════════════════════ */
  if (view === VIEW.YEAR)
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={s.overlay}>
          <View style={s.card}>
            <View style={s.pickerHeader}>
              <Text style={s.pickerHeading}>Select Year</Text>
              <TouchableOpacity onPress={onClose} style={s.iconBtn}>
                <Text style={s.iconBtnTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.divider} />
            <FlatList
              ref={yearListRef}
              data={ALL_YEARS}
              keyExtractor={item => String(item)}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              style={{maxHeight: 320}}
              contentContainerStyle={{
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
              initialScrollIndex={Math.floor(ALL_YEARS.indexOf(year) / 3) * 3}
              getItemLayout={(_, i) => ({
                length: 54, // yearCell height (46) + margin top (4) + margin bottom (4)
                offset: 54 * Math.floor(i / 3),
                index: i,
              })}
              onScrollToIndexFailed={() => {}}
              renderItem={({item: y}) => {
                const sel = y === year;
                return (
                  <TouchableOpacity
                    style={[s.yearCell, sel && s.cellActive]}
                    onPress={() => {
                      setCurrentMonth(new Date(y, month, 1));
                      setView(VIEW.MONTH);
                    }}>
                    <Text style={[s.yearCellTxt, sel && s.cellActiveTxt]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    );

  /* ════════════════════════════════════════════════
     STEP 2 — MONTH PICKER
  ════════════════════════════════════════════════ */
  if (view === VIEW.MONTH)
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={s.overlay}>
          <View style={s.card}>
            <View style={s.pickerHeader}>
              <TouchableOpacity
                onPress={() => setView(VIEW.YEAR)}
                style={s.iconBtn}>
                <Text style={s.iconBtnTxt}>‹</Text>
              </TouchableOpacity>
              <Text style={s.pickerHeading}>{year}</Text>
              <TouchableOpacity onPress={onClose} style={s.iconBtn}>
                <Text style={s.iconBtnTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.divider} />
            <View style={s.monthGrid}>
              {MONTHS_SHORT.map((m, i) => {
                const sel = i === month;
                const futr =
                  year === today.getFullYear() && i > today.getMonth();
                return (
                  <TouchableOpacity
                    key={m}
                    disabled={futr}
                    style={[
                      s.monthCell,
                      sel && s.cellActive,
                      futr && s.cellDisabled,
                    ]}
                    onPress={() => {
                      setCurrentMonth(new Date(year, i, 1));
                      setView(VIEW.CALENDAR);
                    }}>
                    <Text
                      style={[
                        s.monthCellTxt,
                        sel && s.cellActiveTxt,
                        futr && s.txtDisabled,
                      ]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );

  /* ════════════════════════════════════════════════
     STEP 3 — DATE PICKER
  ════════════════════════════════════════════════ */
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.card} onPress={e => e.stopPropagation()}>
          {/* ─ Header ─ */}
          <View style={s.header}>
            <View>
              <TouchableOpacity
                onPress={() => setView(VIEW.MONTH)}
                style={s.headerMonthRow}>
                <Text style={s.headerMonth}>{MONTHS_LONG[month]}</Text>
                <Text style={s.headerArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setView(VIEW.YEAR)}>
                <Text style={s.headerYear}>{year}</Text>
              </TouchableOpacity>
            </View>

            <View style={s.navGroup}>
              <TouchableOpacity
                style={s.navBtn}
                onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                <Text style={s.navTxt}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.navBtn}
                onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                <Text style={s.navTxt}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.divider} />

          {/* ─ Week labels ─ */}
          <View style={s.weekRow}>
            {WEEK_DAYS.map((d, i) => (
              <Text
                key={i}
                style={[s.weekTxt, (i === 0 || i === 6) && s.weekEndTxt]}>
                {d}
              </Text>
            ))}
          </View>

          {/* ─ Day grid ─ */}
          <View style={s.grid}>
            {days.map((date, idx) => {
              if (!date) return <View key={idx} style={s.dayCell} />;
              const isFuture = date > today;
              const isToday = date.toDateString() === today.toDateString();
              const isWkEnd = date.getDay() === 0 || date.getDay() === 6;
              return (
                <TouchableOpacity
                  key={idx}
                  disabled={isFuture}
                  style={s.dayCell}
                  onPress={() => {
                    onSelect(fmt(date));
                    onClose();
                  }}>
                  <View style={[s.dayCircle, isToday && s.dayCircleToday]}>
                    <Text
                      style={[
                        s.dayTxt,
                        isWkEnd && !isToday && s.weekEndTxt,
                        isToday && s.dayTodayTxt,
                        isFuture && s.dayFutureTxt,
                      ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.divider} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.40)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: {width: 0, height: 10},
    elevation: 12,
  },
  divider: {height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB'},

  /* ─ Calendar Header ─ */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerMonthRow: {flexDirection: 'row', alignItems: 'center', gap: 3},
  headerMonth: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  headerArrow: {fontSize: 20, color: PURPLE, fontWeight: '700', marginTop: 1},
  headerYear: {
    fontSize: 13,
    fontWeight: '600',
    color: PURPLE,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  navGroup: {flexDirection: 'row', gap: 6},
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PURPLE_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTxt: {fontSize: 22, color: PURPLE, fontWeight: '500', lineHeight: 26},

  /* ─ Weekday row ─ */
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  weekTxt: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  weekEndTxt: {color: '#CBD5E1'},

  /* ─ Day grid ─ */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 12,
  },
  dayCell: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTxt: {fontSize: 14, fontWeight: '500', color: '#1F2937'},
  dayCircleToday: {backgroundColor: PURPLE},
  dayTodayTxt: {color: '#FFFFFF', fontWeight: '700'},
  dayFutureTxt: {color: '#D1D5DB'},

  /* ─ Shared picker header ─ */
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  pickerHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnTxt: {fontSize: 13, color: '#6B7280', fontWeight: '600'},

  /* ─ Year picker ─ */
  yearCell: {
    flex: 1,
    height: 46,
    margin: 4,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearCellTxt: {fontSize: 14, fontWeight: '500', color: '#374151'},

  /* ─ Month picker ─ */
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
    paddingTop: 16,
    paddingBottom: 20,
  },
  monthCell: {
    width: '30%',
    margin: '1.66%',
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  monthCellTxt: {fontSize: 14, fontWeight: '500', color: '#374151'},

  /* ─ Shared active / disabled ─ */
  cellActive: {backgroundColor: PURPLE},
  cellActiveTxt: {color: '#FFFFFF', fontWeight: '700'},
  cellDisabled: {opacity: 0.32},
  txtDisabled: {color: '#9CA3AF'},
});
