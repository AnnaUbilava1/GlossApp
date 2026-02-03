import React, { useState, useEffect } from "react";
import { StyleSheet, TouchableOpacity, View, Dimensions } from "react-native";
import { Menu, Text, TextInput, Button, Dialog, Portal } from "react-native-paper";
import type { DashboardRecord } from "../hooks/useDashboard";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney } from "../utils/constants";

type PaymentFilter = "all" | "cash" | "card";
type StatusFilter = "all" | "unfinished" | "finished_unpaid" | "paid" | "unfinished_paid";

type Props = {
  records: DashboardRecord[];
  washers: { id: number; username: string; name?: string | null }[];
  startDate: string;
  endDate: string;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  washerFilter: string;
  setWasherFilter: (value: string) => void;
  paymentFilter: PaymentFilter;
  setPaymentFilter: (value: PaymentFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
};

const SCREEN_WIDTH_BREAKPOINT = 1260;

export default function DashboardSummary({
  records,
  washers,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  washerFilter,
  setWasherFilter,
  paymentFilter,
  setPaymentFilter,
  statusFilter,
  setStatusFilter,
}: Props) {
  const { t, language } = useLanguage();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Temporary filter states for modal
  const [tempWasherFilter, setTempWasherFilter] = useState(washerFilter);
  const [tempPaymentFilter, setTempPaymentFilter] = useState(paymentFilter);
  const [tempStatusFilter, setTempStatusFilter] = useState(statusFilter);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Sync temp states when modal opens
  useEffect(() => {
    if (modalVisible) {
      setTempWasherFilter(washerFilter);
      setTempPaymentFilter(paymentFilter);
      setTempStatusFilter(statusFilter);
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [modalVisible, washerFilter, paymentFilter, statusFilter, startDate, endDate]);

  const isSmallScreen = screenWidth < SCREEN_WIDTH_BREAKPOINT;

  const handleModalOK = () => {
    setWasherFilter(tempWasherFilter);
    setPaymentFilter(tempPaymentFilter);
    setStatusFilter(tempStatusFilter);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setModalVisible(false);
  };

  const handleModalDismiss = () => {
    setModalVisible(false);
  };

  const totalRecords = records.length;
  let realization = 0;
  let washersMoney = 0;

  for (const r of records) {
    // Realization: sum of all actual prices regardless of payment/finish status
    realization += r.price;
    // Washer's money is calculated from all records, regardless of payment/finish status
    washersMoney += r.washerCut ?? 0;
  }

  const revenue = realization - washersMoney;

  const renderFilters = (isModal: boolean = false) => {
    const currentWasherFilter = isModal ? tempWasherFilter : washerFilter;
    const currentPaymentFilter = isModal ? tempPaymentFilter : paymentFilter;
    const currentStatusFilter = isModal ? tempStatusFilter : statusFilter;
    const currentStartDate = isModal ? tempStartDate : startDate;
    const currentEndDate = isModal ? tempEndDate : endDate;
    const setCurrentWasherFilter = isModal ? setTempWasherFilter : setWasherFilter;
    const setCurrentPaymentFilter = isModal ? setTempPaymentFilter : setPaymentFilter;
    const setCurrentStatusFilter = isModal ? setTempStatusFilter : setStatusFilter;
    const setCurrentStartDate = isModal ? setTempStartDate : setStartDate;
    const setCurrentEndDate = isModal ? setTempEndDate : setEndDate;

    // Use key to force remount when modal opens or language changes
    const componentKey = isModal ? `modal-${language}-${modalVisible}` : `inline-${language}`;

    return (
      <View style={isModal ? styles.modalFilterRow : styles.filterRow} key={componentKey}>
        <View style={styles.filterColumnWasher}>
          <Text variant="labelSmall" style={styles.filterLabel}>
            {t("filters.washer")}
          </Text>
          <WasherSelect
            key={`washer-${componentKey}`}
            washers={washers}
            selectedUsername={currentWasherFilter}
            onChangeUsername={setCurrentWasherFilter}
          />
        </View>
        <View style={styles.filterColumn}>
          <Text variant="labelSmall" style={styles.filterLabel}>
            {t("filters.paymentMethod")}
          </Text>
          <PaymentMethodSelect
            key={`payment-${componentKey}`}
            selected={currentPaymentFilter}
            onSelect={setCurrentPaymentFilter}
          />
        </View>
        <View style={styles.filterColumn}>
          <Text variant="labelSmall" style={styles.filterLabel}>
            {t("filters.washStatus")}
          </Text>
          <WashStatusSelect
            key={`status-${componentKey}`}
            selected={currentStatusFilter}
            onSelect={setCurrentStatusFilter}
          />
        </View>
        <View style={styles.dateFieldSmall}>
          <Text variant="labelSmall" style={styles.filterLabel}>
            {t("records.startDate")}
          </Text>
          <TextInput
            mode="outlined"
            value={currentStartDate}
            onChangeText={setCurrentStartDate}
            style={styles.dateInput}
          />
        </View>
        <View style={styles.dateFieldSmall}>
          <Text variant="labelSmall" style={styles.filterLabel}>
            {t("records.endDate")}
          </Text>
          <TextInput
            mode="outlined"
            value={currentEndDate}
            onChangeText={setCurrentEndDate}
            style={styles.dateInput}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        {/* Results on the left */}
        <View style={styles.resultsBlock}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>{t("tabs.allRecords")}</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultValue}>{totalRecords}</Text>
            </View>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>{t("summary.realization")}</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultValue}>{formatMoney(realization)}</Text>
            </View>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>{t("summary.washersShare")}</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultValue}>{formatMoney(washersMoney)}</Text>
            </View>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>{t("summary.revenue")}</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultValue}>{formatMoney(revenue)}</Text>
            </View>
          </View>
        </View>

        {/* Filters on the right */}
        <View style={styles.filtersBlock}>
          {isSmallScreen ? (
            <Button
              mode="outlined"
              onPress={() => setModalVisible(true)}
              style={styles.filtersButton}
            >
              {t("filters.title")}
            </Button>
          ) : (
            renderFilters(false)
          )}
        </View>
      </View>

      {/* Filters Modal for small screens */}
      <Portal>
        <Dialog visible={modalVisible} onDismiss={handleModalDismiss}>
          <Dialog.Title>{t("filters.title")}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.modalFiltersContainer} key={`modal-content-${language}-${modalVisible}`}>
              {renderFilters(true)}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleModalDismiss}>{t("button.cancel")}</Button>
            <Button mode="contained" onPress={handleModalOK}>
              {t("button.ok")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

type WasherSelectProps = {
  washers: { id: number; username: string; name?: string | null }[];
  selectedUsername: string;
  onChangeUsername: (value: string) => void;
};

function WasherSelect({ washers, selectedUsername, onChangeUsername }: WasherSelectProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const anchorRef = React.useRef<View>(null);
  const [anchorPosition, setAnchorPosition] = React.useState({ x: 0, y: 0 });

  const filteredWashers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return washers;
    return washers.filter((w) =>
      w.username.toLowerCase().includes(q) ||
      (w.name ? w.name.toLowerCase().includes(q) : false)
    );
  }, [washers, search]);

  const allLabel = t("filters.all");
  const displayLabel = selectedUsername || allLabel;

  const handleSelect = (value: string) => {
    onChangeUsername(value);
    setSearch("");
    setVisible(false);
  };

  const handleOpen = () => {
    if (anchorRef.current) {
      anchorRef.current.measure((x, y, width, height, pageX, pageY) => {
        setAnchorPosition({ x: pageX, y: pageY + height });
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  };

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <TouchableOpacity
          onPress={handleOpen}
          activeOpacity={0.7}
        >
          <TextInput
            mode="outlined"
            value={displayLabel}
            placeholder={allLabel}
            editable={false}
            right={<TextInput.Icon icon="menu-down" />}
            style={styles.filterInput}
          />
        </TouchableOpacity>
      </View>
      <Menu
        visible={visible}
        onDismiss={() => {
          setVisible(false);
          setSearch("");
        }}
        anchor={anchorPosition}
      >
        <View style={styles.menuContent}>
          <TextInput
            mode="flat"
            placeholder={t("newRecord.searchPlaceholder")}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          <Menu.Item
            title={allLabel}
            onPress={() => handleSelect("")}
          />
          {filteredWashers.map((w) => (
            <Menu.Item
              key={w.id}
              title={w.username}
              onPress={() => handleSelect(w.username)}
            />
          ))}
        </View>
      </Menu>
    </>
  );
}

type PaymentMethodSelectProps = {
  selected: PaymentFilter;
  onSelect: (value: PaymentFilter) => void;
};

function PaymentMethodSelect({ selected, onSelect }: PaymentMethodSelectProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = React.useState(false);
  const anchorRef = React.useRef<View>(null);
  const [anchorPosition, setAnchorPosition] = React.useState({ x: 0, y: 0 });

  const options: { value: PaymentFilter; label: string }[] = [
    { value: "all", label: t("filters.all") },
    { value: "cash", label: t("filters.cash") },
    { value: "card", label: t("filters.card") },
  ];

  const displayLabel = options.find((o) => o.value === selected)?.label || t("filters.all");

  const handleSelect = (value: PaymentFilter) => {
    onSelect(value);
    setVisible(false);
  };

  const handleOpen = () => {
    if (anchorRef.current) {
      anchorRef.current.measure((x, y, width, height, pageX, pageY) => {
        setAnchorPosition({ x: pageX, y: pageY + height });
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  };

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <TouchableOpacity
          onPress={handleOpen}
          activeOpacity={0.7}
        >
          <TextInput
            mode="outlined"
            value={displayLabel}
            editable={false}
            right={<TextInput.Icon icon="menu-down" />}
            style={styles.filterInput}
          />
        </TouchableOpacity>
      </View>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={anchorPosition}
      >
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            title={option.label}
            onPress={() => handleSelect(option.value)}
          />
        ))}
      </Menu>
    </>
  );
}

type WashStatusSelectProps = {
  selected: StatusFilter;
  onSelect: (value: StatusFilter) => void;
};

function WashStatusSelect({ selected, onSelect }: WashStatusSelectProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = React.useState(false);
  const anchorRef = React.useRef<View>(null);
  const [anchorPosition, setAnchorPosition] = React.useState({ x: 0, y: 0 });

  const options: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("filters.all") },
    { value: "unfinished", label: "Unfinished" },
    { value: "finished_unpaid", label: "Finished unpaid" },
    { value: "paid", label: "Paid" },
    { value: "unfinished_paid", label: t("filters.unfinishedPaid") },
  ];

  const displayLabel = options.find((o) => o.value === selected)?.label || t("filters.all");

  const handleSelect = (value: StatusFilter) => {
    onSelect(value);
    setVisible(false);
  };

  const handleOpen = () => {
    if (anchorRef.current) {
      anchorRef.current.measure((x, y, width, height, pageX, pageY) => {
        setAnchorPosition({ x: pageX, y: pageY + height });
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  };

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <TouchableOpacity
          onPress={handleOpen}
          activeOpacity={0.7}
        >
          <TextInput
            mode="outlined"
            value={displayLabel}
            editable={false}
            right={<TextInput.Icon icon="menu-down" />}
            style={styles.filterInput}
          />
        </TouchableOpacity>
      </View>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={anchorPosition}
      >
        {options.map((option) => (
          <Menu.Item
            key={option.value}
            title={option.label}
            onPress={() => handleSelect(option.value)}
          />
        ))}
      </Menu>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingHorizontal: 36,
    paddingVertical: 16,
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 60,
    flexWrap: "nowrap",
  },
  resultsBlock: {
    flexShrink: 0,
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 12,
  },
  resultItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#424242",
  },
  resultBox: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 124,
    alignItems: "center",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2F80ED",
  },
  filtersBlock: {
    flexShrink: 1,
    flexGrow: 1,
    alignItems: "flex-end",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    flexWrap: "nowrap",
    justifyContent: "flex-end",
  },
  dateFieldSmall: {
    width: 150,
  },
  dateInput: {
    backgroundColor: "#FAFAFA",
    height: 36,
  },
  filterColumn: {
    flex: 1,
    minWidth: 120,
  },
  filterColumnWasher: {
    flex: 0.8,
    minWidth: 100,
  },
  filterLabel: {
    marginBottom: 4,
    color: "#757575",
  },
  filterInput: {
    backgroundColor: "#FAFAFA",
    height: 36,
    maxWidth: 190,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  menuContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxHeight: 260,
  },
  searchInput: {
    marginBottom: 4,
  },
  filtersButton: {
    alignSelf: "flex-end",
  },
  modalFiltersContainer: {
    paddingVertical: 8,
  },
  modalFilterRow: {
    flexDirection: "column",
    gap: 16,
    alignItems: "stretch",
  },
});

