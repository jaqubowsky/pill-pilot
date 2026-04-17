"use client";

import { Copy, Link, Share2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { useShareButton } from "./use-share-button";

type ShareButtonProps = {
	protocolId: string;
	initialShareToken: string | null;
};

export function ShareButton({ protocolId, initialShareToken }: ShareButtonProps) {
	const t = useTranslations();
	const { shareToken, isGenerating, isRevoking, handleGenerate, handleRevoke, handleCopy } =
		useShareButton({ protocolId, initialShareToken });

	if (!shareToken) {
		return (
			<Button
				variant="outline"
				className="w-full"
				onClick={handleGenerate}
				disabled={isGenerating}
			>
				<Share2 className="size-4 mr-sm" />
				{t("settings.share.generate")}
			</Button>
		);
	}

	return (
		<div className="flex flex-col gap-sm">
			<div className="flex items-center gap-sm bg-surface border border-edge-subtle rounded-lg px-sm py-xs">
				<Link className="size-3.5 text-content-faint shrink-0" />
				<span className="text-xs text-content-muted truncate flex-1">
					{`${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}`}
				</span>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleCopy}
					className="text-content-faint shrink-0"
				>
					<Copy className="size-3.5" />
				</Button>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onClick={handleRevoke}
				disabled={isRevoking}
				className="text-destructive hover:text-destructive w-full"
			>
				<X className="size-3.5 mr-xs" />
				{t("settings.share.revoke")}
			</Button>
		</div>
	);
}
