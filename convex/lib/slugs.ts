export function slugify(value: string): string {
  const ascii = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (ascii) {
    return ascii;
  }

  const fallback = value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return fallback.replace(/^-+|-+$/g, "") || `item-${Date.now()}`;
}
