import React, { useState, useEffect, useMemo } from "react";
import { StyleSheet, TouchableOpacity, View, Dimensions, ScrollView } from "react-native";
import { Menu, Text, TextInput, Button, Dialog, Portal, Checkbox } from "react-native-paper";
import type { DashboardRecord } from "../hooks/useDashboard";
import { useLanguage } from "../context/LanguageContext";
import { formatMoney } from "../utils/constants";

type PaymentFilter = "all" | "cash" | "card";
type StatusFilterValue = "all" | "paid" | "unpaid" | "finished" | "unfinished";
type StatusFilter = Set<StatusFilterValue>;

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

// Screen dimensions will be checked dynamically in component

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
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });
  const [modalVisible, setModalVisible] = useState(false);
  
  // Temporary filter states for modal
  const [tempWasherFilter, setTempWasherFilter] = useState(washerFilter);
  const [tempPaymentFilter, setTempPaymentFilter] = useState(paymentFilter);
  const [tempStatusFilter, setTempStatusFilter] = useState<StatusFilter>(new Set(statusFilter));
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

  // Sync temp states when modal opens
  useEffect(() => {
    if (modalVisible) {
      setTempWasherFilter(washerFilter);
      setTempPaymentFilter(paymentFilter);
      setTempStatusFilter(new Set(statusFilter));
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [modalVisible, washerFilter, paymentFilter, statusFilter, startDate, endDate]);

  const isMobile = screenDimensions.width < 600;
  const isMobileLandscape = isMobile && screenDimensions.width > screenDimensions.height;
  const isTablet = screenDimensions.width >= 600 && screenDimensions.width < 1024;
  
  // Create responsive styles - recalculate when modal opens to ensure landscape detection
  const styles = useMemo(() => {
    // Re-check dimensions when creating styles, especially for modal
    const currentIsMobile = screenDimensions.width < 600;
    const currentIsMobileLandscape = currentIsMobile && screenDimensions.width > screenDimensions.height;
    return createStyles(screenDimensions.width, screenDimensions.height, currentIsMobileLandscape);
  }, [screenDimensions.width, screenDimensions.height, modalVisible]);

  const handleModalOK = () => {
    setWasherFilter(tempWasherFilter);
    setPaymentFilter(tempPaymentFilter);
    setStatusFilter(new Set(tempStatusFilter));
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

    // For landscape modal, use 2-row layout - recalculate landscape mode
    const currentIsMobile = screenDimensions.width < 600;
    const currentIsMobileLandscape = currentIsMobile && screenDimensions.width > screenDimensions.height;
    
    if (isModal && currentIsMobileLandscape) {
      return (
        <View style={styles.modalFilterRowLandscape} key={componentKey}>
          {/* First Row */}
          <View style={styles.modalFilterRowLandscapeRow}>
            <View style={styles.modalFilterColumnLandscape}>
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
            <View style={styles.modalFilterColumnLandscape}>
              <Text variant="labelSmall" style={styles.filterLabel}>
                {t("filters.paymentMethod")}
              </Text>
              <PaymentMethodSelect
                key={`payment-${componentKey}`}
                selected={currentPaymentFilter}
                onSelect={setCurrentPaymentFilter}
              />
            </View>
            <View style={styles.modalFilterColumnLandscape}>
              <Text variant="labelSmall" style={styles.filterLabel}>
                {t("filters.washStatus")}
              </Text>
              <WashStatusSelect
                key={`status-${componentKey}`}
                selected={currentStatusFilter}
                onSelect={setCurrentStatusFilter}
              />
            </View>
          </View>
          {/* Second Row */}
          <View style={styles.modalFilterRowLandscapeRow}>
            <View style={styles.modalFilterColumnLandscape}>
              <Text variant="labelSmall" style={styles.filterLabel}>
                {t("records.startDate")}
              </Text>
              <TextInput
                mode="outlined"
                value={currentStartDate}
                onChangeText={setCurrentStartDate}
                style={styles.dateInputLandscape}
              />
            </View>
            <View style={styles.modalFilterColumnLandscape}>
              <Text variant="labelSmall" style={styles.filterLabel}>
                {t("records.endDate")}
              </Text>
              <TextInput
                mode="outlined"
                value={currentEndDate}
                onChangeText={setCurrentEndDate}
                style={styles.dateInputLandscape}
              />
            </View>
          </View>
        </View>
      );
    }

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
          {isMobile || isTablet ? (
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
        <Dialog 
          visible={modalVisible} 
          onDismiss={handleModalDismiss}
          style={styles.modalDialog}
        >
          <Dialog.Title>{t("filters.title")}</Dialog.Title>
          {(() => {
            // Recalculate landscape mode when modal renders
            const currentIsMobile = screenDimensions.width < 600;
            const currentIsMobileLandscape = currentIsMobile && screenDimensions.width > screenDimensions.height;
            
            if (currentIsMobileLandscape) {
              return (
                <Dialog.Content style={styles.modalContentLandscape}>
                  <View style={styles.modalFiltersContainer} key={`modal-content-${language}-${modalVisible}`}>
                    {renderFilters(true)}
                  </View>
                </Dialog.Content>
              );
            } else {
              return (
                <Dialog.ScrollArea style={styles.modalScrollArea}>
                  <ScrollView 
                    contentContainerStyle={styles.modalScrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <View style={styles.modalFiltersContainer} key={`modal-content-${language}-${modalVisible}`}>
                      {renderFilters(true)}
                    </View>
                  </ScrollView>
                </Dialog.ScrollArea>
              );
            }
          })()}
          <Dialog.Actions style={styles.modalActions}>
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
  const [screenWidth, setScreenWidth] = React.useState(Dimensions.get("window").width);
  const anchorRef = React.useRef<View>(null);
  const [anchorPosition, setAnchorPosition] = React.useState({ x: 0, y: 0 });
  
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);
  
  const isMobile = screenWidth < 600;
  const filterInputStyle = React.useMemo(() => StyleSheet.create({
    input: {
      backgroundColor: "#FAFAFA",
      height: isMobile ? 44 : 36,
      maxWidth: isMobile ? "100%" : 190,
    },
  }), [isMobile]).input;

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
            style={filterInputStyle}
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
        <View style={staticStyles.menuContent}>
          <TextInput
            mode="flat"
            placeholder={t("newRecord.searchPlaceholder")}
            value={search}
            onChangeText={setSearch}
            style={staticStyles.searchInput}
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
  const [screenWidth, setScreenWidth] = React.useState(Dimensions.get("window").width);
  const anchorRef = React.useRef<View>(null);
  const [anchorPosition, setAnchorPosition] = React.useState({ x: 0, y: 0 });
  
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);
  
  const isMobile = screenWidth < 600;
  const filterInputStyle = React.useMemo(() => StyleSheet.create({
    input: {
      backgroundColor: "#FAFAFA",
      height: isMobile ? 44 : 36,
      maxWidth: isMobile ? "100%" : 190,
    },
  }), [isMobile]).input;

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
            style={filterInputStyle}
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
  const [screenWidth, setScreenWidth] = React.useState(Dimensions.get("window").width);
  const anchorRef = React.useRef<View>(null);
  const [anchorPosition, setAnchorPosition] = React.useState({ x: 0, y: 0 });
  
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);
  
  const isMobile = screenWidth < 600;
  const filterInputStyle = React.useMemo(() => StyleSheet.create({
    input: {
      backgroundColor: "#FAFAFA",
      height: isMobile ? 44 : 36,
      maxWidth: isMobile ? "100%" : 190,
    },
  }), [isMobile]).input;

  const options: { value: StatusFilterValue; label: string }[] = [
    { value: "all", label: t("filters.all") },
    { value: "paid", label: t("filters.paid") },
    { value: "unpaid", label: t("filters.unpaid") },
    { value: "finished", label: t("filters.finished") },
    { value: "unfinished", label: t("filters.unfinished") },
  ];

  const getDisplayLabel = () => {
    if (selected.has("all") || selected.size === 0) {
      return t("filters.all");
    }
    const selectedLabels = options
      .filter((o) => selected.has(o.value))
      .map((o) => o.label);
    if (selectedLabels.length === 0) return t("filters.all");
    if (selectedLabels.length <= 2) {
      return selectedLabels.join(", ");
    }
    return `${selectedLabels.length} selected`;
  };

  const handleToggle = (value: StatusFilterValue) => {
    const newSet = new Set(selected);
    if (value === "all") {
      // If "all" is clicked, toggle it and clear others
      if (newSet.has("all")) {
        newSet.clear();
      } else {
        newSet.clear();
        newSet.add("all");
      }
    } else {
      // Remove "all" if any specific option is selected
      newSet.delete("all");
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      // If no specific options are selected, add "all"
      if (newSet.size === 0) {
        newSet.add("all");
      }
    }
    onSelect(newSet);
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
            value={getDisplayLabel()}
            editable={false}
            right={<TextInput.Icon icon="menu-down" />}
            style={filterInputStyle}
          />
        </TouchableOpacity>
      </View>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={anchorPosition}
        style={staticStyles.statusMenu}
      >
        <ScrollView style={staticStyles.statusMenuScroll}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={staticStyles.statusMenuItem}
              onPress={() => handleToggle(option.value)}
            >
              <Checkbox
                status={selected.has(option.value) ? "checked" : "unchecked"}
                onPress={() => handleToggle(option.value)}
              />
              <Text style={staticStyles.statusMenuLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Menu>
    </>
  );
}

// Static styles for nested components (don't need to be responsive)
const staticStyles = StyleSheet.create({
  menuContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxHeight: 260,
  },
  searchInput: {
    marginBottom: 4,
  },
  statusMenu: {
    maxHeight: 300,
  },
  statusMenuScroll: {
    maxHeight: 280,
  },
  statusMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusMenuLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
});

// Create styles function that uses screen width and height
const createStyles = (screenWidth: number, screenHeight: number, isMobileLandscape: boolean) => {
  const isMobile = screenWidth < 600;
  const isTablet = screenWidth >= 600 && screenWidth < 1024;
  
  return StyleSheet.create({
    container: {
      borderTopWidth: 1,
      borderTopColor: "#E0E0E0",
      paddingHorizontal: isMobile ? 12 : isTablet ? 20 : 36,
      paddingVertical: isMobile ? 12 : 16,
      marginHorizontal: isMobile ? 4 : 8,
      marginBottom: isMobile ? 4 : 8,
      backgroundColor: "#FFFFFF",
    },
    mainRow: {
      flexDirection: isMobile ? "column" : "row",
      justifyContent: "flex-start",
      alignItems: isMobile ? "stretch" : "flex-start",
      gap: isMobile ? 16 : isTablet ? 24 : 60,
      flexWrap: "wrap",
    },
    resultsBlock: {
      flexShrink: 0,
      flexDirection: "row",
      flexWrap: isMobile ? "wrap" : "nowrap",
      gap: isMobile ? 8 : 12,
      width: isMobile ? "100%" : "auto",
    },
    resultItem: {
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      flex: isMobile ? 1 : 0,
      minWidth: isMobile ? "45%" : 124,
    },
    resultLabel: {
      fontSize: isMobile ? 12 : isTablet ? 14 : 16,
      fontWeight: "500",
      color: "#424242",
    },
    resultBox: {
      backgroundColor: "#F5F5F5",
      borderWidth: 1,
      borderColor: "#E0E0E0",
      borderRadius: 4,
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 6 : 8,
      minWidth: isMobile ? "100%" : 124,
      alignItems: "center",
    },
    resultValue: {
      fontSize: isMobile ? 14 : isTablet ? 15 : 16,
      fontWeight: "600",
      color: "#2F80ED",
    },
    filtersBlock: {
      flexShrink: 1,
      flexGrow: isMobile ? 0 : 1,
      alignItems: isMobile ? "stretch" : "flex-end",
      width: isMobile ? "100%" : "auto",
    },
    filterRow: {
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? 12 : isTablet ? 8 : 10,
      alignItems: isMobile ? "stretch" : "flex-end",
      flexWrap: "wrap",
      justifyContent: isMobile ? "flex-start" : "flex-end",
    },
    dateFieldSmall: {
      width: isMobile ? "100%" : isTablet ? 140 : 150,
    },
    dateInput: {
      backgroundColor: "#FAFAFA",
      height: isMobile ? 44 : 36,
    },
    filterColumn: {
      flex: isMobile ? 0 : 1,
      minWidth: isMobile ? "100%" : 120,
      width: isMobile ? "100%" : undefined,
    },
    filterColumnWasher: {
      flex: isMobile ? 0 : 0.8,
      minWidth: isMobile ? "100%" : 100,
      width: isMobile ? "100%" : undefined,
    },
    filterLabel: {
      marginBottom: isMobile ? 6 : 4,
      color: "#757575",
      fontSize: isMobile ? 12 : undefined,
    },
    filterInput: {
      backgroundColor: "#FAFAFA",
      height: isMobile ? 44 : 36,
      maxWidth: isMobile ? "100%" : 190,
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
      alignSelf: isMobile ? "stretch" : "flex-end",
      width: isMobile ? "100%" : "auto",
    },
    modalFiltersContainer: {
      paddingVertical: 8,
    },
    modalFilterRow: {
      flexDirection: "column",
      gap: isMobile ? 72 : 16,
      alignItems: "stretch",
      paddingBottom: 0,
      width: "100%",
    },
    modalFilterRowLandscape: {
      flexDirection: "column",
      gap: 12,
      alignItems: "stretch",
      width: "100%",
    },
    modalFilterRowLandscapeRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
      width: "100%",
    },
    modalFilterColumnLandscape: {
      flex: 1,
      minWidth: 0,
    },
    modalDialog: {
      maxWidth: isMobileLandscape ? screenWidth * 0.95 : undefined,
      margin: isMobileLandscape ? 8 : isMobile ? 12 : 24,
      maxHeight: isMobileLandscape ? screenHeight * 0.7 : isMobile ? screenHeight * 0.9 : undefined,
    },
    modalContentLandscape: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      maxHeight: screenHeight * 0.4,
    },
    modalScrollArea: {
      maxHeight: isMobile ? screenHeight * 0.6 : undefined,
      paddingHorizontal: 0,
    },
    modalScrollContent: {
      paddingHorizontal: 24,
      paddingVertical: 8,
    },
    modalActions: {
      paddingHorizontal: 8,
      paddingBottom: 8,
      minHeight: 52,
      borderTopWidth: 1,
      borderTopColor: "#E0E0E0",
    },
    dateInputLandscape: {
      backgroundColor: "#FAFAFA",
      height: 36,
    },
  });
};


