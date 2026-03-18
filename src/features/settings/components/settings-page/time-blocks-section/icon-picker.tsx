"use client";

import { useTranslations } from "next-intl";
import { ICON_MAP } from "@/features/settings/lib/time-block-icons";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/components/ui/select";

const TIME_BLOCK_ICONS = Object.keys(ICON_MAP);

type IconPickerProps = {
	value: string;
	onValueChange: (value: string) => void;
};

export function IconPicker({ value, onValueChange }: IconPickerProps) {
	const t = useTranslations("timeBlock");
	const SelectedIcon = ICON_MAP[value];

	return (
		<Select
			value={value}
			onValueChange={(v) => {
				if (v !== null) onValueChange(v);
			}}
		>
			<SelectTrigger className="w-full bg-surface-sunken border-edge rounded-lg px-md py-sm text-base">
				<SelectValue placeholder={t("icon")}>
					{SelectedIcon && (
						<span className="flex items-center gap-sm">
							<SelectedIcon className="size-5 stroke-[1.5] text-content-muted" />
							{t(`icons.${value}`)}
						</span>
					)}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{TIME_BLOCK_ICONS.map((iconName) => {
					const Icon = ICON_MAP[iconName];
					return (
						<SelectItem key={iconName} value={iconName}>
							<span className="flex items-center gap-sm">
								<Icon className="size-5 stroke-[1.5] text-content-muted" />
								{t(`icons.${iconName}`)}
							</span>
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
}
