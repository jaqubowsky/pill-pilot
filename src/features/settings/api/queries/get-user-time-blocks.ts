import { timeBlockRepository } from "@/shared/repositories/time-block-repository";

export type UserTimeBlock = {
	id: string;
	name: string;
	icon: string;
	startTime: string;
	sortOrder: number;
	active: boolean;
};

export async function getUserTimeBlocks(userId: string): Promise<UserTimeBlock[]> {
	return timeBlockRepository.findByUserId(userId);
}
