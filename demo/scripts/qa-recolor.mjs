import { readFileSync, writeFileSync, existsSync } from 'fs';

const colorMap = {
  '#221b16': '#1e293b',  '#1a1512': '#1e293b',
  '#6c5b4f': '#64748b',  '#4f4035': '#475569',  '#5c4e42': '#64748b',
  '#6d5d50': '#64748b',  '#5c4a3c': '#64748b',  '#7a6858': '#64748b',
  '#8c7564': '#94A3B8',  '#a28672': '#94A3B8',  '#8a7a6a': '#94A3B8',
  '#a89280': '#94A3B8',  '#a89a85': '#94A3B8',  '#8a6c4e': '#94A3B8',
  '#e4d6c8': '#e0e7ff',  '#d7c7b8': '#cbd5e1',  '#dccfc2': '#e0e7ff',
  '#e3d6c9': '#e0e7ff',  '#dfcbb5': '#e0e7ff',  '#dcc5ad': '#e0e7ff',
  '#d0c0b0': '#cbd5e1',  '#c8bdb5': '#cbd5e1',  '#c8b8a8': '#cbd5e1',
  '#f9f5f0': '#f8fafc',  '#faf6f2': '#f8fafc',  '#f0e8df': '#eef2ff',
  '#f5f0eb': '#f8fafc',  '#fcfbfa': '#f8fafc',  '#f6f1ea': '#f8fafc',
  '#faf8f6': '#f8fafc',  '#fcf6ef': '#f8fafc',  '#f7f0e8': '#eef2ff',
  '#f1e9e0': '#eef2ff',  '#f5ede4': '#eef2ff',  '#faf7f3': '#f8fafc',
  '#faf7f4': '#f8fafc',  '#faf6f1': '#f8fafc',  '#f8f5f0': '#f8fafc',
  '#efe6dd': '#eef2ff',  '#f0e8e0': '#eef2ff',  '#e8ddd0': '#eef2ff',
  '#e8ddd4': '#eef2ff',  '#e7ddd3': '#eef2ff',  '#f2ebe2': '#eef2ff',
  '#e8dcd0': '#eef2ff',
  '#2d241e': '#334155',  '#3a3028': '#4338ca',  '#3a2f28': '#4338ca',
  '#3a2d24': '#4338ca',  '#2e261f': '#334155',
  '#e07b3f': '#4F46E5',  '#ee5a24': '#4F46E5',  '#d94d1a': '#4F46E5',
  '#d98c47': '#4F46E5',  '#f47321': '#4F46E5',
  '#c4956a': '#818cf8',  '#a07850': '#818cf8',  '#d4a85a': '#818cf8',
  '#b8a494': '#cbd5e1',
  '#1a1a1a': '#1e293b',  '#2a2a2a': '#334155',
  '#e8e8e8': '#e0e7ff',  '#9a9a9a': '#94A3B8',
};

const root = 'C:/Users/creaz/OneDrive/Desktop/ATOM/demo/frontend';

const files = [
  'src/index.css',
  'src/App.tsx', 'src/main.tsx',
  'src/components/Navbar.tsx', 'src/components/Footer.tsx', 'src/components/Sidebar.tsx',
  'src/components/AuthModal.tsx', 'src/components/SiteLayout.tsx',
  'src/components/AuctionCountdown.tsx', 'src/components/ResultDialog.tsx',
  'src/components/ConfirmDialog.tsx', 'src/components/ProductCard.tsx',
  'src/components/HotProducts.tsx', 'src/components/AuctionHighlight.tsx',
  'src/components/CategoryGrid.tsx', 'src/components/HeroSection.tsx',
  'src/components/RequireRole.tsx', 'src/components/ImageLightbox.tsx',
  'src/components/MediaUploader.tsx',
  'src/contexts/AuthContext.tsx', 'src/contexts/AuthModalContext.tsx',
  'src/hooks/useConfirmAction.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/account/ProfilePage.tsx', 'src/pages/account/AccountOrdersPage.tsx',
  'src/pages/account/MessagesPage.tsx', 'src/pages/account/WishlistPage.tsx',
  'src/pages/account/AddressesPage.tsx', 'src/pages/account/NotificationsPage.tsx',
  'src/pages/cart/CartPage.tsx', 'src/pages/cart/CheckoutPage.tsx',
  'src/pages/cart/OrderSuccessPage.tsx',
  'src/pages/products/ProductListPage.tsx', 'src/pages/products/ProductDetailPage.tsx',
  'src/pages/auctions/AuctionsPage.tsx', 'src/pages/auctions/AuctionDetailPage.tsx',
  'src/pages/used/UsedListingsPage.tsx', 'src/pages/used/UsedListingDetailPage.tsx',
  'src/pages/used/CreateUsedListingPage.tsx',
  'src/pages/vendor/VendorDashboardPage.tsx', 'src/pages/vendor/VendorShopPage.tsx',
  'src/pages/vendor/VendorShopManagerPage.tsx', 'src/pages/vendor/VendorShopSetupPage.tsx',
  'src/pages/vendor/VendorProductsPage.tsx', 'src/pages/vendor/VendorOrdersPage.tsx',
  'src/pages/vendor/VendorAuctionsPage.tsx', 'src/pages/vendor/VendorSubscriptionsPage.tsx',
  'src/pages/vendor/VendorFinancialPage.tsx', 'src/pages/vendor/VendorReviewsPage.tsx',
  'src/pages/repair/RepairRequestsPage.tsx', 'src/pages/repair/TechniciansPage.tsx',
  'src/pages/repair/TechnicianDashboardPage.tsx', 'src/pages/repair/TechnicianDetailPage.tsx',
  'src/pages/repair/RepairRequestDetailPage.tsx', 'src/pages/repair/RepairMarketplacePage.tsx',
  'src/pages/admin/AdminDashboardPage.tsx',
];

let totalChanges = 0;

for (const f of files) {
  const fp = `${root}/${f}`;
  if (!existsSync(fp)) { console.warn(`  ✗ ${f} (not found)`); continue; }
  let content = readFileSync(fp, 'utf8');
  let changed = false;
  for (const [oldC, newC] of Object.entries(colorMap)) {
    if (content.includes(oldC)) {
      const re = new RegExp(oldC.replace('#', '\\#'), 'g');
      const matches = content.match(re);
      if (matches) totalChanges += matches.length;
      content = content.replaceAll(oldC, newC);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(fp, content, 'utf8');
    console.log(`  ✓ ${f}`);
  }
}
console.log(`\nTotal replacements: ${totalChanges}`);
