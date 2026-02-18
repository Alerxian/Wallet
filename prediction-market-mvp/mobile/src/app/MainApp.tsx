import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppController } from "../hooks/useAppController";
import { DESIGN } from "../theme/design";
import { HeaderBar } from "../components/shell/HeaderBar";
import { BottomDock } from "../components/shell/BottomDock";
import { MarketsTab } from "../screens/MarketsTab";
import { PortfolioTab } from "../screens/PortfolioTab";
import { ActivityTab } from "../screens/ActivityTab";
import { SettingsTab } from "../screens/SettingsTab";

export default function MainApp() {
  const app = useAppController();

  const renderTab = () => {
    if (app.tab === "MARKETS") {
      return (
        <MarketsTab
          markets={app.markets}
          loading={app.marketLoading}
          selectedId={app.selectedMarketId}
          detail={app.marketDetail}
          detailLoading={app.detailLoading}
          amount={app.tradeAmount}
          side={app.tradeSide}
          sending={app.walletSending}
          onAmount={app.setTradeAmount}
          onSide={app.setTradeSide}
          onSelect={app.setMarketId}
          onRefresh={() => void app.loadMarkets()}
          onTrade={(action) => void app.executeTrade(action)}
        />
      );
    }

    if (app.tab === "PORTFOLIO") {
      return <PortfolioTab authed={app.isAuthenticated} loading={app.positionsLoading} rows={app.positions} onRefresh={() => void app.loadPositions()} />;
    }

    if (app.tab === "ACTIVITY") {
      return <ActivityTab authed={app.isAuthenticated} loading={app.historyLoading} rows={app.combinedActivity} onRefresh={() => void app.loadHistory()} />;
    }

    return (
      <SettingsTab
        apiBase={app.apiBase}
        authed={app.isAuthenticated}
        authExpiresAt={app.authExpiresAt}
        connected={app.isWalletConnected}
        clientReady={app.walletClientReady}
        phaseText={app.phaseText}
        recovering={app.recoveringSession}
        relay={app.walletRelay}
        walletError={app.walletError}
        errors={app.errors}
        connecting={app.walletConnecting}
        onConnect={() => void app.connectWallet()}
        onClear={app.disconnectWallet}
      />
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <HeaderBar
          walletTag={app.walletTag}
          phase={app.phaseText}
          connected={app.isWalletConnected}
          ready={app.walletClientReady}
          connecting={app.walletConnecting}
          onConnect={() => void app.connectWallet()}
          onDisconnect={app.disconnectWallet}
        />

        {app.errors[0] ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>Error - {app.errors[0].scope}: {app.errors[0].message}</Text>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.content}>{renderTab()}</ScrollView>
        <BottomDock
          active={app.tab}
          onTab={(tab) => {
            app.setMarketId(null);
            app.setTab(tab);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: DESIGN.color.bg,
  },
  errorBanner: {
    backgroundColor: "#5C2B2A",
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.color.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    color: "#FFDCD8",
    fontSize: 11,
  },
  content: {
    padding: 14,
    paddingBottom: 24,
  },
});
