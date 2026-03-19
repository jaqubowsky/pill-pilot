import { useTranslations } from "next-intl";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

type CurrencyFieldProps = {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
};

export function CurrencyField({ id, label, value, onChange }: CurrencyFieldProps) {
	const t = useTranslations("common");

	return (
		<div className="flex flex-col gap-xs">
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				<Input
					id={id}
					type="number"
					inputMode="decimal"
					min={0}
					step={0.01}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="0.00"
					className="pr-8"
				/>
				<span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-content-muted pointer-events-none">
					{t("currency")}
				</span>
			</div>
		</div>
	);
}
