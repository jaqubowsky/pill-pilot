"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, ActionErrorCode, authActionClient } from "@/shared/lib/safe-action";
import { supplementScheduleRepository } from "@/shared/repositories/supplement-schedule-repository";
import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

const schema = z.object({
	timeBlockId: z.string(),
});

export const deleteTimeBlock = authActionClient
	.inputSchema(schema)
	.action(async ({ parsedInput: { timeBlockId }, ctx: { userId } }) => {
		await timeBlockRepository.findByIdAndUserId(timeBlockId, userId);

		const hasActive =
			await supplementScheduleRepository.hasActiveSchedulesForTimeBlock(timeBlockId);

		if (hasActive) {
			throw new ActionError(ActionErrorCode.HAS_ACTIVE_SCHEDULES);
		}

		await timeBlockRepository.softDelete(timeBlockId);

		revalidatePath("/settings");
		revalidatePath("/dashboard");
	});
