import url from "url";
import type { Term } from "./spire-api.types";

const BASE_URL = "https://spire-api.melanson.dev";

async function json(url: string): Promise<any> {
  const response = await fetch(url);
  return response.json();
}

export function fetchCurrentTerms(): Promise<Term[]> {
  return json(url.resolve(BASE_URL, "/current-terms"));
}
