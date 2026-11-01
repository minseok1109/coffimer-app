import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Bean } from "lucide-react-native";
import type { ColorValue, PressableProps } from "react-native";
import { Pressable } from "react-native";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIoniconProps {
  color: ColorValue;
  focused: boolean;
  filled: IoniconName;
  outline: IoniconName;
}

// expo-router types tab colors as ColorValue; the tab bar only passes string
// tints here, and Ionicons accepts string | OpaqueColorValue.
const TabIonicon = ({ color, focused, filled, outline }: TabIoniconProps) => (
  <Ionicons
    color={color as string}
    name={focused ? filled : outline}
    size={24}
  />
);

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarButton: (props: PressableProps) => (
          <Pressable {...props} android_ripple={{ color: "transparent" }} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: (props) => (
            <TabIonicon {...props} filled="home" outline="home-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "내 레시피",
          tabBarIcon: (props) => (
            <TabIonicon {...props} filled="book" outline="book-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          href: null,
          title: "이벤트",
          tabBarIcon: (props) => (
            <TabIonicon
              {...props}
              filled="calendar"
              outline="calendar-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="roasteries"
        options={{
          href: null,
          title: "로스터리",
          tabBarIcon: (props) => (
            <TabIonicon {...props} filled="cafe" outline="cafe-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="beans"
        options={{
          title: "내 원두",
          tabBarIcon: ({ color, focused }) => (
            <Bean color={color} size={24} strokeWidth={focused ? 2.5 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: (props) => (
            <TabIonicon {...props} filled="person" outline="person-outline" />
          ),
        }}
      />
    </Tabs>
  );
}
