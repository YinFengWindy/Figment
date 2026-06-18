export function extractMentionTitles(input: string) {
  return Array.from(input.matchAll(/@([^\s@]+)/g), (match) => match[1]);
}
