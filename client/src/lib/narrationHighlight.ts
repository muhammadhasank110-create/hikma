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
