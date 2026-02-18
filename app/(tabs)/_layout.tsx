import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Bean } from "lucide-react-native";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "home" : "home-outline"}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "내 레시피",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "book" : "book-outline"}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          href: null,
          title: "이벤트",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "calendar" : "calendar-outline"}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="roasteries"
        options={{
          href: null,
          title: "로스터리",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "cafe" : "cafe-outline"}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="beans"
        options={{
          title: "내 원두",
          tabBarIcon: ({ color, focused }) => (
            <Bean
              color={color}
              size={24}
              strokeWidth={focused ? 2.5 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              color={color}
              name={focused ? "person" : "person-outline"}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
