// Shared-expense categories. Stored on RoommateExpense.categoryKey.
// Keep keys stable; localized labels live in dictionaries under `roommate.cat.<key>`.

export type RoommateCategoryKey =
  | "rent"
  | "electricity"
  | "internet"
  | "food"
  | "cleaning"
  | "house"
  | "other";

export interface RoommateCategory {
  key: RoommateCategoryKey;
  emoji: string;
  /** English fallback label; UI must prefer the translated value. */
  defaultLabel: string;
}

export const ROOMMATE_CATEGORIES: ReadonlyArray<RoommateCategory> = [
  { key: "rent", emoji: "🏠", defaultLabel: "Rent" },
  { key: "electricity", emoji: "💡", defaultLabel: "Electricity" },
  { key: "internet", emoji: "🌐", defaultLabel: "Internet" },
  { key: "food", emoji: "🍲", defaultLabel: "Food" },
  { key: "cleaning", emoji: "🧹", defaultLabel: "Cleaning" },
  { key: "house", emoji: "🛒", defaultLabel: "House necessities" },
  { key: "other", emoji: "📦", defaultLabel: "Other" },
];

const KEYS = new Set(ROOMMATE_CATEGORIES.map((c) => c.key));

export function isRoommateCategory(value: string): value is RoommateCategoryKey {
  return KEYS.has(value as RoommateCategoryKey);
}

export function getRoommateCategory(
  key: string
): RoommateCategory | undefined {
  return ROOMMATE_CATEGORIES.find((c) => c.key === key);
}
