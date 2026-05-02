import { useRouter } from "expo-router";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
    label?: string;
    href?: string;
    style?: StyleProp<ViewStyle>;
};

export function SectionBackButton({ label = "← Chats", href = "/(tabs)/chat", style }: Props) {
    const router = useRouter();

    return (
        <Pressable style={[styles.button, style]} onPress={() => router.push(href as any)}>
            <Text style={styles.text}>{label}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        alignSelf: "flex-start",
        paddingVertical: 8,
        paddingHorizontal: 2,
    },
    text: {
        color: "#c7c7cc",
        fontSize: 14,
        fontWeight: "600",
    },
});