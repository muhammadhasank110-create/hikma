export function getNarrationHighlightState({
  isNarrating,
  isFocused,
  highlightIndex,
  reduceMotion,
}: {
  isNarrating: boolean;
  isFocused: boolean;
  highlightIndex: number;
  reduceMotion: boolean;
}) {
  const shouldHighlight = isNarrating && highlightIndex >= 0;
  return {
    shouldHighlight,
    className: isFocused ? "tts-word-active tts-word-focus" : "tts-word-active",
    scrollBehavior: reduceMotion ? "auto" as const : "smooth" as const,
  };
}

/** Return the word containing (or immediately preceding) a TTS character boundary. */
export function findSpokenWordIndex(offsets: number[], charIndex: number) {
  if (!offsets.length) return -1;
  let low = 0;
  let high = offsets.length - 1;
  let result = 0;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (offsets[middle] <= charIndex) {
      result = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return result;
}
