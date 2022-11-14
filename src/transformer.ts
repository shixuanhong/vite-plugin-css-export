export function kebabCaseToUpperCamelCase(name: string): string {
  return name.split('-').map((item) =>
    Array.from(item).map((char, j) => j === 0 ? char.toUpperCase() : char.toLowerCase()).join('')
  ).join('')

}

export function kebabCaseToLowerCamelCase(name: string): string {
  return name.split('-').map((item, i) =>
    Array.from(item).map((char, j) => i !== 0 && j === 0 ? char.toUpperCase() : char.toLowerCase()).join('')
  ).join('')
}

export const kebabCaseToPascalCase = kebabCaseToUpperCamelCase