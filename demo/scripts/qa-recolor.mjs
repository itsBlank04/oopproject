import { readFileSync, writeFileSync, existsSync } from 'fs';

const root = 'C:/Users/creaz/OneDrive/Desktop/ATOM/demo/frontend';

// ─── Consolidation map: 82 colors → 12 core tokens ───
const m = {
  // Primary text: #221b16
  '#1a1512': '#221b16',
  '#1a1a1a': '#221b16',

  // Secondary text: #6c5b4f
  '#4f4035': '#6c5b4f',
  '#5c4e42': '#6c5b4f',
  '#5c4a3c': '#6c5b4f',
  '#6d5d50': '#6c5b4f',
  '#7a6858': '#6c5b4f',

  // Muted text / labels: #8c7564
  '#a28672': '#8c7564',
  '#8a7a6a': '#8c7564',
  '#a89280': '#8c7564',
  '#a89a85': '#8c7564',
  '#8a6c4e': '#8c7564',
  '#9a9a9a': '#8c7564',

  // Borders / dividers: #e4d6c8
  '#d7c7b8': '#e4d6c8',
  '#dccfc2': '#e4d6c8',
  '#e3d6c9': '#e4d6c8',
  '#c8bdb5': '#e4d6c8',
  '#b8a494': '#e4d6c8',
  '#c8b8a8': '#e4d6c8',
  '#d0c0b0': '#e4d6c8',
  '#bfb0a0': '#e4d6c8',
  '#dfcbb5': '#e4d6c8',
  '#dcc5ad': '#e4d6c8',
  '#e0d0bd': '#e4d6c8',
  '#e8e8e8': '#e4d6c8',

  // Card / section backgrounds: #f9f5f0
  '#f0e8df': '#f9f5f0',
  '#f5f0eb': '#f9f5f0',
  '#f6f1ea': '#f9f5f0',
  '#faf8f6': '#f9f5f0',
  '#fcf6ef': '#f9f5f0',
  '#f7f0e8': '#f9f5f0',
  '#f1e9e0': '#f9f5f0',
  '#f5ede4': '#f9f5f0',
  '#faf7f3': '#f9f5f0',
  '#faf7f4': '#f9f5f0',
  '#faf6f1': '#f9f5f0',
  '#f8f5f0': '#f9f5f0',
  '#efe6dd': '#f9f5f0',
  '#f0e8e0': '#f9f5f0',
  '#e8ddd0': '#f9f5f0',
  '#e8ddd4': '#f9f5f0',
  '#e7ddd3': '#f9f5f0',
  '#f2ebe2': '#f9f5f0',
  '#e8dcd0': '#f9f5f0',
  '#f5f5f5': '#f9f5f0',

  // Page / surface background: #faf6f2
  '#fcfbfa': '#faf6f2',

  // Dark hover / active: #3a3028
  '#2d241e': '#3a3028',
  '#3a2f28': '#3a3028',
  '#3a2d24': '#3a3028',
  '#2e261f': '#3a3028',
  '#2a2a2a': '#3a3028',

  // Accent (muted gold, replaces harsh orange): #c4956a
  '#ee5a24': '#c4956a',
  '#e07b3f': '#c4956a',
  '#d94d1a': '#c4956a',
  '#d98c47': '#c4956a',
  '#f47321': '#c4956a',
  '#a07850': '#c4956a',
  '#d4a85a': '#c4956a',

  // AuthModal gray consolidation
  '#6b6b6b': '#6c5b4f',
  '#8a8a8a': '#8c7564',
};

const files = [
  'src/index.css',
  'src/components/Navbar.tsx', 'src/components/Footer.tsx', 'src/components/Sidebar.tsx',
  'src/components/AuthModal.tsx', 'src/components/AuctionCountdown.tsx',
  'src/components/ResultDialog.tsx', 'src/components/ConfirmDialog.tsx',
  'src/components/HotProducts.tsx', 'src/components/AuctionHighlight.tsx',
  'src/components/CategoryGrid.tsx', 'src/components/HeroSection.tsx',
  'src/components/ImageLightbox.tsx', 'src/components/MediaUploader.tsx',
  'src/components/ProductCard.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/account/ProfilePage.tsx', 'src/pages/account/AccountOrdersPage.tsx',
  'src/pages/account/MessagesPage.tsx', 'src/pages/account/WishlistPage.tsx',
  'src/pages/account/AddressesPage.tsx', 'src/pages/account/NotificationsPage.tsx',
  'src/pages/cart/CartPage.tsx', 'src/pages/cart/CheckoutPage.tsx',
  'src/pages/cart/OrderSuccessPage.tsx',
  'src/pages/products/ProductListPage.tsx', 'src/pages/products/ProductDetailPage.tsx',
  'src/pages/auctions/AuctionsPage.tsx', 'src/pages/auctions/AuctionDetailPage.tsx',
  'src/pages/used/UsedListingDetailPage.tsx', 'src/pages/used/CreateUsedListingPage.tsx',
  'src/pages/vendor/VendorDashboardPage.tsx', 'src/pages/vendor/VendorShopPage.tsx',
  'src/pages/vendor/VendorShopManagerPage.tsx', 'src/pages/vendor/VendorShopSetupPage.tsx',
  'src/pages/vendor/VendorProductsPage.tsx', 'src/pages/vendor/VendorOrdersPage.tsx',
  'src/pages/vendor/VendorAuctionsPage.tsx', 'src/pages/vendor/VendorSubscriptionsPage.tsx',
  'src/pages/vendor/VendorFinancialPage.tsx', 'src/pages/vendor/VendorReviewsPage.tsx',
  'src/pages/admin/AdminDashboardPage.tsx',
];

let totalChanges = 0;

for (const f of files) {
  const fp = `${root}/${f}`;
  if (!existsSync(fp)) { console.warn(`  ✗ ${f}`); continue; }
  let content = readFileSync(fp, 'utf8');
  let changed = false;
  for (const [oldC, newC] of Object.entries(m)) {
    if (content.includes(oldC)) {
      content = content.replaceAll(oldC, newC);
      changed = true;
      totalChanges++;
    }
  }
  if (changed) {
    writeFileSync(fp, content, 'utf8');
    console.log(`  ✓ ${f}`);
  }
}
console.log(`\nTotal color replacements: ${totalChanges}`);
