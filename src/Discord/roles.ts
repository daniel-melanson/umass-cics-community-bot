export function isClass(str: string): boolean {
	return new RegExp(/^(cs|math|stat|cics|info)\s*\d{3}[a-z]*$/i).test(str.trim());
}
