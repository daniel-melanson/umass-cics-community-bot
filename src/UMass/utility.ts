export function sanitize(str: string): string {
	str = str.toLowerCase().trim();

	while (str.search(/\s\s/) != -1) str.replaceAll(/\s\s/, " ");

	return str;
}
