/** `import.meta.glob` result ("./images/kunafa.webp" -> bundled URL) keyed by file name only ("kunafa.webp"). */
export const imagesIn = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split("/").pop()!, url]))
