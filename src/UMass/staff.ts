import { connectToCollection } from "UMass/database";
import { Staff } from "UMass/types";
import { sanitize } from "UMass/utility";

export async function getStaffListFromQuery(query: string): Promise<Array<Staff>> {
	query = sanitize(query);

	const staffCollection = await connectToCollection("staff");
	return staffCollection
		.aggregate([
			{ $match: { $text: { $search: query } } },
			{ $sort: { score: { $meta: "textScore" } } },
			{ $match: { score: { $gt: 0.75 } } },
		])
		.toArray();
}
