import { useRoastery } from "@/hooks/useRoasteries";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const APP_BUNDLE_ID = "com.bangbangminseok.coffimerapp";

export default function RoasteryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: roastery, isLoading } = useRoastery(id);

  const openNaverMap = async () => {
    if (!roastery) return;

    const encodedName = encodeURIComponent(roastery.name);

    if (roastery.latitude && roastery.longitude) {
      const appUrl = `nmap://place?lat=${roastery.latitude}&lng=${roastery.longitude}&name=${encodedName}&appname=${APP_BUNDLE_ID}`;
      const webUrl = `https://map.naver.com/v5/search/${encodedName}`;

      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        Linking.openURL(appUrl);
      } else {
        Linking.openURL(webUrl);
      }
    } else {
      const webUrl = `https://map.naver.com/v5/search/${encodeURIComponent(roastery.address)}`;
      Linking.openURL(webUrl);
    }
  };

  const openKakaoMap = async () => {
    if (!roastery) return;

    if (roastery.latitude && roastery.longitude) {
      const appUrl = `kakaomap://look?p=${roastery.latitude},${roastery.longitude}`;
      const webUrl = `https://map.kakao.com/link/map/${encodeURIComponent(roastery.name)},${roastery.latitude},${roastery.longitude}`;

      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        Linking.openURL(appUrl);
      } else {
        Linking.openURL(webUrl);
      }
    } else {
      const webUrl = `https://map.kakao.com/link/search/${encodeURIComponent(roastery.address)}`;
      Linking.openURL(webUrl);
    }
  };

  const openGoogleMap = async () => {
    if (!roastery) return;

    if (roastery.latitude && roastery.longitude) {
      const iosAppUrl = `comgooglemaps://?q=${roastery.latitude},${roastery.longitude}`;
      const androidAppUrl = `geo:${roastery.latitude},${roastery.longitude}?q=${roastery.latitude},${roastery.longitude}`;
      const webUrl = `https://maps.google.com/?q=${roastery.latitude},${roastery.longitude}`;

      const appUrl = Platform.OS === "ios" ? iosAppUrl : androidAppUrl;
      const canOpen = await Linking.canOpenURL(appUrl);

      if (canOpen) {
        Linking.openURL(appUrl);
      } else {
        Linking.openURL(webUrl);
      }
    } else {
      const webUrl = `https://maps.google.com/?q=${encodeURIComponent(roastery.address)}`;
      Linking.openURL(webUrl);
    }
  };

  const handleOpenOnlineShop = () => {
    if (roastery?.online_shop_url) {
      Linking.openURL(roastery.online_shop_url);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>로스터리 상세</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#A56A49" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!roastery) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>로스터리 상세</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>로스터리를 찾을 수 없습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#1C1C1E" name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>로스터리 상세</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          {roastery.featured_image ? (
            <Image
              source={{ uri: roastery.featured_image }}
              style={styles.heroImage}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons color="#A56A49" name="cafe" size={64} />
            </View>
          )}
          <View style={styles.heroOverlay} />
          <Text style={styles.heroTitle}>{roastery.name}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>소개</Text>
            <Text style={styles.description}>{roastery.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>위치</Text>
            <View style={styles.addressInfo}>
              <Ionicons color="#A56A49" name="location-outline" size={20} />
              <Text style={styles.addressText}>{roastery.address}</Text>
            </View>
            <View style={styles.mapButtonsContainer}>
              <Pressable onPress={openNaverMap} style={styles.mapButton}>
                <Text style={styles.mapButtonText}>네이버 지도</Text>
              </Pressable>
              <Pressable onPress={openKakaoMap} style={styles.mapButton}>
                <Text style={styles.mapButtonText}>카카오맵</Text>
              </Pressable>
              <Pressable onPress={openGoogleMap} style={styles.mapButton}>
                <Text style={styles.mapButtonText}>구글 지도</Text>
              </Pressable>
            </View>
          </View>

          {roastery.online_shop_url && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>스토어</Text>
              <Pressable
                onPress={handleOpenOnlineShop}
                style={styles.onlineShopButton}
              >
                <Ionicons color="#FFFFFF" name="cart-outline" size={20} />
                <Text style={styles.onlineShopButtonText}>스토어 방문하기</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F7F8FA",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
  heroContainer: {
    position: "relative",
    height: 256,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "transparent",
    // Linear gradient effect using multiple views would be better, but for simplicity:
  },
  heroTitle: {
    position: "absolute",
    bottom: 24,
    left: 24,
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    padding: 24,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  description: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
  },
  addressInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  addressText: {
    fontSize: 15,
    color: "#4B5563",
    flex: 1,
    lineHeight: 22,
  },
  mapButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  mapButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A56A49",
  },
  onlineShopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#A56A49",
    paddingVertical: 14,
    borderRadius: 12,
  },
  onlineShopButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
