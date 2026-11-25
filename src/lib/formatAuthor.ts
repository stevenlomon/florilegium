const SURNAME_PARTICLES = ['van', 'von', 'de', 'di', 'del', 'le', 'la', 'el', 'dos', 'du'];

const FILTERED_AUTHORS = ['sparknotes', 'cliffsnotes', 'shmoop'];

const CJK_RANGE = /[　-鿿가-힯豈-﫿]/;

export function formatAuthorName(name: string): string {
  const cleaned = name.replace(/ʹ/g, '').trim();

  if (!cleaned) return 'Unknown Author';

  if (CJK_RANGE.test(cleaned)) return cleaned;

  const suffixMatch = cleaned.match(/,\s*(Jr\.?|Sr\.?|II|III|IV|V)\s*$/i);
  if (suffixMatch) {
    const withoutSuffix = cleaned.slice(0, suffixMatch.index!).trim();
    const suffix = suffixMatch[1];
    if (!withoutSuffix.includes(',')) {
      const formatted = formatAuthorName(withoutSuffix);
      return formatted.includes(',')
        ? formatted.replace(',', ' ' + suffix + ',')
        : formatted + ' ' + suffix;
    }
    return cleaned;
  }

  if (cleaned.includes(',')) return cleaned;

  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return cleaned;

  for (let i = 1; i < parts.length - 1; i++) {
    const lower = parts[i].toLowerCase();
    if (SURNAME_PARTICLES.includes(lower)) {
      const isCapitalized = parts[i][0] === parts[i][0].toUpperCase() && parts[i][0] !== parts[i][0].toLowerCase();

      if (isCapitalized) {
        const surname = parts.slice(i).join(' ');
        const given = parts.slice(0, i).join(' ');
        return `${surname}, ${given}`;
      } else {
        let j = i;
        while (j < parts.length - 1 && SURNAME_PARTICLES.includes(parts[j].toLowerCase())) {
          j++;
        }
        const surname = parts.slice(j).join(' ');
        const given = parts.slice(0, j).join(' ');
        return `${surname}, ${given}`;
      }
    }
  }

  const surname = parts[parts.length - 1];
  const given = parts.slice(0, -1).join(' ');
  return `${surname}, ${given}`;
}

export function formatAuthors(authors: { name: string }[]): string {
  const formatted = authors
    .filter(a => !FILTERED_AUTHORS.includes(a.name.toLowerCase().trim()))
    .map(a => formatAuthorName(a.name));

  const deduped = [...new Map(formatted.map(name => [name.toLowerCase(), name])).values()];

  return deduped.join('; ') || 'Unknown Author';
}
