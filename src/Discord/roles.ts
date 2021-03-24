function matcher(regExp: RegExp) {
	return (str: string) => regExp.test(str.trim());
}

export const isClass = matcher(/^(cs|math|stat|cics|info)\s*\d{3}[a-z]*$/im);
export const isResidential = matcher(/^(central|ohill|northeast|southwest|honors|sylvan|off-campus)$/im);
export const isGraduationStatus = matcher(/^(alumni|graduate student|class of \d{4})$/im);
export const isInterdisciplinary = matcher(/^(business|linguistics|physics|psychology)$/im);
export const isMisc = matcher(/^(snooper|daily coding problems|community events)$/im);
export const isPronoun = matcher(/^(he\/him|she\/her|they\/them|ze\/hir)$/im);
export const isHobby = matcher(
	/^(music|video games|personal finance|food|travel and urbex|sports|personal projects|pet pics|anime|fitness|hardware|linux|international|outfits)$/im,
);
export const isConcentration = matcher(
	/^(computer science|informatics|mathematics and statistics|computer engineering|non-cs \(other\))$/im,
);

const csMatcher = matcher(/^(cs|info|cics)/im);
export function isCSClass(str: string): boolean {
	return isClass(str) && csMatcher(str);
}

const mathMatcher = matcher(/^(math|stat)/im);
export function isMathClass(str: string): boolean {
	return isClass(str) && mathMatcher(str);
}

export function isAssignable(str: string): boolean {
	return (
		isClass(str) ||
		isInterdisciplinary(str) ||
		isGraduationStatus(str) ||
		isResidential(str) ||
		isPronoun(str) ||
		isMisc(str) ||
		isHobby(str) ||
		isConcentration(str)
	);
}
