"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PostAuthRedirect() {
	const router = useRouter();

	useEffect(() => {
		const destination = localStorage.getItem("post_auth_redirect");
		if (!destination) return;
		localStorage.removeItem("post_auth_redirect");
		router.replace(destination);
	}, [router]);

	return null;
}
