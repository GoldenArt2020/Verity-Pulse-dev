export interface TitleIdea {
  title: string;
  formula: string;
  inspiredBy: string;
}

/**
 * Normalizes titleIdeas from either the new {title, formula, inspiredBy}
 * shape or the legacy plain-string shape (angles rows created before this
 * change) into a consistent TitleIdea[] the UI can always rely on.
 */
export function normalizeTitleIdeas(raw: unknown): TitleIdea[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): TitleIdea | null => {
      if (typeof item === "string") {
        const title = item.trim();
        return title ? { title, formula: "", inspiredBy: "" } : null;
      }
      if (item && typeof item === "object" && "title" in item) {
        const obj = item as Partial<TitleIdea>;
        const title = String(obj.title ?? "").trim();
        if (!title) return null;
        return {
          title,
          formula: String(obj.formula ?? "").trim(),
          inspiredBy: String(obj.inspiredBy ?? "").trim(),
        };
      }
      return null;
    })
    .filter((v): v is TitleIdea => v !== null);
}