// Ethiopian middle-class budget categories with default percentages.

export type CategoryType = "expense" | "income";

export interface CategoryDef {
  key: string;
  name: string;
  emoji: string;
  type: CategoryType;
  defaultPercent?: number; // for expenses, share of monthly salary
}

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { key: "rent", name: "Rent", emoji: "🏠", type: "expense", defaultPercent: 25 },
  { key: "groceries", name: "Groceries", emoji: "🛒", type: "expense", defaultPercent: 20 },
  { key: "transportation", name: "Transportation", emoji: "🚌", type: "expense", defaultPercent: 10 },
  { key: "utilities", name: "Utilities", emoji: "💡", type: "expense", defaultPercent: 7 },
  { key: "savings", name: "Savings", emoji: "💰", type: "expense", defaultPercent: 10 },
  { key: "emergency", name: "Emergency Fund", emoji: "🚨", type: "expense", defaultPercent: 5 },
  { key: "medication", name: "Medication / Health", emoji: "💊", type: "expense", defaultPercent: 5 },
  { key: "family_support", name: "Family Support", emoji: "👨‍👩‍👧", type: "expense", defaultPercent: 5 },
  { key: "internet", name: "Internet / Communication", emoji: "📶", type: "expense", defaultPercent: 3 },
  { key: "entertainment", name: "Entertainment", emoji: "🎬", type: "expense", defaultPercent: 5 },
  { key: "education", name: "Education", emoji: "📚", type: "expense", defaultPercent: 3 },
  { key: "charity", name: "Charity / Tithe", emoji: "🤲", type: "expense", defaultPercent: 0 },
  { key: "clothing", name: "Clothing", emoji: "👕", type: "expense", defaultPercent: 0 },
  { key: "personal_care", name: "Personal Care", emoji: "💈", type: "expense", defaultPercent: 0 },
  { key: "debt", name: "Debt Payment", emoji: "💳", type: "expense", defaultPercent: 0 },
  { key: "other_expense", name: "Other", emoji: "📦", type: "expense", defaultPercent: 2 },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { key: "salary", name: "Monthly Salary", emoji: "💼", type: "income" },
  { key: "freelance", name: "Freelance", emoji: "💻", type: "income" },
  { key: "business", name: "Business Income", emoji: "🏪", type: "income" },
  { key: "family_received", name: "Family Support Received", emoji: "👨‍👩‍👧", type: "income" },
  { key: "bonus", name: "Bonus", emoji: "🎁", type: "income" },
  { key: "gift", name: "Gift", emoji: "🎀", type: "income" },
  { key: "refund", name: "Refund", emoji: "↩️", type: "income" },
  { key: "other_income", name: "Other Income", emoji: "💵", type: "income" },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategory(key: string): CategoryDef | undefined {
  return ALL_CATEGORIES.find((c) => c.key === key);
}

export function getCategoryName(key: string | null | undefined): string {
  if (!key) return "Uncategorized";
  return getCategory(key)?.name ?? key;
}

export function getCategoryEmoji(key: string | null | undefined): string {
  if (!key) return "❓";
  return getCategory(key)?.emoji ?? "📦";
}

export const PAYMENT_METHODS = [
  { key: "cash", name: "Cash" },
  { key: "telebirr", name: "telebirr" },
  { key: "bank_transfer", name: "Bank Transfer" },
  { key: "mobile_banking", name: "Mobile Banking" },
  { key: "chapa", name: "Chapa" },
  { key: "other", name: "Other" },
] as const;
