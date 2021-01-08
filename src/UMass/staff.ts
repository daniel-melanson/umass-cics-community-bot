import { connectToCollection } from "UMass/database";
import { Staff } from "UMass/types";

export async function getStaffListFromQuery(query: string): Promise<Array<Staff>> {
	query = query.trim();
	query = query.toLowerCase();
	while (query.includes("  ")) query.replaceAll("  ", " ");

	const staffCollection = await connectToCollection("staff");
	return staffCollection
		.aggregate([
			{ $match: { $text: { $search: query } } },
			{ $sort: { score: { $meta: "textScore" } } },
			{ $match: { score: { $gt: 0.75 } } },
		])
		.toArray();
}
