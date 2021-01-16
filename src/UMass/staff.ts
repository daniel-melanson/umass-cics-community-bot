import { connectToCollection } from "UMass/database";
import { Staff } from "UMass/types";
import { sanitize } from "Shared/stringUtil";

interface ScoredStaff extends Staff {
	_score: number;
}

export async function getStaffListFromQuery(query: string): Promise<Array<ScoredStaff>> {
	query = sanitize(query);

	const staffCollection = await connectToCollection("staff");
	return staffCollection
		.aggregate([
			{ $match: { $text: { $search: query } } },
			{ $addFields: { _score: { $meta: "textScore" } } },
			{ $match: { _score: { $gt: 0.5 } } },
		])
		.toArray() as Promise<Array<ScoredStaff>>;
}
