const DICT_LIMIT = 0x10000

export function compress(input: string): string {
  if (!input) return input

  const dict = new Map<string, number>()
  for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), i)
  let dictSize = 256

  let current = ''
  const output: number[] = []

  for (const char of input) {
    const combined = current + char
    if (dict.has(combined)) {
      current = combined
      continue
    }
    output.push(dict.get(current) as number)
    if (dictSize < DICT_LIMIT) dict.set(combined, dictSize++)
    current = char
  }
  if (current) output.push(dict.get(current) as number)

  return output.map((code) => String.fromCharCode(code)).join('')
}

export function decompress(input: string): string {
  if (!input) return input

  const dict = new Map<number, string>()
  for (let i = 0; i < 256; i++) dict.set(i, String.fromCharCode(i))
  let dictSize = 256

  const codes = Array.from(input, (char) => char.charCodeAt(0))
  let current = dict.get(codes[0]) as string
  let result = current

  for (let i = 1; i < codes.length; i++) {
    const code = codes[i]
    let entry: string
    if (dict.has(code)) {
      entry = dict.get(code) as string
    } else if (code === dictSize) {
      entry = current + current[0]
    } else {
      throw new Error('Secuencia comprimida inválida.')
    }
    result += entry
    if (dictSize < DICT_LIMIT) dict.set(dictSize++, current + entry[0])
    current = entry
  }

  return result
}
