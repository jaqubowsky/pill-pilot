"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function useProtocolName() {
	const t = useTranslations();
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);

	function validate(): boolean {
		setError(null);
		if (!name.trim()) {
			setError(t("protocolWizard.manual.protocolNameRequired"));
			return false;
		}
		return true;
	}

	return { name, setName, error, validate };
}
