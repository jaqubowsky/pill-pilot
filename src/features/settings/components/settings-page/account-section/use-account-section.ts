"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/shared/lib/auth-client";

export function useAccountSection() {
	const router = useRouter();

	async function handleSignOut() {
		await authClient.signOut();
		router.push("/login");
	}

	return { handleSignOut };
}
