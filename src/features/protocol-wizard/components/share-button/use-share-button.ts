"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { generateShareToken } from "../../api/actions/generate-share-token";
import { revokeShareToken } from "../../api/actions/revoke-share-token";

export function useShareButton({
	protocolId,
	initialShareToken,
}: {
	protocolId: string;
	initialShareToken: string | null;
}) {
	const t = useTranslations();
	const [shareToken, setShareToken] = useState<string | null>(initialShareToken);

	const { execute: execGenerate, isPending: isGenerating } = useAction(generateShareToken, {
		onSuccess: ({ data }) => {
			if (data?.shareToken) setShareToken(data.shareToken);
		},
		onError: () => toast.error(t("errors.generic")),
	});

	const { execute: execRevoke, isPending: isRevoking } = useAction(revokeShareToken, {
		onSuccess: () => setShareToken(null),
		onError: () => toast.error(t("errors.generic")),
	});

	function handleGenerate() {
		execGenerate({ protocolId });
	}

	function handleRevoke() {
		execRevoke({ protocolId });
	}

	function handleCopy() {
		if (!shareToken) return;
		const link = `${window.location.origin}/share/${shareToken}`;
		navigator.clipboard.writeText(link);
		toast.success(t("settings.share.linkCopied"));
	}

	return {
		shareToken,
		isGenerating,
		isRevoking,
		handleGenerate,
		handleRevoke,
		handleCopy,
	};
}
