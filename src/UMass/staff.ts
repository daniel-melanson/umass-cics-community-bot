import { connectToCollection } from "UMass/database";
import { Staff } from "UMass/types";
import { sanitize } from "Shared/stringUtil";

export async function getStaffListFromQuery(query: string): Promise<Array<Staff>> {
	query = sanitize(query);

	const staffCollection = await connectToCollection("staff");
	return staffCollection
		.aggregate([
			{ $match: { $text: { $search: query } } },
			{ $addFields: { _score: { $divide: [{ $meta: "textScore" }, { $size: "$names" }] } } },
			{ $sort: { _score: -1 } },
			{ $match: { _score: { $gt: 0.5 } } },
		])
		.toArray() as Promise<Array<Staff>>;
}
