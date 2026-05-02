import { useLocalSearchParams } from "expo-router";

import { MobileProfileDetail } from "@/components/MobileProfileDetail";

export default function UserProfile() {
    const params = useLocalSearchParams<{ id?: string; from?: string }>();

    return <MobileProfileDetail id={params.id ?? ""} from={params.from} />;
}