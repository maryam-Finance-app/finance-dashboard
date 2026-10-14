// Shared formatters, so the currency and date style live in one place.

// Change "USD" to your currency
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: number) {
  return currency.format(value);
}

// "2026-10-13" -> "Oct 13, 2026". Built from the parts so the date
// can't shift by a day because of the timezone.
export function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}