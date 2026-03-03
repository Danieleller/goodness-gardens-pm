-- Seed the categories table with the 5 standard categories
INSERT OR IGNORE INTO categories (id, name, display_name, color, sort_order, created_at)
VALUES
  (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), 'Sales', 'Sales', 'bg-rose-50 border-rose-200', 0, unixepoch()),
  (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), 'ProductDev', 'Product Dev', 'bg-sky-50 border-sky-200', 1, unixepoch()),
  (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), 'Operations', 'Operations', 'bg-emerald-50 border-emerald-200', 2, unixepoch()),
  (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), 'Finance', 'Finance', 'bg-amber-50 border-amber-200', 3, unixepoch()),
  (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6))), 'Other', 'Other', 'bg-stone-50 border-stone-200', 4, unixepoch());
