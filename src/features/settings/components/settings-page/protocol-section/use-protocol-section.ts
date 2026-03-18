"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useProtocolSection(hasProcessing: boolean) {
	const router = useRouter();

	useEffect(() => {
		if (!hasProcessing) return;

		const interval = setInterval(() => {
			router.refresh();
		}, 5000);

		return () => clearInterval(interval);
	}, [hasProcessing, router]);

	function handleAddProtocol() {
		router.push("/protocol/new");
	}

	return { handleAddProtocol };
}
