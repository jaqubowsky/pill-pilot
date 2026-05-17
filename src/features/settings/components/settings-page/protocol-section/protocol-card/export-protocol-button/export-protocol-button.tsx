"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { useExportProtocolButton } from "./use-export-protocol-button";

export function ExportProtocolButton({ protocolId }: { protocolId: string }) {
	const t = useTranslations("settings");
	const { pdfHref, excelHref } = useExportProtocolButton(protocolId);

	return (
		<Popover>
			<PopoverTrigger render={<Button variant="outline" className="w-full" />}>
				<Download className="mr-2 size-4" />
				{t("export.label")}
			</PopoverTrigger>
			<PopoverContent className="flex w-56 flex-col gap-2">
				<a href={pdfHref} download className="w-full">
					<Button variant="ghost" className="w-full justify-start">
						{t("export.pdf")}
					</Button>
				</a>
				<a href={excelHref} download className="w-full">
					<Button variant="ghost" className="w-full justify-start">
						{t("export.excel")}
					</Button>
				</a>
			</PopoverContent>
		</Popover>
	);
}
