export function sanitize(str: string): string {
  str = str.toLowerCase().trim();

  while (str.search(/\s\s/) != -1) str.replaceAll(/\s\s/g, " ");

  return str;
}

export function capitalize(str: string): string {
  return str[0].toUpperCase() + str.substring(1);
}

export function splitCamelCase(str: string): string {
  return capitalize(str).replace(/(?<=[a-z])(?=[A-Z])/g, " ");
}

export function oneLine(str: string): string {
  return str.replace(/(\n(\s*))+/g, " ");
}
