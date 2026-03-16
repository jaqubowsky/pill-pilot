"use client";

import type * as React from "react";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";

type NumberInputDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	hint: string;
	inputMin?: number;
	placeholder?: string;
	unitLabel?: string;
	cancelLabel: string;
	submitLabel: string;
	isPending: boolean;
	value: string;
	onValueChange: (value: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	inputRef?: React.RefObject<HTMLInputElement | null>;
};

export function NumberInputDialog({
	open,
	onOpenChange,
	title,
	hint,
	inputMin,
	placeholder,
	cancelLabel,
	submitLabel,
	isPending,
	value,
	onValueChange,
	onSubmit,
	inputRef,
	unitLabel,
}: NumberInputDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="rounded-2xl p-lg shadow-xl bg-surface-raised"
			>
				<DialogHeader>
					<DialogTitle className="text-base font-semibold text-content">{title}</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit} className="flex flex-col gap-md">
					<div className="flex flex-col gap-xs">
						<p className="text-sm text-content-muted">{hint}</p>
						<div className="flex items-center gap-sm">
							<Input
								ref={inputRef}
								type="number"
								min={inputMin}
								step={1}
								value={value}
								onChange={(e) => onValueChange(e.target.value)}
								className="flex-1 bg-surface-sunken border-edge rounded-lg px-md py-sm text-base placeholder:text-content-faint focus-visible:border-brand-400 focus-visible:ring-focus-ring"
								placeholder={placeholder}
							/>
							{unitLabel && (
								<span className="text-sm text-content-muted shrink-0">{unitLabel}</span>
							)}
						</div>
					</div>
					<div className="flex gap-sm justify-end">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							{cancelLabel}
						</Button>
						<Button
							type="submit"
							variant="default"
							disabled={isPending || value === ""}
							className="bg-brand-500 text-content-inverse"
						>
							{submitLabel}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
