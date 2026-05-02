import FontAwesome from "@expo/vector-icons/FontAwesome";
import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <NativeTabs
      backgroundColor={Platform.OS === "ios" ? null : colors.background}
      blurEffect={Platform.OS === "ios" ? "systemChromeMaterial" : undefined}
      minimizeBehavior={Platform.OS === "ios" ? "automatic" : undefined}
      iconColor={{ default: colors.tabIconDefault, selected: colors.tint }}
      labelStyle={{
        default: { fontSize: 11, fontWeight: "600" },
        selected: { fontSize: 11, fontWeight: "700" },
      }}
      rippleColor={Platform.OS === "android" ? "rgba(124,58,237,0.18)" : undefined}
      indicatorColor={Platform.OS === "android" ? colors.tint : undefined}
      disableTransparentOnScrollEdge={false}
      shadowColor={Platform.OS === "ios" ? "rgba(0,0,0,0.18)" : undefined}
    >
      <NativeTabs.Trigger name="index">
        <Icon src={<VectorIcon family={FontAwesome} name="home" />} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <Icon src={<VectorIcon family={FontAwesome} name="users" />} />
        <Label>Discover</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon src={<VectorIcon family={FontAwesome} name="user" />} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="chat">
        <Icon src={<VectorIcon family={FontAwesome} name="comments" />} />
        <Label>Chat</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
