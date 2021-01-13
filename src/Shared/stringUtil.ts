export function sanitize(str: string): string {
	str = str.toLowerCase().trim();

	while (str.search(/\s\s/)) str = str.replace(/\s\s/g, " ");

	return str;
}
