# Protocol Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add permanent share link per protocol: owner generates/revokes via Settings, recipient opens link, sees editable import form (AI supplement matching), saves as their own draft.

**Architecture:** Single `shareToken` column on `protocols`; `/share/[token]` protected route (inside `(app)`, outside `(main)`); `ProtocolFormBase` extracted from `ManualProtocolForm`; `ImportProtocolForm` reuses the base; `importSharedProtocol` action creates missing time blocks and stores draft with resolved supplement IDs.

**Tech Stack:** Next.js App Router, Drizzle ORM, next-safe-action, Vercel AI SDK + Anthropic (claude-haiku-4-5 for matching), @paralleldrive/cuid2, Vitest, Zod.

---

### Task 1: Schema — add shareToken to protocols

**Files:**
- Modify: `src/shared/db/schema.ts`

- [ ] **Step 1: Add column to protocols table**

In `src/shared/db/schema.ts`, find the `protocols` table and add after `startDate`:

```typescript
shareToken: text("share_token").unique(),
```

Full protocols table after edit:
```typescript
export const protocols = pgTable("protocols", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	parsedData: text("parsed_data"),
	status: protocolStatusEnum("status").notNull().default("draft"),
	startDate: date("start_date"),
	shareToken: text("share_token").unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 2: Generate migration**

```bash
pnpm drizzle-kit generate
```

Expected: new migration file created in `src/shared/db/migrations/`

- [ ] **Step 3: Apply migration**

```bash
pnpm drizzle-kit migrate
```

Expected: migration applied successfully

- [ ] **Step 4: Commit**

```bash
git add src/shared/db/schema.ts src/shared/db/migrations/
git commit -m "feat: add shareToken column to protocols table"
```

---

### Task 2: Repository — add findByShareToken

**Files:**
- Modify: `src/shared/repositories/protocol-repository.ts`

- [ ] **Step 1: Add method to interface**

Add to `IProtocolRepository`:
```typescript
findByShareToken(token: string): Promise<Protocol | null>;
```

- [ ] **Step 2: Add implementation**

Add to `ProtocolRepository` class:
```typescript
async findByShareToken(token: string): Promise<Protocol | null> {
	const rows = await db
		.select()
		.from(protocols)
		.where(eq(protocols.shareToken, token));
	return rows[0] ?? null;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -30
```

Expected: no type errors related to protocol-repository

- [ ] **Step 4: Commit**

```bash
git add src/shared/repositories/protocol-repository.ts
git commit -m "feat: add findByShareToken to protocol repository"
```

---

### Task 3: Refactor — extract ProtocolFormBase

**Files:**
- Create: `src/features/protocol-wizard/components/protocol-form-base/use-protocol-name.ts`
- Create: `src/features/protocol-wizard/components/protocol-form-base/use-supplement-sheet.ts`
- Create: `src/features/protocol-wizard/components/protocol-form-base/supplement-row.tsx`
- Create: `src/features/protocol-wizard/components/protocol-form-base/use-protocol-form-base.ts`
- Create: `src/features/protocol-wizard/components/protocol-form-base/protocol-form-base.tsx`
- Create: `src/features/protocol-wizard/components/protocol-form-base/index.ts`
- Modify: `src/features/protocol-wizard/components/manual-protocol-form/use-manual-protocol-form.ts`
- Modify: `src/features/protocol-wizard/components/manual-protocol-form/manual-protocol-form.tsx`
- Modify: `src/features/protocol-wizard/components/manual-protocol-form/index.ts`
- Delete (move): `src/features/protocol-wizard/components/manual-protocol-form/use-protocol-name.ts`
- Delete (move): `src/features/protocol-wizard/components/manual-protocol-form/use-supplement-sheet.ts`
- Delete (move): `src/features/protocol-wizard/components/manual-protocol-form/supplement-row.tsx`

- [ ] **Step 1: Create use-protocol-name.ts in protocol-form-base**

Create `src/features/protocol-wizard/components/protocol-form-base/use-protocol-name.ts`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function useProtocolName(initialName = "") {
	const t = useTranslations();
	const [name, setName] = useState(initialName);
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
```

- [ ] **Step 2: Create use-supplement-sheet.ts in protocol-form-base**

Create `src/features/protocol-wizard/components/protocol-form-base/use-supplement-sheet.ts`:

```typescript
"use client";

import { useState } from "react";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { useSheetState } from "../../hooks/use-sheet-state";
import type { IdentifiedSupplement } from "../../lib/supplement-serialization";
import type { EditedSupplement } from "../protocol-base/parsed-preview.schema";

export function useSupplementSheet({
	timeBlocks,
	initialSupplements = [],
}: {
	timeBlocks: TimeBlockSummary[];
	initialSupplements?: IdentifiedSupplement[];
}) {
	const defaultTimeBlockId = timeBlocks[0]?.id ?? "";
	const sheet = useSheetState(defaultTimeBlockId);

	const [supplements, setSupplements] = useState<IdentifiedSupplement[]>(initialSupplements);

	function handleSheetSave(edited: EditedSupplement) {
		if (sheet.sheetState === null) return;

		if (sheet.sheetState.supplement === null) {
			setSupplements((prev) => [...prev, { ...edited, _id: crypto.randomUUID() }]);
		} else {
			const id = sheet.sheetState.supplement._id;
			const exists = supplements.some((s) => s._id === id);
			if (exists) {
				setSupplements((prev) => prev.map((s) => (s._id === id ? { ...edited, _id: id } : s)));
			} else {
				setSupplements((prev) => [...prev, { ...edited, _id: id }]);
			}
		}
	}

	function deleteSupplement(id: string) {
		setSupplements((prev) => prev.filter((s) => s._id !== id));
	}

	return {
		supplements,
		handleSheetSave,
		deleteSupplement,
		...sheet,
	};
}
```

- [ ] **Step 3: Move supplement-row.tsx to protocol-form-base**

Create `src/features/protocol-wizard/components/protocol-form-base/supplement-row.tsx` with the exact same content as the existing `manual-protocol-form/supplement-row.tsx`:

```typescript
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { Button } from "@/shared/components/ui/button";
import type { IdentifiedSupplement } from "../../lib/supplement-serialization";

type SupplementRowProps = {
	supplement: IdentifiedSupplement;
	timeBlocks: TimeBlockSummary[];
	onEdit: () => void;
	onDelete: () => void;
};

export function SupplementRow({ supplement, timeBlocks, onEdit, onDelete }: SupplementRowProps) {
	const t = useTranslations();
	const schedule = supplement.schedules[0];
	const timeBlock = schedule ? timeBlocks.find((tb) => tb.id === schedule.timeBlockId) : null;

	const summary = schedule
		? [
				`${schedule.dosageAmount} ${t(`schedule.units.${schedule.dosageUnit}` as Parameters<typeof t>[0])}`,
				timeBlock?.name,
				supplement.schedules.length > 1 ? `+${supplement.schedules.length - 1}` : null,
			]
				.filter(Boolean)
				.join(" · ")
		: null;

	return (
		<div className="flex items-center justify-between gap-sm py-sm">
			<div className="flex flex-col gap-0.5 min-w-0">
				<span className="text-sm font-medium text-content truncate">
					{supplement.name}
					{supplement.brandName ? ` (${supplement.brandName})` : ""}
				</span>
				{summary && <span className="text-xs text-content-faint">{summary}</span>}
			</div>
			<div className="flex items-center gap-xs shrink-0">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={onEdit}
					className="text-content-faint"
				>
					<Pencil className="size-3.5" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={onDelete}
					className="text-content-faint"
				>
					<Trash2 className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}
```

- [ ] **Step 4: Create use-protocol-form-base.ts**

Create `src/features/protocol-wizard/components/protocol-form-base/use-protocol-form-base.ts`:

```typescript
"use client";

import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import type { IdentifiedSupplement } from "../../lib/supplement-serialization";
import { useProtocolName } from "./use-protocol-name";
import { useSupplementSheet } from "./use-supplement-sheet";

export type ProtocolFormData = {
	name: string;
	supplements: IdentifiedSupplement[];
};

export function useProtocolFormBase({
	timeBlocks,
	initialData,
}: {
	timeBlocks: TimeBlockSummary[];
	initialData?: ProtocolFormData;
}) {
	const protocolName = useProtocolName(initialData?.name ?? "");
	const sheet = useSupplementSheet({
		timeBlocks,
		initialSupplements: initialData?.supplements ?? [],
	});

	return { protocolName, ...sheet };
}
```

- [ ] **Step 5: Create protocol-form-base.tsx**

Create `src/features/protocol-wizard/components/protocol-form-base/protocol-form-base.tsx`:

```typescript
"use client";

import { Package, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { LabeledInput } from "@/shared/components/labeled-input";
import { Button } from "@/shared/components/ui/button";
import { ConnectedSupplementSheet } from "../protocol-base/connected-supplement-sheet";
import { ExistingSupplementPicker } from "../protocol-base/existing-supplement-picker";
import { SupplementRow } from "./supplement-row";
import type { useProtocolFormBase } from "./use-protocol-form-base";

type ProtocolFormBaseProps = ReturnType<typeof useProtocolFormBase> & {
	existingSupplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	submitLabel: string;
	isPending: boolean;
	onSubmit: () => void;
};

export function ProtocolFormBase({
	protocolName,
	supplements,
	sheetState,
	pickerOpen,
	setPickerOpen,
	openPicker,
	openAddSheet,
	openAddFromExisting,
	openEditSheet,
	closeSheet,
	handleSheetSave,
	deleteSupplement,
	existingSupplements,
	timeBlocks,
	submitLabel,
	isPending,
	onSubmit,
}: ProtocolFormBaseProps) {
	const t = useTranslations();
	const hasExisting = existingSupplements.length > 0;

	return (
		<>
			<LabeledInput
				label={t("protocolWizard.manual.protocolName")}
				value={protocolName.name}
				onChange={(e) => protocolName.setName(e.target.value)}
				placeholder={t("protocolWizard.manual.protocolNamePlaceholder")}
				error={protocolName.error ?? undefined}
			/>

			<div className="flex flex-col gap-md">
				<h2 className="text-lg font-semibold text-content">
					{t("protocolWizard.manual.supplementsSection")}
				</h2>

				{supplements.length > 0 ? (
					<div className="bg-surface-raised border border-edge-subtle rounded-xl shadow-sm px-md divide-y divide-edge-subtle">
						{supplements.map((supplement) => (
							<SupplementRow
								key={supplement._id}
								supplement={supplement}
								timeBlocks={timeBlocks}
								onEdit={() => openEditSheet(supplement)}
								onDelete={() => deleteSupplement(supplement._id)}
							/>
						))}
					</div>
				) : (
					<p className="text-sm text-content-faint text-center py-lg">
						{t("protocolWizard.manual.noSupplementsYet")}
					</p>
				)}

				<Button
					type="button"
					variant="outline"
					onClick={() => openAddSheet()}
					className="w-full flex items-center justify-center gap-sm rounded-xl border-edge border-dashed bg-surface-raised p-md h-12"
				>
					<Plus className="size-4 text-brand-500" />
					<span className="text-sm font-medium text-content">
						{t("protocolWizard.manual.addNewSupplement")}
					</span>
				</Button>

				{hasExisting && (
					<>
						<div className="flex items-center gap-sm">
							<div className="flex-1 h-px bg-edge-subtle" />
							<span className="text-xs text-content-faint uppercase tracking-wide">
								{t("protocolWizard.manual.or")}
							</span>
							<div className="flex-1 h-px bg-edge-subtle" />
						</div>

						<Button
							type="button"
							variant="outline"
							onClick={openPicker}
							className="w-full flex items-center justify-center gap-sm rounded-xl border-edge bg-surface-raised p-md h-12"
						>
							<Package className="size-4 text-brand-500" />
							<span className="text-sm font-medium text-content">
								{t("protocolWizard.manual.addFromExisting")}
							</span>
						</Button>
					</>
				)}
			</div>

			<Button
				type="button"
				onClick={onSubmit}
				disabled={isPending}
				className="w-full bg-brand-500 text-content-inverse h-12 rounded-xl text-base font-semibold hover:bg-brand-600 active:scale-[0.98] transition-all duration-150"
			>
				{submitLabel}
			</Button>

			{hasExisting && (
				<ExistingSupplementPicker
					supplements={existingSupplements}
					open={pickerOpen}
					onOpenChange={setPickerOpen}
					onPick={openAddFromExisting}
				/>
			)}

			<ConnectedSupplementSheet
				sheetState={sheetState}
				existingSupplements={existingSupplements}
				timeBlocks={timeBlocks}
				onClose={closeSheet}
				onSave={handleSheetSave}
			/>
		</>
	);
}
```

- [ ] **Step 6: Create protocol-form-base/index.ts**

Create `src/features/protocol-wizard/components/protocol-form-base/index.ts`:

```typescript
export { ProtocolFormBase } from "./protocol-form-base";
export { useProtocolFormBase, type ProtocolFormData } from "./use-protocol-form-base";
export { useProtocolName } from "./use-protocol-name";
export { useSupplementSheet } from "./use-supplement-sheet";
export { SupplementRow } from "./supplement-row";
```

- [ ] **Step 7: Update use-manual-protocol-form.ts to use base**

Replace content of `src/features/protocol-wizard/components/manual-protocol-form/use-manual-protocol-form.ts`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { createDraftProtocol } from "../../api/actions/create-draft-protocol";
import { toSerializedProtocol } from "../../lib/supplement-serialization";
import { useProtocolFormBase } from "../protocol-form-base/use-protocol-form-base";

export function useManualProtocolForm({ timeBlocks }: { timeBlocks: TimeBlockSummary[] }) {
	const t = useTranslations();
	const router = useRouter();
	const formBase = useProtocolFormBase({ timeBlocks });

	const { execute: executeSave, isPending } = useAction(createDraftProtocol, {
		onSuccess: ({ data }) => {
			if (data?.protocol) {
				toast.success(t("protocolWizard.manual.draftSaved"));
				router.push(`/protocol/new/preview/${data.protocol.id}`);
			}
		},
		onError: () => {
			toast.error(t("errors.generic"));
		},
	});

	function handleSubmit() {
		if (!formBase.protocolName.validate()) return;

		if (formBase.supplements.length === 0) {
			toast.error(t("protocolWizard.manual.addAtLeastOneSupplement"));
			return;
		}

		executeSave({
			name: formBase.protocolName.name,
			parsedData: toSerializedProtocol(formBase.protocolName.name, formBase.supplements),
		});
	}

	return { ...formBase, isPending, handleSubmit };
}
```

- [ ] **Step 8: Update manual-protocol-form.tsx to use ProtocolFormBase**

Replace content of `src/features/protocol-wizard/components/manual-protocol-form/manual-protocol-form.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { BackButton } from "@/features/protocol-wizard/components/back-button";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { ProtocolFormBase } from "../protocol-form-base";
import { useManualProtocolForm } from "./use-manual-protocol-form";

type ManualProtocolFormProps = {
	supplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
};

export function ManualProtocolForm({ supplements, timeBlocks }: ManualProtocolFormProps) {
	const t = useTranslations();
	const form = useManualProtocolForm({ timeBlocks });

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<div className="flex flex-col gap-sm">
				<BackButton />
				<h1 className="font-display text-2xl text-content">{t("protocolWizard.manual.title")}</h1>
				<p className="text-base text-content-muted">{t("protocolWizard.manual.description")}</p>
			</div>

			<ProtocolFormBase
				{...form}
				existingSupplements={supplements}
				timeBlocks={timeBlocks}
				submitLabel={
					form.isPending
						? t("protocolWizard.manual.saving")
						: t("protocolWizard.manual.saveAndPreview")
				}
				onSubmit={form.handleSubmit}
			/>
		</div>
	);
}
```

- [ ] **Step 9: Update manual-protocol-form/index.ts** (remove old exports, now just ManualProtocolForm)

`src/features/protocol-wizard/components/manual-protocol-form/index.ts` should still only export:
```typescript
export { ManualProtocolForm } from "./manual-protocol-form";
```

- [ ] **Step 10: Delete the three files moved to protocol-form-base**

```bash
rm src/features/protocol-wizard/components/manual-protocol-form/use-protocol-name.ts
rm src/features/protocol-wizard/components/manual-protocol-form/use-supplement-sheet.ts
rm src/features/protocol-wizard/components/manual-protocol-form/supplement-row.tsx
```

- [ ] **Step 11: Verify TypeScript + build**

```bash
pnpm build 2>&1 | head -50
```

Expected: no errors. If there are import errors, update any remaining imports in `manual-protocol-form/` that still point to the moved files.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "refactor: extract ProtocolFormBase from ManualProtocolForm"
```

---

### Task 4: TDD — generate-share-token action

**Files:**
- Create: `src/features/protocol-wizard/api/actions/generate-share-token.test.ts`
- Create: `src/features/protocol-wizard/api/actions/generate-share-token.ts`

- [ ] **Step 1: Write failing test**

Create `src/features/protocol-wizard/api/actions/generate-share-token.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo } = vi.hoisted(() => ({
	mockProtocolRepo: {
		findByIdAndUserId: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("next-safe-action", () => ({
	createSafeActionClient: vi.fn(),
}));
vi.mock("@/shared/repositories/protocol-repository", () => ({
	protocolRepository: mockProtocolRepo,
}));
vi.mock("@paralleldrive/cuid2", () => ({
	createId: () => "test-token-abc123",
}));

import { generateShareToken } from "./generate-share-token";

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1", status: "active" });
	mockProtocolRepo.update.mockResolvedValue({});
});

describe("generateShareToken", () => {
	it("saves token to protocol and returns it", async () => {
		const result = await generateShareToken({ protocolId: "proto-1" });

		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", {
			shareToken: "test-token-abc123",
		});
		expect(result).toEqual({ shareToken: "test-token-abc123" });
	});

	it("throws when protocol not found or not owned by user", async () => {
		mockProtocolRepo.findByIdAndUserId.mockRejectedValue(new Error("PROTOCOL_NOT_FOUND"));

		await expect(generateShareToken({ protocolId: "other-proto" })).rejects.toThrow();
	});

	it("throws when protocol status is not active", async () => {
		mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1", status: "draft" });

		await expect(generateShareToken({ protocolId: "proto-1" })).rejects.toThrow();
	});

	it("overwrites existing token when called again", async () => {
		mockProtocolRepo.findByIdAndUserId.mockResolvedValue({
			id: "proto-1",
			status: "active",
			shareToken: "old-token",
		});

		await generateShareToken({ protocolId: "proto-1" });

		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", {
			shareToken: "test-token-abc123",
		});
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/features/protocol-wizard/api/actions/generate-share-token.test.ts
```

Expected: FAIL — "Cannot find module './generate-share-token'"

- [ ] **Step 3: Implement the action**

Create `src/features/protocol-wizard/api/actions/generate-share-token.ts`:

```typescript
"use server";

import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

const schema = z.object({ protocolId: z.string() });

export const generateShareToken = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { protocolId }, ctx: { userId } }) => {
		const protocol = await protocolRepository.findByIdAndUserId(protocolId, userId);

		if (protocol.status !== "active") {
			throw new ActionError(ActionErrorCode.PROTOCOL_NOT_FOUND);
		}

		const shareToken = createId();
		await protocolRepository.update(protocolId, { shareToken });
		revalidatePath("/settings");

		return { shareToken };
	});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- src/features/protocol-wizard/api/actions/generate-share-token.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/features/protocol-wizard/api/actions/generate-share-token.ts \
        src/features/protocol-wizard/api/actions/generate-share-token.test.ts
git commit -m "feat: add generateShareToken action"
```

---

### Task 5: TDD — revoke-share-token action

**Files:**
- Create: `src/features/protocol-wizard/api/actions/revoke-share-token.test.ts`
- Create: `src/features/protocol-wizard/api/actions/revoke-share-token.ts`

- [ ] **Step 1: Write failing test**

Create `src/features/protocol-wizard/api/actions/revoke-share-token.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo } = vi.hoisted(() => ({
	mockProtocolRepo: {
		findByIdAndUserId: vi.fn(),
		update: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("next-safe-action", () => ({ createSafeActionClient: vi.fn() }));
vi.mock("@/shared/repositories/protocol-repository", () => ({
	protocolRepository: mockProtocolRepo,
}));

import { revokeShareToken } from "./revoke-share-token";

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1", shareToken: "tok" });
	mockProtocolRepo.update.mockResolvedValue({});
});

describe("revokeShareToken", () => {
	it("sets shareToken to null", async () => {
		await revokeShareToken({ protocolId: "proto-1" });

		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", { shareToken: null });
	});

	it("throws when protocol not owned by user", async () => {
		mockProtocolRepo.findByIdAndUserId.mockRejectedValue(new Error("PROTOCOL_NOT_FOUND"));

		await expect(revokeShareToken({ protocolId: "other" })).rejects.toThrow();
	});

	it("is a no-op when shareToken already null (no error thrown)", async () => {
		mockProtocolRepo.findByIdAndUserId.mockResolvedValue({ id: "proto-1", shareToken: null });

		await expect(revokeShareToken({ protocolId: "proto-1" })).resolves.not.toThrow();
		expect(mockProtocolRepo.update).toHaveBeenCalledWith("proto-1", { shareToken: null });
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/features/protocol-wizard/api/actions/revoke-share-token.test.ts
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Implement the action**

Create `src/features/protocol-wizard/api/actions/revoke-share-token.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

export const revokeShareToken = authActionClient
	.inputSchema(z.object({ protocolId: z.string() }))
	.action(async ({ parsedInput: { protocolId }, ctx: { userId } }) => {
		await protocolRepository.findByIdAndUserId(protocolId, userId);
		await protocolRepository.update(protocolId, { shareToken: null });
		revalidatePath("/settings");
	});
```

- [ ] **Step 4: Run tests**

```bash
pnpm test -- src/features/protocol-wizard/api/actions/revoke-share-token.test.ts
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/features/protocol-wizard/api/actions/revoke-share-token.ts \
        src/features/protocol-wizard/api/actions/revoke-share-token.test.ts
git commit -m "feat: add revokeShareToken action"
```

---

### Task 6: TDD — get-shared-protocol query

**Files:**
- Create: `src/features/protocol-wizard/api/queries/get-shared-protocol.test.ts`
- Create: `src/features/protocol-wizard/api/queries/get-shared-protocol.ts`

- [ ] **Step 1: Write failing test**

Create `src/features/protocol-wizard/api/queries/get-shared-protocol.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo, mockDb } = vi.hoisted(() => ({
	mockProtocolRepo: { findByShareToken: vi.fn() },
	mockDb: { select: vi.fn() },
}));

vi.mock("@/shared/repositories/protocol-repository", () => ({
	protocolRepository: mockProtocolRepo,
}));
vi.mock("@/shared/db/client", () => ({ db: mockDb }));

const mockRows = [
	{
		supplementName: "Vitamin D",
		supplementCategory: "vitamin",
		supplementStockUnit: "capsule",
		timeBlockName: "Rano",
		timeBlockIcon: "☀️",
		timeBlockStartTime: "08:00",
		dosageAmount: "1.00",
		dosageUnit: "capsule",
		notes: null,
		isCritical: false,
		cycleDaysOn: null,
		cycleDaysOff: null,
		startDayOffset: 0,
		durationDays: null,
		dosageIntervalMinutes: null,
		waitAfterTakingMinutes: null,
		sortOrder: 0,
		finishPackage: false,
	},
];

function buildDbChain(rows: typeof mockRows) {
	const chain = {
		from: vi.fn().mockReturnThis(),
		innerJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockResolvedValue(rows),
	};
	mockDb.select.mockReturnValue(chain);
	return chain;
}

beforeEach(() => {
	vi.clearAllMocks();
});

import { getSharedProtocol } from "./get-shared-protocol";

describe("getSharedProtocol", () => {
	it("returns null when token not found", async () => {
		mockProtocolRepo.findByShareToken.mockResolvedValue(null);

		const result = await getSharedProtocol("bad-token");

		expect(result).toBeNull();
	});

	it("returns structured protocol data when token is valid", async () => {
		mockProtocolRepo.findByShareToken.mockResolvedValue({ id: "proto-1", name: "My Protocol" });
		buildDbChain(mockRows);

		const result = await getSharedProtocol("valid-token");

		expect(result).not.toBeNull();
		expect(result?.protocolName).toBe("My Protocol");
		expect(result?.supplements).toHaveLength(1);
		expect(result?.supplements[0].name).toBe("Vitamin D");
		expect(result?.supplements[0].schedules[0].dosageAmount).toBe(1);
	});

	it("groups multiple schedules under the same supplement", async () => {
		mockProtocolRepo.findByShareToken.mockResolvedValue({ id: "proto-1", name: "Protocol" });
		buildDbChain([
			{ ...mockRows[0] },
			{ ...mockRows[0], timeBlockName: "Wieczór", timeBlockStartTime: "20:00", sortOrder: 1 },
		]);

		const result = await getSharedProtocol("token");

		expect(result?.supplements).toHaveLength(1);
		expect(result?.supplements[0].schedules).toHaveLength(2);
	});
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test -- src/features/protocol-wizard/api/queries/get-shared-protocol.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement the query**

Create `src/features/protocol-wizard/api/queries/get-shared-protocol.ts`:

```typescript
import { asc, eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import type { DosageUnit, SupplementCategory } from "@/shared/db/schema";
import { supplementSchedules, supplements, timeBlocks } from "@/shared/db/schema";
import { protocolRepository } from "@/shared/repositories/protocol-repository";

export type SharedScheduleData = {
	timeBlockName: string;
	timeBlockIcon: string;
	timeBlockStartTime: string;
	dosageAmount: number;
	dosageUnit: DosageUnit;
	notes: string | null;
	isCritical: boolean;
	cycleDaysOn: number | null;
	cycleDaysOff: number | null;
	startDayOffset: number;
	durationDays: number | null;
	dosageIntervalMinutes: number | null;
	waitAfterTakingMinutes: number | null;
	sortOrder: number;
	finishPackage: boolean;
};

export type SharedProtocolData = {
	protocolName: string;
	supplements: {
		name: string;
		category: SupplementCategory;
		stockUnit: DosageUnit;
		schedules: SharedScheduleData[];
	}[];
};

export async function getSharedProtocol(token: string): Promise<SharedProtocolData | null> {
	const protocol = await protocolRepository.findByShareToken(token);
	if (!protocol) return null;

	const rows = await db
		.select({
			supplementName: supplements.name,
			supplementCategory: supplements.category,
			supplementStockUnit: supplements.stockUnit,
			timeBlockName: timeBlocks.name,
			timeBlockIcon: timeBlocks.icon,
			timeBlockStartTime: timeBlocks.startTime,
			dosageAmount: supplementSchedules.dosageAmount,
			dosageUnit: supplementSchedules.dosageUnit,
			notes: supplementSchedules.notes,
			isCritical: supplementSchedules.isCritical,
			cycleDaysOn: supplementSchedules.cycleDaysOn,
			cycleDaysOff: supplementSchedules.cycleDaysOff,
			startDayOffset: supplementSchedules.startDayOffset,
			durationDays: supplementSchedules.durationDays,
			dosageIntervalMinutes: supplementSchedules.dosageIntervalMinutes,
			waitAfterTakingMinutes: supplementSchedules.waitAfterTakingMinutes,
			sortOrder: supplementSchedules.sortOrder,
			finishPackage: supplementSchedules.finishPackage,
		})
		.from(supplementSchedules)
		.innerJoin(supplements, eq(supplementSchedules.supplementId, supplements.id))
		.innerJoin(timeBlocks, eq(supplementSchedules.timeBlockId, timeBlocks.id))
		.where(eq(supplementSchedules.protocolId, protocol.id))
		.orderBy(asc(timeBlocks.startTime), asc(supplementSchedules.sortOrder));

	const supplementMap = new Map<string, SharedProtocolData["supplements"][number]>();

	for (const row of rows) {
		if (!supplementMap.has(row.supplementName)) {
			supplementMap.set(row.supplementName, {
				name: row.supplementName,
				category: row.supplementCategory,
				stockUnit: row.supplementStockUnit,
				schedules: [],
			});
		}
		supplementMap.get(row.supplementName)!.schedules.push({
			timeBlockName: row.timeBlockName,
			timeBlockIcon: row.timeBlockIcon,
			timeBlockStartTime: row.timeBlockStartTime,
			dosageAmount: Number(row.dosageAmount),
			dosageUnit: row.dosageUnit,
			notes: row.notes,
			isCritical: row.isCritical,
			cycleDaysOn: row.cycleDaysOn,
			cycleDaysOff: row.cycleDaysOff,
			startDayOffset: row.startDayOffset,
			durationDays: row.durationDays,
			dosageIntervalMinutes: row.dosageIntervalMinutes,
			waitAfterTakingMinutes: row.waitAfterTakingMinutes,
			sortOrder: row.sortOrder,
			finishPackage: row.finishPackage,
		});
	}

	return {
		protocolName: protocol.name,
		supplements: [...supplementMap.values()],
	};
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test -- src/features/protocol-wizard/api/queries/get-shared-protocol.test.ts
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/features/protocol-wizard/api/queries/get-shared-protocol.ts \
        src/features/protocol-wizard/api/queries/get-shared-protocol.test.ts
git commit -m "feat: add getSharedProtocol query"
```

---

### Task 7: TDD — build-share-ai-content service

**Files:**
- Create: `src/features/protocol-wizard/api/services/build-share-ai-content.test.ts`
- Create: `src/features/protocol-wizard/api/services/build-share-ai-content.ts`

- [ ] **Step 1: Write failing test**

Create `src/features/protocol-wizard/api/services/build-share-ai-content.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateText } = vi.hoisted(() => ({
	mockGenerateText: vi.fn(),
}));

vi.mock("ai", () => ({
	generateText: mockGenerateText,
	Output: { object: vi.fn((x) => x) },
}));
vi.mock("@/shared/lib/ai", () => ({
	anthropic: vi.fn(() => "mock-model"),
}));

import { matchShareSupplements } from "./build-share-ai-content";

const existingSupplements = [
	{ id: "s1", name: "Vitamin D", brandName: null, packageSize: null },
	{ id: "s2", name: "Magnesium", brandName: "Now Foods", packageSize: 100 },
];

beforeEach(() => {
	vi.clearAllMocks();
	mockGenerateText.mockResolvedValue({
		output: { matches: [{ index: 0, existingSupplementId: "s1" }] },
	});
});

describe("matchShareSupplements", () => {
	it("returns null array when no existing supplements", async () => {
		const result = await matchShareSupplements(["Vitamin D"], []);

		expect(mockGenerateText).not.toHaveBeenCalled();
		expect(result).toEqual([null]);
	});

	it("returns empty array when no shared supplements", async () => {
		const result = await matchShareSupplements([], existingSupplements);

		expect(mockGenerateText).not.toHaveBeenCalled();
		expect(result).toEqual([]);
	});

	it("calls AI and returns mapped supplement IDs", async () => {
		mockGenerateText.mockResolvedValue({
			output: {
				matches: [
					{ index: 0, existingSupplementId: "s1" },
					{ index: 1, existingSupplementId: null },
				],
			},
		});

		const result = await matchShareSupplements(["Vitamin D", "Unknown Herb"], existingSupplements);

		expect(mockGenerateText).toHaveBeenCalledTimes(1);
		expect(result).toEqual(["s1", null]);
	});

	it("falls back to null for indexes not returned by AI", async () => {
		mockGenerateText.mockResolvedValue({
			output: { matches: [] },
		});

		const result = await matchShareSupplements(["Vitamin D"], existingSupplements);

		expect(result).toEqual([null]);
	});
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test -- src/features/protocol-wizard/api/services/build-share-ai-content.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement the service**

Create `src/features/protocol-wizard/api/services/build-share-ai-content.ts`:

```typescript
import { Output, generateText } from "ai";
import { z } from "zod";
import type { ExistingSupplementSummary } from "@/features/protocol-wizard/types";
import { anthropic } from "@/shared/lib/ai";

const matchSchema = z.object({
	matches: z.array(
		z.object({
			index: z.number(),
			existingSupplementId: z.string().nullable(),
		}),
	),
});

export async function matchShareSupplements(
	sharedNames: string[],
	existing: ExistingSupplementSummary[],
): Promise<Array<string | null>> {
	if (sharedNames.length === 0) return [];
	if (existing.length === 0) return sharedNames.map(() => null);

	const { output } = await generateText({
		model: anthropic("claude-haiku-4-5"),
		output: Output.object({ schema: matchSchema }),
		messages: [
			{
				role: "user",
				content: `Match these shared protocol supplements to the user's existing supplements.
Return existingSupplementId for strong matches (confidence ≥ 0.9), or null for no match.

Shared supplements (0-indexed):
${sharedNames.map((n, i) => `${i}: "${n}"`).join("\n")}

User's existing supplements:
${existing.map((s) => `id: "${s.id}", name: "${s.name}"${s.brandName ? `, brand: "${s.brandName}"` : ""}`).join("\n")}`,
			},
		],
	});

	const map = new Map(output?.matches.map((m) => [m.index, m.existingSupplementId]) ?? []);
	return sharedNames.map((_, i) => map.get(i) ?? null);
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test -- src/features/protocol-wizard/api/services/build-share-ai-content.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/features/protocol-wizard/api/services/build-share-ai-content.ts \
        src/features/protocol-wizard/api/services/build-share-ai-content.test.ts
git commit -m "feat: add matchShareSupplements AI service"
```

---

### Task 8: TDD — import-shared-protocol action

**Files:**
- Create: `src/features/protocol-wizard/api/actions/import-shared-protocol.test.ts`
- Create: `src/features/protocol-wizard/api/actions/import-shared-protocol.ts`

- [ ] **Step 1: Write failing test**

Create `src/features/protocol-wizard/api/actions/import-shared-protocol.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockProtocolRepo, mockTimeBlockRepo } = vi.hoisted(() => ({
	mockProtocolRepo: {
		findByShareToken: vi.fn(),
		create: vi.fn(),
	},
	mockTimeBlockRepo: {
		create: vi.fn(),
	},
}));

vi.mock("next/cache", async () => import("@/test/mock-safe-action"));
vi.mock("@/shared/lib/safe-action", async () => import("@/test/mock-safe-action"));
vi.mock("next-safe-action", () => ({ createSafeActionClient: vi.fn() }));
vi.mock("@/shared/repositories/protocol-repository", () => ({
	protocolRepository: mockProtocolRepo,
}));
vi.mock("@/shared/repositories/time-block-repository", () => ({
	timeBlockRepository: mockTimeBlockRepo,
}));

import { importSharedProtocol } from "./import-shared-protocol";

const validParsedData = JSON.stringify({
	protocolName: "Shared Protocol",
	supplements: [
		{
			name: "Vitamin D",
			existingSupplementId: "s1",
			category: "vitamin",
			isCritical: false,
			schedules: [{ timeBlockId: "tb-1", dosageAmount: 1, dosageUnit: "capsule" }],
		},
	],
});

const parsedDataWithTempBlock = JSON.stringify({
	protocolName: "Shared Protocol",
	supplements: [
		{
			name: "Magnesium",
			existingSupplementId: null,
			category: "mineral",
			isCritical: false,
			schedules: [{ timeBlockId: "temp-abc", dosageAmount: 300, dosageUnit: "mg" }],
		},
	],
});

beforeEach(() => {
	vi.clearAllMocks();
	mockProtocolRepo.findByShareToken.mockResolvedValue({ id: "shared-proto" });
	mockProtocolRepo.create.mockResolvedValue({ id: "new-proto" });
	mockTimeBlockRepo.create.mockResolvedValue({ id: "real-tb-id" });
});

describe("importSharedProtocol", () => {
	it("throws when shareToken is invalid", async () => {
		mockProtocolRepo.findByShareToken.mockResolvedValue(null);

		await expect(
			importSharedProtocol({
				shareToken: "bad-token",
				name: "My Protocol",
				parsedData: validParsedData,
				timeBlocksToCreate: [],
			}),
		).rejects.toThrow();
	});

	it("creates protocol with recipient userId", async () => {
		await importSharedProtocol({
			shareToken: "valid-token",
			name: "My Protocol",
			parsedData: validParsedData,
			timeBlocksToCreate: [],
		});

		expect(mockProtocolRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ userId: "user-1", status: "draft" }),
		);
	});

	it("creates new time blocks from timeBlocksToCreate", async () => {
		await importSharedProtocol({
			shareToken: "valid-token",
			name: "My Protocol",
			parsedData: parsedDataWithTempBlock,
			timeBlocksToCreate: [
				{ tempId: "temp-abc", name: "Wieczór", icon: "🌙", startTime: "21:00" },
			],
		});

		expect(mockTimeBlockRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Wieczór", icon: "🌙", startTime: "21:00", userId: "user-1" }),
		);
	});

	it("replaces tempId with real time block id in parsedData stored in protocol", async () => {
		mockTimeBlockRepo.create.mockResolvedValue({ id: "real-tb-id" });

		await importSharedProtocol({
			shareToken: "valid-token",
			name: "My Protocol",
			parsedData: parsedDataWithTempBlock,
			timeBlocksToCreate: [
				{ tempId: "temp-abc", name: "Wieczór", icon: "🌙", startTime: "21:00" },
			],
		});

		const storedParsedData = mockProtocolRepo.create.mock.calls[0][0].parsedData as string;
		const parsed = JSON.parse(storedParsedData);
		expect(parsed.supplements[0].schedules[0].timeBlockId).toBe("real-tb-id");
	});

	it("returns protocolId of newly created protocol", async () => {
		const result = await importSharedProtocol({
			shareToken: "valid-token",
			name: "My Protocol",
			parsedData: validParsedData,
			timeBlocksToCreate: [],
		});

		expect(result).toEqual({ protocolId: "new-proto" });
	});
});
```

- [ ] **Step 2: Run to verify fail**

```bash
pnpm test -- src/features/protocol-wizard/api/actions/import-shared-protocol.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement the action**

Create `src/features/protocol-wizard/api/actions/import-shared-protocol.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parsedProtocolSchema } from "@/features/protocol-wizard/schemas/parsed-protocol-schema";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { protocolRepository } from "@/shared/repositories/protocol-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const timeBlockToCreateSchema = z.object({
	tempId: z.string(),
	name: z.string(),
	icon: z.string(),
	startTime: z.string(),
});

const schema = z.object({
	shareToken: z.string(),
	name: z.string().min(1),
	parsedData: z.string(),
	timeBlocksToCreate: z.array(timeBlockToCreateSchema),
});

export const importSharedProtocol = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput, ctx: { userId } }) => {
		const { shareToken, name, parsedData, timeBlocksToCreate } = parsedInput;

		const sharedProtocol = await protocolRepository.findByShareToken(shareToken);
		if (!sharedProtocol) {
			throw new ActionError(ActionErrorCode.PROTOCOL_NOT_FOUND);
		}

		const tempToReal = new Map<string, string>();
		for (const tb of timeBlocksToCreate) {
			const created = await timeBlockRepository.create({
				userId,
				name: tb.name,
				icon: tb.icon,
				startTime: tb.startTime,
			});
			tempToReal.set(tb.tempId, created.id);
		}

		let finalParsedData = parsedData;
		if (tempToReal.size > 0) {
			const parsed = parsedProtocolSchema.parse(JSON.parse(parsedData));
			for (const supplement of parsed.supplements) {
				for (const schedule of supplement.schedules) {
					const realId = tempToReal.get(schedule.timeBlockId);
					if (realId) {
						schedule.timeBlockId = realId;
					}
				}
			}
			finalParsedData = JSON.stringify(parsed);
		}

		const protocol = await protocolRepository.create({
			userId,
			name,
			parsedData: finalParsedData,
			status: "draft",
		});

		revalidatePath("/settings");
		return { protocolId: protocol.id };
	});
```

- [ ] **Step 4: Run tests**

```bash
pnpm test -- src/features/protocol-wizard/api/actions/import-shared-protocol.test.ts
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/features/protocol-wizard/api/actions/import-shared-protocol.ts \
        src/features/protocol-wizard/api/actions/import-shared-protocol.test.ts
git commit -m "feat: add importSharedProtocol action"
```

---

### Task 9: UI — share-button component

**Files:**
- Create: `src/features/protocol-wizard/components/share-button/use-share-button.ts`
- Create: `src/features/protocol-wizard/components/share-button/share-button.tsx`
- Create: `src/features/protocol-wizard/components/share-button/index.ts`

- [ ] **Step 1: Create use-share-button.ts**

Create `src/features/protocol-wizard/components/share-button/use-share-button.ts`:

```typescript
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

	const shareLink = shareToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}` : null;

	return {
		shareToken,
		shareLink,
		isGenerating,
		isRevoking,
		handleGenerate,
		handleRevoke,
		handleCopy,
	};
}
```

- [ ] **Step 2: Create share-button.tsx**

Create `src/features/protocol-wizard/components/share-button/share-button.tsx`:

```typescript
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
```

- [ ] **Step 3: Create share-button/index.ts**

Create `src/features/protocol-wizard/components/share-button/index.ts`:

```typescript
export { ShareButton } from "./share-button";
```

- [ ] **Step 4: Commit**

```bash
git add src/features/protocol-wizard/components/share-button/
git commit -m "feat: add ShareButton component"
```

---

### Task 10: UI — integrate share into Settings protocol card

**Files:**
- Modify: `src/features/settings/api/queries/get-user-protocols.ts`
- Modify: `src/features/settings/components/settings-page/protocol-section/protocol-card/protocol-card-actions/active-actions.tsx`
- Modify: `src/features/settings/components/settings-page/protocol-section/protocol-card/protocol-card-actions/protocol-card-actions.tsx`

- [ ] **Step 1: Add shareToken to ProtocolWithSchedules type**

In `src/features/settings/api/queries/get-user-protocols.ts`:

Add `shareToken` to the `ProtocolWithSchedules` type:
```typescript
export type ProtocolWithSchedules = {
	id: string;
	name: string;
	status: ProtocolStatus;
	shareToken: string | null;
	schedules: { ... }[]; // unchanged
};
```

Update the `getUserProtocols` return mapping to include `shareToken`:
```typescript
return userProtocols.map((protocol) => ({
	id: protocol.id,
	name: protocol.name,
	status: protocol.status,
	shareToken: protocol.shareToken ?? null,
	schedules: schedulesByProtocol.get(protocol.id) ?? [],
}));
```

- [ ] **Step 2: Update ActiveActions to include ShareButton**

Replace content of `src/features/settings/components/settings-page/protocol-section/protocol-card/protocol-card-actions/active-actions.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import { ShareButton } from "@/features/protocol-wizard/components/share-button";
import { Button } from "@/shared/components/ui/button";
import { CardActionSection } from "./card-action-section";

type ActiveActionsProps = {
	protocolId: string;
	shareToken: string | null;
	onRequestArchive: () => void;
};

export function ActiveActions({ protocolId, shareToken, onRequestArchive }: ActiveActionsProps) {
	const t = useTranslations();

	return (
		<CardActionSection>
			<ShareButton protocolId={protocolId} initialShareToken={shareToken} />
			<Button variant="destructive" className="w-full" onClick={onRequestArchive}>
				{t("common.archive")}
			</Button>
		</CardActionSection>
	);
}
```

- [ ] **Step 3: Update ProtocolCardActions to pass protocolId and shareToken to ActiveActions**

In `src/features/settings/components/settings-page/protocol-section/protocol-card/protocol-card-actions/protocol-card-actions.tsx`, update the `ProtocolCardActionsProps` type and the `active` case:

```typescript
type ProtocolCardActionsProps = {
	protocolId: string;
	shareToken: string | null;
	status: ProtocolWithSchedules["status"];
	onContinueDraft: () => void;
	onRetry: () => void;
	onRequestArchive: () => void;
	onRequestDelete: () => void;
};

export function ProtocolCardActions({
	protocolId,
	shareToken,
	status,
	onContinueDraft,
	onRetry,
	onRequestArchive,
	onRequestDelete,
}: ProtocolCardActionsProps) {
	switch (status) {
		case "processing":
			return <ProcessingActions onRequestDelete={onRequestDelete} />;
		case "failed":
			return <FailedActions onRetry={onRetry} onRequestDelete={onRequestDelete} />;
		case "draft":
			return <DraftActions onContinueDraft={onContinueDraft} onRequestDelete={onRequestDelete} />;
		case "active":
			return (
				<ActiveActions
					protocolId={protocolId}
					shareToken={shareToken}
					onRequestArchive={onRequestArchive}
				/>
			);
		case "archived":
			return <ArchivedActions onRequestDelete={onRequestDelete} />;
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}
```

- [ ] **Step 4: Update ProtocolCard to pass protocolId and shareToken**

In `src/features/settings/components/settings-page/protocol-section/protocol-card/protocol-card.tsx`, update the `ProtocolCardActions` call:

```typescript
<ProtocolCardActions
	protocolId={protocol.id}
	shareToken={protocol.shareToken}
	status={protocol.status}
	onContinueDraft={handleContinueDraft}
	onRetry={handleRetry}
	onRequestArchive={() => setArchiveConfirmOpen(true)}
	onRequestDelete={() => setDeleteConfirmOpen(true)}
/>
```

- [ ] **Step 5: Check for TypeScript errors**

```bash
pnpm build 2>&1 | head -50
```

Fix any type errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/ src/features/protocol-wizard/components/share-button/
git commit -m "feat: integrate share button into active protocol card"
```

---

### Task 11: UI — import-protocol-form and import-protocol-page

**Files:**
- Create: `src/features/protocol-wizard/components/import-protocol-form/use-import-protocol-form.ts`
- Create: `src/features/protocol-wizard/components/import-protocol-form/import-protocol-form.tsx`
- Create: `src/features/protocol-wizard/components/import-protocol-form/index.ts`
- Create: `src/features/protocol-wizard/import-protocol-page.tsx`

- [ ] **Step 1: Create use-import-protocol-form.ts**

Create `src/features/protocol-wizard/components/import-protocol-form/use-import-protocol-form.ts`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import type { TimeBlockSummary } from "@/features/protocol-wizard/types";
import { importSharedProtocol } from "../../api/actions/import-shared-protocol";
import { toSerializedProtocol } from "../../lib/supplement-serialization";
import type { ProtocolFormData } from "../protocol-form-base/use-protocol-form-base";
import { useProtocolFormBase } from "../protocol-form-base/use-protocol-form-base";

type TimeBlockToCreate = {
	tempId: string;
	name: string;
	icon: string;
	startTime: string;
};

export function useImportProtocolForm({
	timeBlocks,
	shareToken,
	initialData,
	timeBlocksToCreate,
}: {
	timeBlocks: TimeBlockSummary[];
	shareToken: string;
	initialData: ProtocolFormData;
	timeBlocksToCreate: TimeBlockToCreate[];
}) {
	const t = useTranslations();
	const router = useRouter();
	const formBase = useProtocolFormBase({ timeBlocks, initialData });

	const { execute, isPending } = useAction(importSharedProtocol, {
		onSuccess: ({ data }) => {
			if (data?.protocolId) {
				toast.success(t("settings.share.importSuccess"));
				router.push(`/protocol/new/preview/${data.protocolId}`);
			}
		},
		onError: () => toast.error(t("errors.generic")),
	});

	function handleSubmit() {
		if (!formBase.protocolName.validate()) return;

		if (formBase.supplements.length === 0) {
			toast.error(t("protocolWizard.manual.addAtLeastOneSupplement"));
			return;
		}

		execute({
			shareToken,
			name: formBase.protocolName.name,
			parsedData: toSerializedProtocol(formBase.protocolName.name, formBase.supplements),
			timeBlocksToCreate,
		});
	}

	return { ...formBase, isPending, handleSubmit };
}
```

- [ ] **Step 2: Create import-protocol-form.tsx**

Create `src/features/protocol-wizard/components/import-protocol-form/import-protocol-form.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import { ProtocolFormBase } from "../protocol-form-base";
import type { ProtocolFormData } from "../protocol-form-base/use-protocol-form-base";
import { useImportProtocolForm } from "./use-import-protocol-form";

type TimeBlockToCreate = {
	tempId: string;
	name: string;
	icon: string;
	startTime: string;
};

type ImportProtocolFormProps = {
	existingSupplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	shareToken: string;
	initialData: ProtocolFormData;
	timeBlocksToCreate: TimeBlockToCreate[];
};

export function ImportProtocolForm({
	existingSupplements,
	timeBlocks,
	shareToken,
	initialData,
	timeBlocksToCreate,
}: ImportProtocolFormProps) {
	const t = useTranslations();
	const form = useImportProtocolForm({ timeBlocks, shareToken, initialData, timeBlocksToCreate });

	return (
		<div className="px-md pt-2xl pb-3xl flex flex-col gap-xl">
			<div className="flex flex-col gap-sm">
				<h1 className="font-display text-2xl text-content">{t("settings.share.importTitle")}</h1>
				<p className="text-base text-content-muted">{t("settings.share.importDescription")}</p>
			</div>

			<ProtocolFormBase
				{...form}
				existingSupplements={existingSupplements}
				timeBlocks={timeBlocks}
				submitLabel={
					form.isPending ? t("common.saving") : t("settings.share.importSubmit")
				}
				onSubmit={form.handleSubmit}
			/>
		</div>
	);
}
```

- [ ] **Step 3: Create import-protocol-form/index.ts**

Create `src/features/protocol-wizard/components/import-protocol-form/index.ts`:

```typescript
export { ImportProtocolForm } from "./import-protocol-form";
```

- [ ] **Step 4: Create import-protocol-page.tsx**

Create `src/features/protocol-wizard/import-protocol-page.tsx`:

```typescript
import type { ExistingSupplementSummary, TimeBlockSummary } from "@/features/protocol-wizard/types";
import type { IdentifiedSupplement } from "./lib/supplement-serialization";
import { ImportProtocolForm } from "./components/import-protocol-form";

type TimeBlockToCreate = {
	tempId: string;
	name: string;
	icon: string;
	startTime: string;
};

type ImportProtocolPageProps = {
	shareToken: string;
	protocolName: string;
	initialSupplements: IdentifiedSupplement[];
	existingSupplements: ExistingSupplementSummary[];
	timeBlocks: TimeBlockSummary[];
	timeBlocksToCreate: TimeBlockToCreate[];
};

export function ImportProtocolPage({
	shareToken,
	protocolName,
	initialSupplements,
	existingSupplements,
	timeBlocks,
	timeBlocksToCreate,
}: ImportProtocolPageProps) {
	return (
		<ImportProtocolForm
			shareToken={shareToken}
			existingSupplements={existingSupplements}
			timeBlocks={timeBlocks}
			initialData={{ name: protocolName, supplements: initialSupplements }}
			timeBlocksToCreate={timeBlocksToCreate}
		/>
	);
}
```

- [ ] **Step 5: Commit**

```bash
git add src/features/protocol-wizard/components/import-protocol-form/ \
        src/features/protocol-wizard/import-protocol-page.tsx
git commit -m "feat: add ImportProtocolForm and ImportProtocolPage"
```

---

### Task 12: Route — /share/[token] page, error, and i18n

**Files:**
- Create: `src/app/(app)/share/[token]/page.tsx`
- Create: `src/app/(app)/share/[token]/error.tsx`
- Modify: `src/shared/i18n/messages/pl.json`

- [ ] **Step 1: Add i18n translation keys**

Open `src/shared/i18n/messages/pl.json` and add these keys under the `settings` object:

```json
"share": {
  "generate": "Udostępnij",
  "revoke": "Unieważnij link",
  "linkCopied": "Link skopiowany!",
  "importTitle": "Importuj protokół",
  "importDescription": "Przejrzyj i dostosuj protokół przed zapisaniem go do swojego konta.",
  "importSubmit": "Importuj protokół",
  "importSuccess": "Protokół zaimportowany pomyślnie!"
}
```

- [ ] **Step 2: Create error.tsx**

Create `src/app/(app)/share/[token]/error.tsx`:

```typescript
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

export default function ShareError() {
	const t = useTranslations();

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-md gap-lg text-center">
			<h1 className="font-display text-2xl text-content">
				{t("settings.share.errorTitle")}
			</h1>
			<p className="text-base text-content-muted">{t("settings.share.errorDescription")}</p>
			<Button asChild>
				<Link href="/dashboard">{t("common.backToDashboard")}</Link>
			</Button>
		</div>
	);
}
```

Also add to `pl.json` under `settings.share`:
```json
"errorTitle": "Link wygasł lub jest nieprawidłowy",
"errorDescription": "Protokół który próbujesz otworzyć nie istnieje lub został unieważniony przez właściciela."
```

Also add to `pl.json` under `common`:
```json
"backToDashboard": "Wróć do dashboardu",
"saving": "Zapisywanie..."
```

- [ ] **Step 3: Create page.tsx**

Create `src/app/(app)/share/[token]/page.tsx`:

```typescript
import { notFound } from "next/navigation";
import { getSupplementSummaries } from "@/features/protocol-wizard/api/queries/get-supplement-summaries";
import { getTimeBlockSummaries } from "@/features/protocol-wizard/api/queries/get-time-block-summaries";
import { getSharedProtocol } from "@/features/protocol-wizard/api/queries/get-shared-protocol";
import { matchShareSupplements } from "@/features/protocol-wizard/api/services/build-share-ai-content";
import { toIdentifiedSupplements } from "@/features/protocol-wizard/lib/supplement-serialization";
import { ImportProtocolPage } from "@/features/protocol-wizard/import-protocol-page";
import type { SharedScheduleData } from "@/features/protocol-wizard/api/queries/get-shared-protocol";
import { auth } from "@/shared/lib/auth";
import { headers } from "next/headers";

type Props = { params: Promise<{ token: string }> };

export default async function SharePage({ params }: Props) {
	const { token } = await params;

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user?.id) notFound();

	const userId = session.user.id;

	const [sharedProtocol, existingSupplements, recipientTimeBlocks] = await Promise.all([
		getSharedProtocol(token),
		getSupplementSummaries(userId),
		getTimeBlockSummaries(userId),
	]);

	if (!sharedProtocol) notFound();

	const sharedNames = sharedProtocol.supplements.map((s) => s.name);
	const matchedIds = await matchShareSupplements(sharedNames, existingSupplements);

	const timeBlocksToCreate: { tempId: string; name: string; icon: string; startTime: string }[] =
		[];

	function resolveTimeBlockId(schedule: SharedScheduleData): string {
		const match = recipientTimeBlocks.find(
			(tb) =>
				tb.name.toLowerCase() === schedule.timeBlockName.toLowerCase() &&
				tb.startTime === schedule.timeBlockStartTime,
		);
		if (match) return match.id;

		const existing = timeBlocksToCreate.find(
			(tb) => tb.name === schedule.timeBlockName && tb.startTime === schedule.timeBlockStartTime,
		);
		if (existing) return existing.tempId;

		const tempId = crypto.randomUUID();
		timeBlocksToCreate.push({
			tempId,
			name: schedule.timeBlockName,
			icon: schedule.timeBlockIcon,
			startTime: schedule.timeBlockStartTime,
		});
		return tempId;
	}

	const allTimeBlocks = [
		...recipientTimeBlocks,
		...timeBlocksToCreate.map((tb) => ({ id: tb.tempId, name: tb.name, startTime: tb.startTime })),
	];

	const parsedSupplements = sharedProtocol.supplements.map((s, i) => ({
		name: s.name,
		existingSupplementId: matchedIds[i] ?? null,
		brandName: null,
		category: s.category,
		isCritical: false,
		schedules: s.schedules.map((sch) => ({
			timeBlockId: resolveTimeBlockId(sch),
			dosageAmount: sch.dosageAmount,
			dosageUnit: sch.dosageUnit,
			notes: sch.notes,
			isCritical: sch.isCritical,
			cycleDaysOn: sch.cycleDaysOn,
			cycleDaysOff: sch.cycleDaysOff,
			startDayOffset: sch.startDayOffset,
			durationDays: sch.durationDays,
			dosageIntervalMinutes: sch.dosageIntervalMinutes,
			waitAfterTakingMinutes: sch.waitAfterTakingMinutes,
			finishPackage: sch.finishPackage,
			sortOrder: sch.sortOrder,
		})),
		confidence: 1,
	}));

	const initialSupplements = toIdentifiedSupplements(parsedSupplements as any);

	return (
		<ImportProtocolPage
			shareToken={token}
			protocolName={sharedProtocol.protocolName}
			initialSupplements={initialSupplements}
			existingSupplements={existingSupplements}
			timeBlocks={allTimeBlocks}
			timeBlocksToCreate={timeBlocksToCreate}
		/>
	);
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
pnpm build 2>&1 | head -60
```

Fix any type errors. Common issues:
- `toIdentifiedSupplements` expects `ParsedSupplement[]` — ensure the shape matches `parsedSupplementSchema`
- `allTimeBlocks` type must match `TimeBlockSummary[]`

- [ ] **Step 5: Run all tests**

```bash
pnpm test
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/share/ src/shared/i18n/messages/pl.json
git commit -m "feat: add /share/[token] route and i18n keys"
```

---

### Task 13: Final verification

- [ ] **Step 1: Start dev server and test the full flow**

```bash
pnpm dev
```

Test owner flow:
1. Log in, go to `/settings`
2. Find an active protocol
3. Click "Udostępnij" → verify link appears
4. Click "Kopiuj" → paste in browser → verify it redirects to login when in incognito (or shows form when logged in)
5. Click "Unieważnij" → verify link disappears, token removed

Test recipient flow:
1. Log in as different user (or same user in same browser)
2. Open share link
3. Verify form pre-populated with protocol data
4. Modify one supplement → click "Importuj protokół"
5. Verify redirected to preview page
6. Activate protocol → verify it appears in settings

- [ ] **Step 2: Check LSP diagnostics**

In your IDE, check for any red underlines in the new files. Fix any type errors.

- [ ] **Step 3: Run knip (unused exports check)**

```bash
pnpm knip
```

Fix any reported unused exports by adding them to the appropriate `index.ts` barrel or removing them if unused.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: protocol sharing — complete implementation"
```
