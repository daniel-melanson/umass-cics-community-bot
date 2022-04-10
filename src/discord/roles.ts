function matcher(regExp: RegExp) {
  return (str: string) => regExp.test(str.trim());
}

export const isClass = matcher(/^(cs|math|stat|cics|info)\s*\d{3}[a-z]*$/i);
export const isResidential = matcher(/^(central|ohill|northeast|southwest|honors|sylvan|off-campus)$/i);
export const isGraduationStatus = matcher(/^(alumni|graduate student|class of \d{4})$/i);
export const isInterdisciplinary = matcher(/^(business|linguistics|physics|psychology)$/i);
export const isMisc = matcher(/^(snooper|daily coding problems|community events)$/i);
export const isPronoun = matcher(/^(he\/him|she\/her|they\/them|ze\/hir)$/i);
export const isHobby = matcher(
  /^(movies and tv|music|video games|personal finance|books|food|travel and urbex|sports|personal projects|pet pics|anime|fitness|hardware|linux|international|outfits)$/i,
);
export const isConcentration = matcher(
  /^(computer science|informatics|mathematics and statistics|computer engineering|non-cs \(other\))$/i,
);

function classMatcher(regExp: RegExp) {
  return (str: string) => isClass(str) && regExp.test(str.trim());
}

export const isCICSClass = classMatcher(/^cics/i);
export const isCSClass = classMatcher(/^cs/i);
export const isINFOClass = classMatcher(/^info/i);
export const isMATHClass = classMatcher(/^math/i);
export const isSTATClass = classMatcher(/^stat/i);

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
