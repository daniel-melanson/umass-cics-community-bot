import { sanitize } from "#shared/stringUtil";

import { connectToCollection } from "./database";
import { Staff } from "./types";

export interface ScoredStaff extends Staff {
  _score: number;
}

export async function getStaffListFromQuery(query: string): Promise<Array<ScoredStaff>> {
  query = sanitize(query);

  return connectToCollection(
    "staff",
    staffCollection =>
      staffCollection
        .aggregate([
          {
            $search: {
              index: "default",
              text: {
                query: query,
                path: "names",
                fuzzy: {},
              },
            },
          },
        ])
        .toArray() as Promise<Array<ScoredStaff>>,
  );
}
