const match = (str: string, regExp: RegExp) => regExp.test(str.trim().toLocaleLowerCase());

function matcher(regExp: RegExp) {
	return (str: string) => match(str, regExp);
}

export const isCourse = matcher(/^(cs|math|stat|cics|info)\s*\d{3}[a-z]*$/);

export const isResidential = matcher(
	/^(central|orchard hill|northeast|southwest|honors|sylvan|off-campus|rap data science|rap ethics society)$/,
);

export const isGraduationStatus = matcher(/^(alumni|graduate student|class of \d{4})$/);

export function isCICSCourse(str: string): boolean {
	return isCourse(str) && match(str, /^(compsci|cs|cics|info)/);
}

export function isMathCourse(str: string): boolean {
	return isCourse(str) && match(str, /^(math|stat)/);
}

export const isInterdisciplinary = matcher(/^(business|linguistics|physics)$/);

export const isPronoun = matcher(/^(he\/him|she\/her|they\/them|ze\/hir)$/);

export const isMisc = matcher(/^(snooper|daily coding problems|community events|international)$/);

export function isAssignable(str: string): boolean {
	return (
		isCourse(str) ||
		isInterdisciplinary(str) ||
		isMisc(str) ||
		isGraduationStatus(str) ||
		isResidential(str) ||
		isPronoun(str)
	);
}
