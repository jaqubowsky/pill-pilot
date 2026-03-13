"use client";

import { useRouter } from "next/navigation";

export function useProtocolSection() {
	const router = useRouter();

	function handleAddProtocol() {
		router.push("/protocol/new");
	}

	return { handleAddProtocol };
}
