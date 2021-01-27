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
			{ $addFields: { _score: { $divide: [{ $meta: "textScore" }, { $size: "$names" }] } } },
			{ $sort: { _score: -1 } },
			{ $match: { _score: { $gt: 0.45 } } },
		])
		.toArray() as Promise<Array<ScoredStaff>>;
}
