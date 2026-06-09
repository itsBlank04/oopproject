<!-- Expert Repairs | AtomDrops Marketplace -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AtomDrops | Professional Repair Services Hub</title>
<!-- Google Fonts & Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .progress-line {
            background: linear-gradient(to right, #5a5d76 66%, #e1e3e5 66%);
        }
    </style>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "secondary-fixed": "#e1e3e5",
                    "on-tertiary-fixed": "#1f1c03",
                    "on-secondary-fixed-variant": "#444749",
                    "surface-dim": "#dcd9db",
                    "primary-fixed": "#dfe0fe",
                    "tertiary-fixed": "#eae4b8",
                    "primary-fixed-dim": "#c2c4e2",
                    "primary": "#5a5d76",
                    "on-tertiary": "#ffffff",
                    "error": "#ba1a1a",
                    "surface-container-low": "#f6f3f5",
                    "tertiary-fixed-dim": "#cec89e",
                    "on-primary": "#ffffff",
                    "primary-container": "#bfc1de",
                    "error-container": "#ffdad6",
                    "tertiary-container": "#cac49b",
                    "surface-container-highest": "#e5e1e4",
                    "surface-tint": "#5a5d76",
                    "on-primary-container": "#4c4f67",
                    "secondary": "#5c5f61",
                    "inverse-on-surface": "#f3f0f2",
                    "tertiary": "#635f3d",
                    "on-primary-fixed": "#171a30",
                    "surface-container-lowest": "#ffffff",
                    "on-tertiary-container": "#555130",
                    "secondary-container": "#e1e3e5",
                    "on-primary-fixed-variant": "#42455d",
                    "on-secondary-fixed": "#191c1e",
                    "surface-container": "#f0edef",
                    "outline-variant": "#c7c5cd",
                    "on-secondary-container": "#626567",
                    "outline": "#77767d",
                    "on-tertiary-fixed-variant": "#4b4828",
                    "surface-bright": "#fcf8fa",
                    "secondary-fixed-dim": "#c5c7c9",
                    "surface": "#fcf8fa",
                    "on-surface-variant": "#46464d",
                    "on-secondary": "#ffffff",
                    "on-error": "#ffffff",
                    "on-surface": "#1c1b1d",
                    "inverse-surface": "#313032",
                    "on-error-container": "#93000a",
                    "inverse-primary": "#c2c4e2",
                    "on-background": "#1c1b1d",
                    "background": "#fcf8fa",
                    "surface-variant": "#e5e1e4",
                    "surface-container-high": "#ebe7e9"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "2xl": "1rem",
                    "full": "9999px"
            },
            "spacing": {
                    "gutter": "32px",
                    "margin-mobile": "20px",
                    "margin-desktop": "64px",
                    "section-gap": "120px",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "body-lg": ["Inter"],
                    "headline-lg-mobile": ["Inter"],
                    "headline-lg": ["Inter"],
                    "display-hero": ["Inter"],
                    "label-sm": ["Inter"],
                    "body-md": ["Inter"],
                    "headline-md": ["Inter"],
                    "label-md": ["Inter"],
                    "headline-sm": ["Inter"]
            },
            "fontSize": {
                    "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-lg-mobile": ["32px", {"lineHeight": "1.2", "fontWeight": "600"}],
                    "headline-lg": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "display-hero": ["72px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
                    "label-sm": ["12px", {"lineHeight": "1.0", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-md": ["30px", {"lineHeight": "1.3", "fontWeight": "600"}],
                    "label-md": ["14px", {"lineHeight": "1.0", "letterSpacing": "0.02em", "fontWeight": "500"}],
                    "headline-sm": ["20px", {"lineHeight": "1.4", "fontWeight": "600"}]
            }
          },
        },
      }
    </script>
</head>
<body class="bg-background text-on-surface font-body-md overflow-x-hidden">
<!-- TopAppBar -->
<header class="sticky top-0 w-full bg-surface/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(15,23,42,0.05)] z-50">
<div class="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
<div class="font-headline-sm text-headline-sm font-bold text-primary">AtomDrops</div>
<nav class="hidden md:flex items-center gap-8">
<a class="text-on-surface-variant hover:text-primary transition-all duration-200 font-body-md text-body-md" href="#">New</a>
<a class="text-on-surface-variant hover:text-primary transition-all duration-200 font-body-md text-body-md" href="#">Used</a>
<a class="text-primary font-bold border-b-2 border-primary font-body-md text-body-md" href="#">Services</a>
<a class="text-on-surface-variant hover:text-primary transition-all duration-200 font-body-md text-body-md" href="#">Auctions</a>
</nav>
<div class="flex items-center gap-4">
<button class="p-2 rounded-full hover:bg-surface-container-low transition-all duration-200">
<span class="material-symbols-outlined text-primary">notifications</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-low transition-all duration-200">
<span class="material-symbols-outlined text-primary">account_circle</span>
</button>
</div>
</div>
</header>
<main>
<!-- Hero Section -->
<section class="relative pt-20 pb-16 overflow-hidden">
<div class="max-w-container-max mx-auto px-margin-desktop text-center relative z-10">
<h1 class="font-headline-lg text-headline-lg mb-8 max-w-3xl mx-auto">Expert repairs for your essential gear.</h1>
<div class="max-w-2xl mx-auto relative group">
<div class="absolute inset-0 bg-primary-container/20 blur-2xl group-hover:bg-primary-container/30 transition-all duration-500 rounded-full"></div>
<div class="relative flex items-center bg-surface-container-lowest border border-outline-variant p-2 rounded-full shadow-lg">
<span class="material-symbols-outlined ml-6 text-outline">search</span>
<input class="w-full bg-transparent border-none focus:ring-0 px-4 py-4 font-body-lg text-body-lg text-on-surface placeholder-outline" placeholder="What needs fixing? (e.g. Broken iPhone screen)" type="text"/>
<button class="bg-primary text-on-primary px-8 py-4 rounded-full font-label-md text-label-md hover:scale-105 active:scale-95 transition-transform">
                            Search
                        </button>
</div>
</div>
</div>
<!-- Decorative atmospheric elements -->
<div class="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl"></div>
<div class="absolute top-1/2 -left-24 w-64 h-64 bg-tertiary-container/10 rounded-full blur-3xl"></div>
</section>
<!-- Quick Category Selection -->
<section class="py-12 bg-surface-container-low">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="flex flex-wrap justify-center gap-12 md:gap-20">
<div class="flex flex-col items-center gap-4 group cursor-pointer">
<div class="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:translate-y-[-4px] transition-all duration-300">
<span class="material-symbols-outlined text-primary scale-125">devices</span>
</div>
<span class="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Electronics</span>
</div>
<div class="flex flex-col items-center gap-4 group cursor-pointer">
<div class="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:translate-y-[-4px] transition-all duration-300">
<span class="material-symbols-outlined text-primary scale-125">kitchen</span>
</div>
<span class="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Appliances</span>
</div>
<div class="flex flex-col items-center gap-4 group cursor-pointer">
<div class="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:translate-y-[-4px] transition-all duration-300">
<span class="material-symbols-outlined text-primary scale-125">chair</span>
</div>
<span class="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Furniture</span>
</div>
<div class="flex flex-col items-center gap-4 group cursor-pointer">
<div class="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:translate-y-[-4px] transition-all duration-300">
<span class="material-symbols-outlined text-primary scale-125">pedal_bike</span>
</div>
<span class="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Bicycles</span>
</div>
<div class="flex flex-col items-center gap-4 group cursor-pointer">
<div class="w-20 h-20 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:translate-y-[-4px] transition-all duration-300">
<span class="material-symbols-outlined text-primary scale-125">diamond</span>
</div>
<span class="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Jewelry</span>
</div>
</div>
</div>
</section>
<!-- Active Tracking Widget -->
<section class="py-section-gap">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="bg-surface-container-lowest rounded-2xl p-8 md:p-12 shadow-[0px_12px_30px_rgba(15,23,42,0.1)] border border-outline-variant/30 flex flex-col md:flex-row gap-12 items-center">
<div class="w-full md:w-1/3">
<div class="flex items-center gap-2 mb-4">
<span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span class="font-label-md text-label-md text-primary tracking-widest uppercase">Active Repair</span>
</div>
<h2 class="font-headline-sm text-headline-sm mb-2">MacBook Pro M1</h2>
<p class="text-on-surface-variant mb-6">Display Replacement &amp; Cleaning</p>
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
<span class="material-symbols-outlined text-primary">id_card</span>
</div>
<span class="font-label-md text-label-md text-on-surface">Ticket ID: #AD-99214</span>
</div>
</div>
<div class="w-full md:w-2/3">
<div class="relative">
<div class="absolute top-5 left-0 w-full h-1 bg-secondary-fixed rounded-full overflow-hidden">
<div class="progress-line h-full w-full"></div>
</div>
<div class="relative flex justify-between">
<div class="flex flex-col items-center gap-3 group">
<div class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center z-10 shadow-lg">
<span class="material-symbols-outlined text-[20px]">check</span>
</div>
<span class="font-label-md text-label-md text-primary font-bold">Received</span>
</div>
<div class="flex flex-col items-center gap-3 group">
<div class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center z-10 shadow-lg">
<span class="material-symbols-outlined text-[20px]">check</span>
</div>
<span class="font-label-md text-label-md text-primary font-bold">Diagnosed</span>
</div>
<div class="flex flex-col items-center gap-3 group">
<div class="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center z-10 shadow-lg border-4 border-background">
<span class="material-symbols-outlined text-[20px] animate-spin-slow">settings</span>
</div>
<span class="font-label-md text-label-md text-primary font-bold">Fixing</span>
</div>
<div class="flex flex-col items-center gap-3 group opacity-40">
<div class="w-10 h-10 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center z-10">
<span class="material-symbols-outlined text-[20px]">local_shipping</span>
</div>
<span class="font-label-md text-label-md">Return</span>
</div>
</div>
</div>
<div class="mt-12 bg-surface-container p-4 rounded-xl flex justify-between items-center">
<p class="text-body-md font-medium text-on-surface-variant">Estimated completion: Tomorrow, 4:00 PM</p>
<button class="text-primary font-bold hover:underline">View Live Update</button>
</div>
</div>
</div>
</div>
</section>
<!-- Featured Technicians -->
<section class="pb-section-gap">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="flex justify-between items-end mb-12">
<div>
<h2 class="font-headline-md text-headline-md mb-2">Top-Rated Pros</h2>
<p class="text-on-surface-variant max-w-lg">Certified technicians with guaranteed workmanship and premium parts.</p>
</div>
<button class="text-primary font-bold flex items-center gap-2 group hover:gap-4 transition-all duration-300">
                        View all experts <span class="material-symbols-outlined">arrow_forward</span>
</button>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
<!-- Tech Card 1 -->
<div class="bg-surface-container-lowest rounded-2xl overflow-hidden group hover:shadow-[0px_12px_30px_rgba(15,23,42,0.1)] transition-all duration-500 flex flex-col">
<div class="h-48 relative overflow-hidden">
<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" data-alt="A professional technician in a clean, minimalist workshop focusing on micro-soldering an electronic motherboard. The scene is lit with cool-toned clinical lighting, highlighting precision tools and a sophisticated tech atmosphere. Soft depth of field makes the subject pop against the high-end laboratory environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtymKjHuFE0Y736GYj5-YtjtM2DlVYAQjPX-dCDdee75Kw8_ZnpGACXc8U0hPTh5ni7I9xl00eeuRnvZdaLJSd7zvmlHxhPwtvIlztM3bSiZnsIA_nZWWXGRA5E8nE6E8kOqlapGUzLSstweP1P5GWJ8K4NqGcaDMvIiqFfCTYrd-FjpwrAomF0vtqrh-64QF_W_mLXLtTrqThCZGCIbxajcpRhJz10QQWKH8T63n_1Ia1TatOXX2EiRV9mDdPKMdtwejaF9dPFB0"/>
<div class="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
<span class="material-symbols-outlined text-tertiary text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-label-md font-bold">4.9</span>
</div>
</div>
<div class="p-6 flex-grow flex flex-col">
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-headline-sm text-headline-sm">Marcus Chen</h3>
<p class="text-on-surface-variant text-label-md">12 years experience</p>
</div>
<div class="bg-primary-container/20 text-primary-fixed-dim px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Master Tech</div>
</div>
<div class="flex flex-wrap gap-2 mb-8">
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">Apple Certified</span>
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">Microsoldering</span>
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">Data Recovery</span>
</div>
<button class="w-full mt-auto bg-primary text-on-primary py-4 rounded-xl font-label-md hover:bg-primary/90 transition-colors">Get Quote</button>
</div>
</div>
<!-- Tech Card 2 -->
<div class="bg-surface-container-lowest rounded-2xl overflow-hidden group hover:shadow-[0px_12px_30px_rgba(15,23,42,0.1)] transition-all duration-500 flex flex-col">
<div class="h-48 relative overflow-hidden">
<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" data-alt="A specialized home appliance repair expert inspecting a modern smart refrigerator in a bright, airy designer kitchen. The lighting is warm and natural, emphasizing the professional and reliable nature of the service. The image style is crisp, with a clear focus on technical expertise and premium customer care." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ_nT2eoB-B0SfokC2YmBOrUPSg3oVN_HNpWLXinzfxmO5gIrqEn54QN0UaOYyHYtVub0y2jUYI5sWodL66Mbnie3mire5brJozgXlnt5UetKwsrRId_-TtSe4msSz9r6Ai1wC1CwKPYVNWHG-_74CBZ1ihRyBqDk9dRw8ScPFEgsOISu1BxNShgBEZMkVTtyqmMxjlFN4AP8cdAsLN5Ix8T3Z7zaeIqGDRQZw-yuWZ0RqW2lVQxmg0MEhK_BwDQS3I2Yl3EFR3RM"/>
<div class="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
<span class="material-symbols-outlined text-tertiary text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-label-md font-bold">4.8</span>
</div>
</div>
<div class="p-6 flex-grow flex flex-col">
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-headline-sm text-headline-sm">Sarah Jenkins</h3>
<p class="text-on-surface-variant text-label-md">8 years experience</p>
</div>
<div class="bg-tertiary-container/20 text-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Fast Response</div>
</div>
<div class="flex flex-wrap gap-2 mb-8">
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">Smart Kitchen</span>
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">HVAC</span>
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">Eco-Friendly</span>
</div>
<button class="w-full mt-auto bg-primary text-on-primary py-4 rounded-xl font-label-md hover:bg-primary/90 transition-colors">Get Quote</button>
</div>
</div>
<!-- Tech Card 3 -->
<div class="bg-surface-container-lowest rounded-2xl overflow-hidden group hover:shadow-[0px_12px_30px_rgba(15,23,42,0.1)] transition-all duration-500 flex flex-col">
<div class="h-48 relative overflow-hidden">
<img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" data-alt="A artisan furniture restorer carefully working on a mid-century modern wooden chair in a sun-drenched, high-end studio. Wood shavings and fine tools are visible on the workbench, suggesting handcrafted precision and attention to detail. The aesthetic is warm, sophisticated, and earthy, echoing the quality of the restoration work." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyjZbpWlizZ1WF1GsCyE3FLDxBsSZDJi2cw7CW2kfNDK6E_jhAbf3aa9HXwdTg2h0zvBaphWEs9hL2r1Gx4JT6bs58TO2Uyy6hkLI2sWJEmV1PjEo3iQZ5AdGB32hYTH9umJtVqO-yVMFseADtqTmzVObT02olyMCP1IP4PabKPkX6TJHItzKcAQHmnB4UYa_voECrlGfqlAwTbUvKiHPNae0Xjd-Sm_UqrD7BkEYsGLjJEZHBuJM7e73TDSNQFCx17cM5yroieIs"/>
<div class="absolute top-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
<span class="material-symbols-outlined text-tertiary text-sm" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="text-label-md font-bold">5.0</span>
</div>
</div>
<div class="p-6 flex-grow flex flex-col">
<div class="flex justify-between items-start mb-4">
<div>
<h3 class="font-headline-sm text-headline-sm">Elena Rodriguez</h3>
<p class="text-on-surface-variant text-label-md">15 years experience</p>
</div>
<div class="bg-primary-container/20 text-primary-fixed-dim px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Specialist</div>
</div>
<div class="flex flex-wrap gap-2 mb-8">
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">Luxury Watches</span>
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">Jewelry Design</span>
<span class="bg-surface-container px-3 py-1 rounded-full text-label-sm text-on-surface-variant">Antique Restoral</span>
</div>
<button class="w-full mt-auto bg-primary text-on-primary py-4 rounded-xl font-label-md hover:bg-primary/90 transition-colors">Get Quote</button>
</div>
</div>
</div>
</div>
</section>
<!-- Guarantee Section (Trust Strip) -->
<section class="py-16 border-y border-outline-variant">
<div class="max-w-container-max mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-12">
<div class="flex gap-4">
<span class="material-symbols-outlined text-primary text-4xl">verified_user</span>
<div>
<h4 class="font-bold mb-1">AtomDrops Verified</h4>
<p class="text-on-surface-variant text-body-md">Every technician undergoes a rigorous 50-point background and skills check.</p>
</div>
</div>
<div class="flex gap-4">
<span class="material-symbols-outlined text-primary text-4xl">security</span>
<div>
<h4 class="font-bold mb-1">Repair Protection</h4>
<p class="text-on-surface-variant text-body-md">All services include a 12-month AtomDrops ecosystem warranty on parts and labor.</p>
</div>
</div>
<div class="flex gap-4">
<span class="material-symbols-outlined text-primary text-4xl">payments</span>
<div>
<h4 class="font-bold mb-1">Fixed-Price Quotes</h4>
<p class="text-on-surface-variant text-body-md">No hidden fees. The price you agree on is the final price you pay, guaranteed.</p>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full pt-section-gap pb-10 bg-surface-container-lowest border-t border-outline-variant">
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop max-w-container-max mx-auto">
<div class="col-span-1">
<div class="font-headline-sm text-headline-sm font-bold text-primary mb-6">AtomDrops</div>
<p class="text-on-secondary-fixed-variant text-body-md max-w-xs mb-8">Elevating the commerce experience through meticulous repair and professional grade service.</p>
</div>
<div class="col-span-1">
<h5 class="font-bold mb-6">Services</h5>
<ul class="space-y-4 font-label-md text-label-md">
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors" href="#">Find Technician</a></li>
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors" href="#">Book Repair</a></li>
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors" href="#">Work Orders</a></li>
</ul>
</div>
<div class="col-span-1">
<h5 class="font-bold mb-6">Resources</h5>
<ul class="space-y-4 font-label-md text-label-md">
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors" href="#">Service History</a></li>
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors" href="#">Warranty Policy</a></li>
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors" href="#">Support</a></li>
</ul>
</div>
<div class="col-span-1">
<h5 class="font-bold mb-6">Connect</h5>
<div class="flex gap-4 mb-8">
<a class="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all" href="#">
<span class="material-symbols-outlined text-[20px]">public</span>
</a>
<a class="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all" href="#">
<span class="material-symbols-outlined text-[20px]">share</span>
</a>
</div>
</div>
</div>
<div class="max-w-container-max mx-auto px-margin-desktop mt-16 pt-8 border-t border-outline-variant/50 text-center">
<p class="font-label-md text-label-md text-on-secondary-fixed-variant">© 2024 AtomDrops Ecosystem. Professional Grade Service.</p>
</div>
</footer>
<script>
        // Simple micro-interaction for search focus
        const searchInput = document.querySelector('input[type="text"]');
        searchInput.addEventListener('focus', () => {
            searchInput.parentElement.classList.add('ring-2', 'ring-primary-container');
        });
        searchInput.addEventListener('blur', () => {
            searchInput.parentElement.classList.remove('ring-2', 'ring-primary-container');
        });
    </script>
</body></html>

<!-- Compare Proposals | AtomDrops Repairs -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AtomDrops | Compare Proposals</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "secondary-fixed": "#e1e3e5",
                    "on-tertiary-fixed": "#1f1c03",
                    "on-secondary-fixed-variant": "#444749",
                    "surface-dim": "#dcd9db",
                    "primary-fixed": "#dfe0fe",
                    "tertiary-fixed": "#eae4b8",
                    "primary-fixed-dim": "#c2c4e2",
                    "primary": "#5a5d76",
                    "on-tertiary": "#ffffff",
                    "error": "#ba1a1a",
                    "surface-container-low": "#f6f3f5",
                    "tertiary-fixed-dim": "#cec89e",
                    "on-primary": "#ffffff",
                    "primary-container": "#bfc1de",
                    "error-container": "#ffdad6",
                    "tertiary-container": "#cac49b",
                    "surface-container-highest": "#e5e1e4",
                    "surface-tint": "#5a5d76",
                    "on-primary-container": "#4c4f67",
                    "secondary": "#5c5f61",
                    "inverse-on-surface": "#f3f0f2",
                    "tertiary": "#635f3d",
                    "on-primary-fixed": "#171a30",
                    "surface-container-lowest": "#ffffff",
                    "on-tertiary-container": "#555130",
                    "secondary-container": "#e1e3e5",
                    "on-primary-fixed-variant": "#42455d",
                    "on-secondary-fixed": "#191c1e",
                    "surface-container": "#f0edef",
                    "outline-variant": "#c7c5cd",
                    "on-secondary-container": "#626567",
                    "outline": "#77767d",
                    "on-tertiary-fixed-variant": "#4b4828",
                    "surface-bright": "#fcf8fa",
                    "secondary-fixed-dim": "#c5c7c9",
                    "surface": "#fcf8fa",
                    "on-surface-variant": "#46464d",
                    "on-secondary": "#ffffff",
                    "on-error": "#ffffff",
                    "on-surface": "#1c1b1d",
                    "inverse-surface": "#313032",
                    "on-error-container": "#93000a",
                    "inverse-primary": "#c2c4e2",
                    "on-background": "#1c1b1d",
                    "background": "#fcf8fa",
                    "surface-variant": "#e5e1e4",
                    "surface-container-high": "#ebe7e9"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px",
                    "2xl": "1rem"
            },
            "spacing": {
                    "gutter": "32px",
                    "margin-mobile": "20px",
                    "margin-desktop": "64px",
                    "section-gap": "120px",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "body-lg": ["Inter"],
                    "headline-lg-mobile": ["Inter"],
                    "headline-lg": ["Inter"],
                    "display-hero": ["Inter"],
                    "label-sm": ["Inter"],
                    "body-md": ["Inter"],
                    "headline-md": ["Inter"],
                    "label-md": ["Inter"],
                    "headline-sm": ["Inter"]
            },
            "fontSize": {
                    "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-lg-mobile": ["32px", {"lineHeight": "1.2", "fontWeight": "600"}],
                    "headline-lg": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "display-hero": ["72px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
                    "label-sm": ["12px", {"lineHeight": "1.0", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-md": ["30px", {"lineHeight": "1.3", "fontWeight": "600"}],
                    "label-md": ["14px", {"lineHeight": "1.0", "letterSpacing": "0.02em", "fontWeight": "500"}],
                    "headline-sm": ["20px", {"lineHeight": "1.4", "fontWeight": "600"}]
            }
          },
        },
      }
    </script>
<style>
        body { background-color: #fcf8fa; color: #1c1b1d; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .proposal-card:hover { transform: translateY(-4px); box-shadow: 0px 12px 30px rgba(15, 23, 42, 0.1); }
        .transition-all { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 18px; width: 18px;
            background: #5a5d76;
            border-radius: 50%;
            cursor: pointer;
        }
    </style>
</head>
<body class="font-body-md text-body-md overflow-x-hidden">
<!-- Top Navigation Header -->
<header class="sticky top-0 w-full bg-surface/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(15,23,42,0.05)] z-50">
<nav class="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
<div class="flex items-center gap-8">
<span class="font-headline-sm text-headline-sm font-bold text-primary">AtomDrops</span>
<div class="hidden md:flex gap-6 items-center">
<a class="text-on-surface-variant hover:text-primary transition-all font-label-md text-label-md" href="#">New</a>
<a class="text-on-surface-variant hover:text-primary transition-all font-label-md text-label-md" href="#">Used</a>
<a class="text-primary font-bold border-b-2 border-primary py-1 font-label-md text-label-md" href="#">Services</a>
<a class="text-on-surface-variant hover:text-primary transition-all font-label-md text-label-md" href="#">Auctions</a>
</div>
</div>
<div class="flex items-center gap-4">
<button class="p-2 rounded-full hover:bg-surface-container-low transition-all">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-low transition-all">
<span class="material-symbols-outlined" data-icon="account_circle">account_circle</span>
</button>
</div>
</nav>
</header>
<main class="max-w-container-max mx-auto px-margin-desktop py-12">
<!-- Dashboard Header -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
<div>
<nav class="flex gap-2 text-on-surface-variant mb-2">
<span class="font-label-sm text-label-sm">Active Requests</span>
<span class="font-label-sm text-label-sm">/</span>
<span class="font-label-sm text-label-sm text-primary">Request #882190</span>
</nav>
<h1 class="font-headline-lg text-headline-lg">Technical Proposals</h1>
<p class="text-on-surface-variant max-w-2xl mt-2 font-body-lg text-body-lg">
                    Repair: Industrial Drone Sensor Calibration. Review and compare specialized technician quotes for your active work order.
                </p>
</div>
<div class="flex items-center gap-3">
<span class="text-on-surface-variant font-label-md text-label-md">Sort by:</span>
<select class="bg-surface-container border-none rounded-xl font-label-md text-label-md px-4 py-2 focus:ring-2 focus:ring-primary cursor-pointer">
<option>Best Match</option>
<option>Lowest Price</option>
<option>Highest Rating</option>
<option>Shortest Duration</option>
</select>
</div>
</div>
<div class="flex flex-col md:flex-row gap-gutter">
<!-- Sidebar Filters -->
<aside class="w-full md:w-72 flex-shrink-0 space-y-8">
<div class="bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] space-y-8">
<!-- Filter: Category -->
<div>
<h3 class="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider mb-4">Service Category</h3>
<div class="space-y-3">
<label class="flex items-center gap-3 cursor-pointer group">
<input checked="" class="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<span class="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Drone Systems</span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<span class="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Optics &amp; Sensors</span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<span class="font-label-md text-label-md text-on-surface-variant group-hover:text-primary transition-colors">Software Calib.</span>
</label>
</div>
</div>
<!-- Filter: Service Area -->
<div>
<h3 class="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider mb-4">Service Area</h3>
<div class="relative">
<input class="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 font-label-md text-label-md focus:ring-2 focus:ring-primary" placeholder="Search City/Radius" type="text"/>
<span class="material-symbols-outlined absolute right-3 top-3 text-outline" data-icon="location_on">location_on</span>
</div>
</div>
<!-- Filter: Price Range -->
<div>
<div class="flex justify-between items-center mb-4">
<h3 class="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">Price Range</h3>
<span class="text-primary font-bold font-label-md text-label-md">$200 - $1200</span>
</div>
<input class="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer" max="2000" min="0" step="50" type="range"/>
</div>
<!-- Filter: Rating -->
<div>
<h3 class="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider mb-4">Technician Rating</h3>
<div class="space-y-3">
<label class="flex items-center gap-3 cursor-pointer">
<input class="w-5 h-5 border-outline-variant text-primary focus:ring-primary" name="rating" type="radio"/>
<div class="flex text-tertiary">
<span class="material-symbols-outlined text-[18px]" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[18px]" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[18px]" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[18px]" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-md text-label-md ml-2 text-on-surface-variant">4.0 &amp; Up</span>
</div>
</label>
<label class="flex items-center gap-3 cursor-pointer">
<input class="w-5 h-5 border-outline-variant text-primary focus:ring-primary" name="rating" type="radio"/>
<div class="flex text-tertiary">
<span class="material-symbols-outlined text-[18px]" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[18px]" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[18px]" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="material-symbols-outlined text-[18px]" data-icon="star">star</span>
<span class="font-label-md text-label-md ml-2 text-on-surface-variant">3.0 &amp; Up</span>
</div>
</label>
</div>
</div>
</div>
<div class="bg-primary-container/10 p-6 rounded-2xl border border-primary-container/20">
<span class="material-symbols-outlined text-primary mb-3" data-icon="verified">verified</span>
<h4 class="font-label-md text-label-md font-bold mb-2">AtomDrops Guarantee</h4>
<p class="font-label-sm text-label-sm text-on-primary-fixed-variant leading-relaxed">All technicians are verified for compliance. Payments are held in escrow until you approve the final repair.</p>
</div>
</aside>
<!-- Main Proposals List -->
<div class="flex-1 space-y-6">
<!-- Proposal Card 1 -->
<div class="proposal-card transition-all bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-transparent hover:border-primary-container flex flex-col lg:flex-row gap-8">
<div class="flex flex-col md:flex-row gap-6 flex-1">
<div class="relative w-24 h-24 flex-shrink-0">
<img alt="Technician" class="w-full h-full object-cover rounded-2xl shadow-sm" data-alt="A professional technician in a clean, modern lab setting wearing a white lab coat. He is looking directly at the camera with a confident, welcoming smile. The background is a soft-focus laboratory with precision electronic instruments, illuminated by cool, bright daylight that emphasizes a trust-first, high-end professional ecosystem." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAuBXE3vfNiZsoWJ1qN--D9c9OdWbQoppqilaufKH6DxJGzn-qpm5vZx3hrZiRst6AbsMzfxm1a3ZcyaYhkyWzN2ctug9vbLCDCrE_TlCqgtBFVG-z90A3CcesCsUokr-VtEOHjNQGiWagv1X2lXbciQBkMznkfj811h0fEbGzG0XEux7hbWyI8J4DuB6veYEOy3xlMR21yY8BZsxqeDE7QYV0bZRCMRTlHMWz5qmi-ZkubKmK-TqFTVFiHgxmfzhbQiOH9Po2TQn0"/>
<div class="absolute -bottom-2 -right-2 bg-primary text-on-primary p-1 rounded-lg flex items-center gap-1 shadow-md">
<span class="material-symbols-outlined text-[14px]" data-icon="verified" style="font-variation-settings: 'FILL' 1;">verified</span>
<span class="font-label-sm text-label-sm">Top Pro</span>
</div>
</div>
<div class="flex-1 space-y-3">
<div class="flex items-center gap-3">
<h2 class="font-headline-sm text-headline-sm text-on-surface">Marcus Chen</h2>
<div class="flex items-center gap-1 bg-tertiary-fixed px-2 py-0.5 rounded-full">
<span class="material-symbols-outlined text-[14px] text-on-tertiary-fixed" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-sm text-label-sm text-on-tertiary-fixed">4.9 (124 reviews)</span>
</div>
</div>
<p class="text-on-surface-variant font-body-md text-body-md line-clamp-2">
                                Specializing in multi-spectral sensor arrays and high-precision drone firmware. Certified by the Precision Engineering Guild for optical calibrations.
                            </p>
<div class="flex flex-wrap gap-3 pt-2">
<div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
<span class="material-symbols-outlined text-[18px] text-secondary" data-icon="schedule">schedule</span>
<span class="font-label-md text-label-md text-on-secondary-fixed-variant">2-3 Business Days</span>
</div>
<div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
<span class="material-symbols-outlined text-[18px] text-secondary" data-icon="pin_drop">pin_drop</span>
<span class="font-label-md text-label-md text-on-secondary-fixed-variant">12.4 miles away</span>
</div>
</div>
</div>
</div>
<div class="lg:w-64 lg:border-l border-outline-variant/20 lg:pl-8 flex flex-col justify-between">
<div class="mb-6 lg:mb-0">
<span class="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider block mb-1">Proposed Price</span>
<div class="flex items-baseline gap-1">
<span class="text-primary font-display-hero text-[36px] font-bold">$750</span>
<span class="text-on-surface-variant font-label-sm text-label-sm">/ total</span>
</div>
</div>
<div class="space-y-3">
<button class="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-3 px-6 rounded-2xl font-semibold hover:scale-[1.02] transition-transform active:scale-95">
                                Accept Proposal
                            </button>
<button class="w-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md py-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim transition-colors">
<span class="material-symbols-outlined text-[18px]" data-icon="chat">chat</span>
                                Message
                            </button>
</div>
</div>
</div>
<!-- Proposal Card 2 -->
<div class="proposal-card transition-all bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-transparent hover:border-primary-container flex flex-col lg:flex-row gap-8">
<div class="flex flex-col md:flex-row gap-6 flex-1">
<div class="relative w-24 h-24 flex-shrink-0">
<img alt="Technician" class="w-full h-full object-cover rounded-2xl shadow-sm" data-alt="A focused female technical specialist with a creative yet professional vibe. She is wearing modern tech-casual attire in a sleek studio environment with geometric architectural details. The lighting is diffused and sophisticated, casting soft shadows that highlight her expertise and the premium, trustworthy nature of the AtomDrops marketplace." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRMGVTLJlO27Xx-HYZFJAhUhXP0JuQfHHdZrM5TXYqDlKnqzdYJWcwB5RVELsfZfSTZH7BLooNi71B_-MnzKdlu87VeObQiQ9AnZGVGyvFRGWL6Q2B8I7Z_axOsEC5qeh7XEltt8GFIO416pQd42gLzoKflKdoBDroYeRdbhUlQA7_WTnUKKBwHmHZbxI0fplJEAKdd5FK9HLRI7KKalCXIEHtSxpwYeUFnhfEredocGbSrjW3_BocG7CSXcxcjUezNX5FM2MphvE"/>
</div>
<div class="flex-1 space-y-3">
<div class="flex items-center gap-3">
<h2 class="font-headline-sm text-headline-sm text-on-surface">Elena Rodriguez</h2>
<div class="flex items-center gap-1 bg-tertiary-fixed px-2 py-0.5 rounded-full">
<span class="material-symbols-outlined text-[14px] text-on-tertiary-fixed" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-sm text-label-sm text-on-tertiary-fixed">4.7 (89 reviews)</span>
</div>
</div>
<p class="text-on-surface-variant font-body-md text-body-md line-clamp-2">
                                Expert in robotic arm telemetry and automated sensor suites. I provide on-site calibration services for complex industrial setups.
                            </p>
<div class="flex flex-wrap gap-3 pt-2">
<div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
<span class="material-symbols-outlined text-[18px] text-secondary" data-icon="schedule">schedule</span>
<span class="font-label-md text-label-md text-on-secondary-fixed-variant">1-2 Business Days</span>
</div>
<div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
<span class="material-symbols-outlined text-[18px] text-secondary" data-icon="pin_drop">pin_drop</span>
<span class="font-label-md text-label-md text-on-secondary-fixed-variant">3.8 miles away</span>
</div>
</div>
</div>
</div>
<div class="lg:w-64 lg:border-l border-outline-variant/20 lg:pl-8 flex flex-col justify-between">
<div class="mb-6 lg:mb-0">
<span class="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider block mb-1">Proposed Price</span>
<div class="flex items-baseline gap-1">
<span class="text-primary font-display-hero text-[36px] font-bold">$920</span>
<span class="text-on-surface-variant font-label-sm text-label-sm">/ total</span>
</div>
</div>
<div class="space-y-3">
<button class="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-3 px-6 rounded-2xl font-semibold hover:scale-[1.02] transition-transform active:scale-95">
                                Accept Proposal
                            </button>
<button class="w-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md py-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim transition-colors">
<span class="material-symbols-outlined text-[18px]" data-icon="chat">chat</span>
                                Message
                            </button>
</div>
</div>
</div>
<!-- Proposal Card 3 (Lowest Price Badge) -->
<div class="proposal-card transition-all bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border-2 border-tertiary-container/30 flex flex-col lg:flex-row gap-8 relative overflow-hidden">
<div class="absolute top-0 right-0 bg-tertiary text-on-tertiary px-4 py-1 font-label-sm text-label-sm rounded-bl-xl uppercase tracking-widest font-bold">
                        Best Value
                    </div>
<div class="flex flex-col md:flex-row gap-6 flex-1">
<div class="relative w-24 h-24 flex-shrink-0">
<img alt="Technician" class="w-full h-full object-cover rounded-2xl shadow-sm" data-alt="A senior technical advisor with years of experience visible in a dignified, knowledgeable expression. He is wearing a minimalist, high-quality charcoal jumper and is posed against a backdrop of a clean, futuristic hardware workshop. The overall mood is one of extreme reliability and professional grade service within the AtomDrops brand style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmVOOxKZRyWPOQ_pYtPD5Rmo_9wFOe_fhFE5VxoheW3wxu6B8AanSozkAwohLNnjguDhzOa1EV8YewrWiaxL3iJMEuoOt9btXC25OdZzwHhQiGBtalme0dw3fUMIloxcYBQCK-epejjb7eqMt_kX3ChyUiQJf--nTSI9S68OCz_fTUyjs7BLXzNeaazi7Uw-D2NMmHALtdeTs-5luwKntau6UvNExOekQpFm94YsCSCuYiFZkVCAHCAmJKgYYwFP_YWMTcEqfiHLE"/>
</div>
<div class="flex-1 space-y-3">
<div class="flex items-center gap-3">
<h2 class="font-headline-sm text-headline-sm text-on-surface">Samir Al-Farsi</h2>
<div class="flex items-center gap-1 bg-tertiary-fixed px-2 py-0.5 rounded-full">
<span class="material-symbols-outlined text-[14px] text-on-tertiary-fixed" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
<span class="font-label-sm text-label-sm text-on-tertiary-fixed">4.5 (42 reviews)</span>
</div>
</div>
<p class="text-on-surface-variant font-body-md text-body-md line-clamp-2">
                                I provide cost-effective sensor diagnostic and alignment services for older model drone ecosystems. Quick turnaround guaranteed.
                            </p>
<div class="flex flex-wrap gap-3 pt-2">
<div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
<span class="material-symbols-outlined text-[18px] text-secondary" data-icon="schedule">schedule</span>
<span class="font-label-md text-label-md text-on-secondary-fixed-variant">4-5 Business Days</span>
</div>
<div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
<span class="material-symbols-outlined text-[18px] text-secondary" data-icon="pin_drop">pin_drop</span>
<span class="font-label-md text-label-md text-on-secondary-fixed-variant">25.1 miles away</span>
</div>
</div>
</div>
</div>
<div class="lg:w-64 lg:border-l border-outline-variant/20 lg:pl-8 flex flex-col justify-between">
<div class="mb-6 lg:mb-0">
<span class="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider block mb-1">Proposed Price</span>
<div class="flex items-baseline gap-1">
<span class="text-primary font-display-hero text-[36px] font-bold">$490</span>
<span class="text-on-surface-variant font-label-sm text-label-sm">/ total</span>
</div>
</div>
<div class="space-y-3">
<button class="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-3 px-6 rounded-2xl font-semibold hover:scale-[1.02] transition-transform active:scale-95">
                                Accept Proposal
                            </button>
<button class="w-full bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md py-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-secondary-fixed-dim transition-colors">
<span class="material-symbols-outlined text-[18px]" data-icon="chat">chat</span>
                                Message
                            </button>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- Footer -->
<footer class="w-full pt-section-gap pb-10 bg-surface-container-lowest border-t border-outline-variant">
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop max-w-container-max mx-auto">
<div class="col-span-1 space-y-4">
<span class="font-headline-sm text-headline-sm font-bold text-primary">AtomDrops</span>
<p class="text-on-secondary-fixed-variant font-label-md text-label-md leading-relaxed">
                    Professional Grade Service Ecosystem for high-end commerce, technical repairs, and specialty auctions.
                </p>
</div>
<div class="col-span-1 space-y-4">
<h4 class="font-label-md text-label-md font-bold text-primary">Services</h4>
<ul class="space-y-2">
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Find Technician</a></li>
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Book Repair</a></li>
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Work Orders</a></li>
</ul>
</div>
<div class="col-span-1 space-y-4">
<h4 class="font-label-md text-label-md font-bold text-primary">Account</h4>
<ul class="space-y-2">
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Service History</a></li>
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Warranty Policy</a></li>
<li><a class="text-on-secondary-fixed-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">Support</a></li>
</ul>
</div>
<div class="col-span-1 space-y-4">
<h4 class="font-label-md text-label-md font-bold text-primary">Stay Connected</h4>
<div class="flex gap-4">
<a class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary-container transition-all" href="#">
<span class="material-symbols-outlined text-[20px]" data-icon="share">share</span>
</a>
<a class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary-container transition-all" href="#">
<span class="material-symbols-outlined text-[20px]" data-icon="mail">mail</span>
</a>
</div>
</div>
</div>
<div class="max-w-container-max mx-auto px-margin-desktop mt-12 pt-8 border-t border-outline-variant/30 text-center">
<p class="text-on-secondary-fixed-variant font-label-md text-label-md">© 2024 AtomDrops Ecosystem. Professional Grade Service.</p>
</div>
</footer>
<script>
        // Micro-interaction for range slider
        const range = document.querySelector('input[type="range"]');
        const priceDisplay = document.querySelector('.text-primary.font-bold.font-label-md');
        if (range && priceDisplay) {
            range.addEventListener('input', (e) => {
                priceDisplay.textContent = `$200 - $${e.target.value}`;
            });
        }

        // Add interaction effect to primary buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('mousedown', () => {
                button.classList.add('scale-95');
            });
            button.addEventListener('mouseup', () => {
                button.classList.remove('scale-95');
            });
            button.addEventListener('mouseleave', () => {
                button.classList.remove('scale-95');
            });
        });
    </script>
</body></html>

<!-- Technician Dashboard | AtomDrops -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Technician Dashboard | AtomDrops</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        body { font-family: 'Inter', sans-serif; }
        .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(229, 231, 235, 0.5);
        }
        .dark .glass-card {
            background: rgba(28, 27, 29, 0.8);
            border: 1px solid rgba(70, 70, 77, 0.5);
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "secondary-fixed": "#e1e3e5",
                      "on-tertiary-fixed": "#1f1c03",
                      "on-secondary-fixed-variant": "#444749",
                      "surface-dim": "#dcd9db",
                      "primary-fixed": "#dfe0fe",
                      "tertiary-fixed": "#eae4b8",
                      "primary-fixed-dim": "#c2c4e2",
                      "primary": "#5a5d76",
                      "on-tertiary": "#ffffff",
                      "error": "#ba1a1a",
                      "surface-container-low": "#f6f3f5",
                      "tertiary-fixed-dim": "#cec89e",
                      "on-primary": "#ffffff",
                      "primary-container": "#bfc1de",
                      "error-container": "#ffdad6",
                      "tertiary-container": "#cac49b",
                      "surface-container-highest": "#e5e1e4",
                      "surface-tint": "#5a5d76",
                      "on-primary-container": "#4c4f67",
                      "secondary": "#5c5f61",
                      "inverse-on-surface": "#f3f0f2",
                      "tertiary": "#635f3d",
                      "on-primary-fixed": "#171a30",
                      "surface-container-lowest": "#ffffff",
                      "on-tertiary-container": "#555130",
                      "secondary-container": "#e1e3e5",
                      "on-primary-fixed-variant": "#42455d",
                      "on-secondary-fixed": "#191c1e",
                      "surface-container": "#f0edef",
                      "outline-variant": "#c7c5cd",
                      "on-secondary-container": "#626567",
                      "outline": "#77767d",
                      "on-tertiary-fixed-variant": "#4b4828",
                      "surface-bright": "#fcf8fa",
                      "secondary-fixed-dim": "#c5c7c9",
                      "surface": "#fcf8fa",
                      "on-surface-variant": "#46464d",
                      "on-secondary": "#ffffff",
                      "on-error": "#ffffff",
                      "on-surface": "#1c1b1d",
                      "inverse-surface": "#313032",
                      "on-error-container": "#93000a",
                      "inverse-primary": "#c2c4e2",
                      "on-background": "#1c1b1d",
                      "background": "#fcf8fa",
                      "surface-variant": "#e5e1e4",
                      "surface-container-high": "#ebe7e9"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "gutter": "32px",
                      "margin-mobile": "20px",
                      "margin-desktop": "64px",
                      "section-gap": "120px",
                      "container-max": "1280px"
              },
              "fontFamily": {
                      "body-lg": ["Inter"],
                      "headline-lg-mobile": ["Inter"],
                      "headline-lg": ["Inter"],
                      "display-hero": ["Inter"],
                      "label-sm": ["Inter"],
                      "body-md": ["Inter"],
                      "headline-md": ["Inter"],
                      "label-md": ["Inter"],
                      "headline-sm": ["Inter"]
              },
              "fontSize": {
                      "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
                      "headline-lg-mobile": ["32px", {"lineHeight": "1.2", "fontWeight": "600"}],
                      "headline-lg": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                      "display-hero": ["72px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
                      "label-sm": ["12px", {"lineHeight": "1.0", "fontWeight": "600"}],
                      "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                      "headline-md": ["30px", {"lineHeight": "1.3", "fontWeight": "600"}],
                      "label-md": ["14px", {"lineHeight": "1.0", "letterSpacing": "0.02em", "fontWeight": "500"}],
                      "headline-sm": ["20px", {"lineHeight": "1.4", "fontWeight": "600"}]
              }
            },
          },
        }
      </script>
</head>
<body class="bg-background text-on-surface transition-colors duration-300">
<!-- Top Navigation Anchor -->
<header class="sticky top-0 w-full bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(15,23,42,0.05)] z-50">
<div class="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
<div class="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed">AtomDrops</div>
<nav class="hidden md:flex gap-8 items-center">
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary transition-all" href="#">New</a>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary transition-all" href="#">Used</a>
<a class="font-body-md text-body-md text-primary dark:text-primary-fixed font-bold border-b-2 border-primary" href="#">Services</a>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary transition-all" href="#">Auctions</a>
</nav>
<div class="flex items-center gap-4">
<button class="p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-all">
<span class="material-symbols-outlined text-on-surface-variant">notifications</span>
</button>
<button class="p-2 rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-high transition-all" onclick="document.documentElement.classList.toggle('dark')">
<span class="material-symbols-outlined text-on-surface-variant">dark_mode</span>
</button>
<div class="flex items-center gap-3 pl-4 border-l border-outline-variant">
<div class="text-right hidden sm:block">
<div class="font-label-md text-label-md text-on-surface font-semibold">Alex Rivera</div>
<div class="font-label-sm text-label-sm text-on-surface-variant">Senior Technician</div>
</div>
<span class="material-symbols-outlined text-primary text-[40px]" style="font-variation-settings: 'FILL' 1;">account_circle</span>
</div>
</div>
</div>
</header>
<main class="max-w-container-max mx-auto px-margin-desktop py-12">
<!-- Dashboard Header -->
<div class="mb-10">
<h1 class="font-headline-lg text-headline-lg text-on-surface mb-2">Technician Overview</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Welcome back. You have 3 pending service requests for today.</p>
</div>
<!-- Metric Bento Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-section-gap">
<div class="glass-card p-6 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:scale-[1.02] transition-transform duration-200">
<div class="flex justify-between items-start mb-4">
<div class="p-3 bg-primary-container/20 rounded-xl text-primary">
<span class="material-symbols-outlined">pending_actions</span>
</div>
<span class="text-label-sm font-label-sm text-primary bg-primary-fixed px-2 py-1 rounded-full">+2 Today</span>
</div>
<div class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Incoming Requests</div>
<div class="font-headline-md text-headline-md text-on-surface">14</div>
</div>
<div class="glass-card p-6 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:scale-[1.02] transition-transform duration-200">
<div class="flex justify-between items-start mb-4">
<div class="p-3 bg-tertiary-container/20 rounded-xl text-tertiary">
<span class="material-symbols-outlined">handyman</span>
</div>
<span class="text-label-sm font-label-sm text-tertiary bg-tertiary-fixed px-2 py-1 rounded-full">In Progress</span>
</div>
<div class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Active Jobs</div>
<div class="font-headline-md text-headline-md text-on-surface">08</div>
</div>
<div class="glass-card p-6 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:scale-[1.02] transition-transform duration-200">
<div class="flex justify-between items-start mb-4">
<div class="p-3 bg-secondary-container rounded-xl text-secondary">
<span class="material-symbols-outlined">payments</span>
</div>
</div>
<div class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Total Earnings</div>
<div class="font-headline-md text-headline-md text-on-surface">$12,480.50</div>
</div>
<div class="glass-card p-6 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] hover:scale-[1.02] transition-transform duration-200">
<div class="flex justify-between items-start mb-4">
<div class="p-3 bg-primary-container/20 rounded-xl text-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
<span class="text-label-sm font-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">98% Positive</span>
</div>
<div class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">Customer Rating</div>
<div class="font-headline-md text-headline-md text-on-surface">4.92 / 5.0</div>
</div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
<!-- Main Work Orders Section -->
<div class="lg:col-span-2">
<div class="flex justify-between items-center mb-6">
<h2 class="font-headline-sm text-headline-sm text-on-surface">Active Work Orders</h2>
<div class="flex gap-2">
<button class="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors text-label-md font-label-md">
<span class="material-symbols-outlined text-[18px]">filter_list</span> Filter
                        </button>
<button class="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container transition-colors text-label-md font-label-md">
<span class="material-symbols-outlined text-[18px]">download</span> Export
                        </button>
</div>
</div>
<div class="glass-card rounded-2xl overflow-hidden shadow-sm">
<div class="overflow-x-auto">
<table class="w-full text-left">
<thead>
<tr class="bg-surface-container-low dark:bg-surface-container-high border-b border-outline-variant">
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase">Job ID</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase">Customer Name</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase">Status</th>
<th class="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase text-right">Actions</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant">
<tr class="hover:bg-surface-container-lowest dark:hover:bg-surface-container transition-colors">
<td class="px-6 py-5 font-label-md text-label-md text-primary font-bold">#AD-9021</td>
<td class="px-6 py-5">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs">JD</div>
<span class="font-body-md text-body-md text-on-surface">James D'Angelo</span>
</div>
</td>
<td class="px-6 py-5">
<span class="inline-flex items-center px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-label-sm">
<span class="w-2 h-2 rounded-full bg-tertiary mr-2"></span> Awaiting Parts
                                        </span>
</td>
<td class="px-6 py-5 text-right">
<div class="flex justify-end gap-3">
<button class="text-primary hover:bg-primary-container/20 p-2 rounded-lg transition-colors" title="Update Status">
<span class="material-symbols-outlined">edit_note</span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container p-2 rounded-lg transition-colors" title="Message">
<span class="material-symbols-outlined">chat_bubble</span>
</button>
</div>
</td>
</tr>
<tr class="hover:bg-surface-container-lowest dark:hover:bg-surface-container transition-colors">
<td class="px-6 py-5 font-label-md text-label-md text-primary font-bold">#AD-8842</td>
<td class="px-6 py-5">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs">SL</div>
<span class="font-body-md text-body-md text-on-surface">Sarah Lopez</span>
</div>
</td>
<td class="px-6 py-5">
<span class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-label-sm font-label-sm">
<span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> In Progress
                                        </span>
</td>
<td class="px-6 py-5 text-right">
<div class="flex justify-end gap-3">
<button class="text-primary hover:bg-primary-container/20 p-2 rounded-lg transition-colors">
<span class="material-symbols-outlined">edit_note</span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container p-2 rounded-lg transition-colors">
<span class="material-symbols-outlined">chat_bubble</span>
</button>
</div>
</td>
</tr>
<tr class="hover:bg-surface-container-lowest dark:hover:bg-surface-container transition-colors">
<td class="px-6 py-5 font-label-md text-label-md text-primary font-bold">#AD-7719</td>
<td class="px-6 py-5">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs">MK</div>
<span class="font-body-md text-body-md text-on-surface">Michael Kim</span>
</div>
</td>
<td class="px-6 py-5">
<span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-label-sm font-label-sm">
<span class="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Scheduled
                                        </span>
</td>
<td class="px-6 py-5 text-right">
<div class="flex justify-end gap-3">
<button class="text-primary hover:bg-primary-container/20 p-2 rounded-lg transition-colors">
<span class="material-symbols-outlined">edit_note</span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container p-2 rounded-lg transition-colors">
<span class="material-symbols-outlined">chat_bubble</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
<!-- Side Panel: Upcoming Appointments -->
<aside class="space-y-6">
<div class="glass-card p-6 rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
<div class="flex justify-between items-center mb-6">
<h3 class="font-headline-sm text-headline-sm text-on-surface">Calendar</h3>
<button class="text-primary font-label-md text-label-md hover:underline">View All</button>
</div>
<!-- Mini Calendar Representation -->
<div class="grid grid-cols-7 gap-1 text-center mb-6">
<div class="text-label-sm text-on-surface-variant font-bold mb-2">M</div>
<div class="text-label-sm text-on-surface-variant font-bold mb-2">T</div>
<div class="text-label-sm text-on-surface-variant font-bold mb-2">W</div>
<div class="text-label-sm text-on-surface-variant font-bold mb-2">T</div>
<div class="text-label-sm text-on-surface-variant font-bold mb-2">F</div>
<div class="text-label-sm text-on-surface-variant font-bold mb-2">S</div>
<div class="text-label-sm text-on-surface-variant font-bold mb-2">S</div>
<div class="h-8 flex items-center justify-center text-label-sm rounded-lg text-on-surface-variant">24</div>
<div class="h-8 flex items-center justify-center text-label-sm rounded-lg text-on-surface-variant">25</div>
<div class="h-8 flex items-center justify-center text-label-sm rounded-lg bg-primary text-on-primary font-bold">26</div>
<div class="h-8 flex items-center justify-center text-label-sm rounded-lg text-on-surface font-semibold">27</div>
<div class="h-8 flex items-center justify-center text-label-sm rounded-lg text-on-surface font-semibold">28</div>
<div class="h-8 flex items-center justify-center text-label-sm rounded-lg text-on-surface font-semibold">29</div>
<div class="h-8 flex items-center justify-center text-label-sm rounded-lg text-on-surface font-semibold">30</div>
</div>
<div class="space-y-4">
<h4 class="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-widest">Upcoming Today</h4>
<div class="relative pl-4 border-l-2 border-primary py-1">
<div class="text-label-sm font-label-sm text-primary mb-1">02:00 PM - 03:30 PM</div>
<div class="font-label-md text-label-md text-on-surface font-bold">System Diagnostics</div>
<div class="text-label-sm text-on-surface-variant">Client: Robert Vance</div>
</div>
<div class="relative pl-4 border-l-2 border-outline-variant py-1">
<div class="text-label-sm font-label-sm text-on-surface-variant mb-1">04:30 PM - 05:45 PM</div>
<div class="font-label-md text-label-md text-on-surface font-bold">Hardware Installation</div>
<div class="text-label-sm text-on-surface-variant">Client: Elena Rossi</div>
</div>
<div class="relative pl-4 border-l-2 border-outline-variant py-1">
<div class="text-label-sm font-label-sm text-on-surface-variant mb-1">Tomorrow, 09:00 AM</div>
<div class="font-label-md text-label-md text-on-surface font-bold">Security Audit</div>
<div class="text-label-sm text-on-surface-variant">Client: TechCorp HQ</div>
</div>
</div>
</div>
<!-- Technician Badge / Profile -->
<div class="glass-card p-6 rounded-2xl overflow-hidden relative">
<div class="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full"></div>
<div class="relative z-10">
<div class="flex items-center gap-4 mb-4">
<img alt="Alex Rivera" class="w-16 h-16 rounded-full border-2 border-primary" data-alt="A professional headshot of a smiling male technician in a clean corporate polo shirt with a tech company logo. He is standing in a brightly lit, modern minimalist workshop setting with subtle glowing blue accent lighting. The overall mood is trustworthy, professional, and technologically proficient with high-key lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGHlOwCUTS5PGeFBRBgjsiaLOiFzmVR0x4nUe-2G8q_MO23mFjlDY-o252D60b0DifIBhK9vevf1VwV3Y5eSG4tU2zSddf-MkE0VAC6YD6znxMn8pYEYoQ0lurhr_9AGdLuDdXHLTPJ1MLVSvmjkTEowDlPNLmplKK8SjGcBDga0CYtE6IGq977-3XQRqfOntf8O6tzgR6kCt5GvF_miTUHMnGoZ7BofczbTlHe6jHBQ6WJL4NfpHa2JriYpcmr7yaE3gmMMTQc6I"/>
<div>
<h3 class="font-headline-sm text-headline-sm text-on-surface">Alex Rivera</h3>
<div class="flex items-center gap-1 text-tertiary">
<span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">stars</span>
<span class="text-label-sm font-label-sm">Pro Verified</span>
</div>
</div>
</div>
<button class="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90 transition-all active:scale-95">Go Offline</button>
</div>
</div>
</aside>
</div>
</main>
<!-- Footer Anchor -->
<footer class="w-full pt-section-gap pb-10 bg-surface-container-lowest dark:bg-surface-container-high border-t border-outline-variant">
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter px-margin-desktop max-w-container-max mx-auto">
<div class="md:col-span-1">
<div class="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed mb-4">AtomDrops</div>
<p class="font-label-md text-label-md text-on-secondary-fixed-variant dark:text-secondary-fixed-dim leading-relaxed">Professional Grade Service Ecosystem for the modern technician.</p>
</div>
<div>
<h4 class="font-label-md text-label-md text-on-surface font-bold mb-4 uppercase">Support</h4>
<ul class="space-y-2">
<li><a class="font-label-md text-label-md text-on-secondary-fixed-variant dark:text-secondary-fixed-dim hover:text-primary transition-colors" href="#">Find Technician</a></li>
<li><a class="font-label-md text-label-md text-on-secondary-fixed-variant dark:text-secondary-fixed-dim hover:text-primary transition-colors" href="#">Book Repair</a></li>
</ul>
</div>
<div>
<h4 class="font-label-md text-label-md text-on-surface font-bold mb-4 uppercase">Operations</h4>
<ul class="space-y-2">
<li><a class="font-label-md text-label-md text-on-secondary-fixed-variant dark:text-secondary-fixed-dim hover:text-primary transition-colors" href="#">Work Orders</a></li>
<li><a class="font-label-md text-label-md text-on-secondary-fixed-variant dark:text-secondary-fixed-dim hover:text-primary transition-colors" href="#">Service History</a></li>
</ul>
</div>
<div>
<h4 class="font-label-md text-label-md text-on-surface font-bold mb-4 uppercase">Legal</h4>
<ul class="space-y-2">
<li><a class="font-label-md text-label-md text-on-secondary-fixed-variant dark:text-secondary-fixed-dim hover:text-primary transition-colors" href="#">Warranty Policy</a></li>
<li><a class="font-label-md text-label-md text-on-secondary-fixed-variant dark:text-secondary-fixed-dim hover:text-primary transition-colors" href="#">Support</a></li>
</ul>
</div>
</div>
<div class="px-margin-desktop max-w-container-max mx-auto mt-12 pt-8 border-t border-outline-variant/30 text-center">
<p class="font-label-md text-label-md text-on-secondary-fixed-variant/60">© 2024 AtomDrops Ecosystem. Professional Grade Service.</p>
</div>
</footer>
<!-- FAB for Quick Actions (Task Focused Suppression Check: Dashboard keeps FAB) -->
<button class="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40">
<span class="material-symbols-outlined text-[28px]">add</span>
</button>
<script>
        // Simple micro-interaction for rows
        document.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => {
                // Potential expansion logic
            });
        });
    </script>
</body></html>

<!-- Request a Repair | AtomDrops -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AtomDrops | Multi-Step Repair Request</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "secondary-fixed": "#e1e3e5",
                    "on-tertiary-fixed": "#1f1c03",
                    "on-secondary-fixed-variant": "#444749",
                    "surface-dim": "#dcd9db",
                    "primary-fixed": "#dfe0fe",
                    "tertiary-fixed": "#eae4b8",
                    "primary-fixed-dim": "#c2c4e2",
                    "primary": "#5a5d76",
                    "on-tertiary": "#ffffff",
                    "error": "#ba1a1a",
                    "surface-container-low": "#f6f3f5",
                    "tertiary-fixed-dim": "#cec89e",
                    "on-primary": "#ffffff",
                    "primary-container": "#bfc1de",
                    "error-container": "#ffdad6",
                    "tertiary-container": "#cac49b",
                    "surface-container-highest": "#e5e1e4",
                    "surface-tint": "#5a5d76",
                    "on-primary-container": "#4c4f67",
                    "secondary": "#5c5f61",
                    "inverse-on-surface": "#f3f0f2",
                    "tertiary": "#635f3d",
                    "on-primary-fixed": "#171a30",
                    "surface-container-lowest": "#ffffff",
                    "on-tertiary-container": "#555130",
                    "secondary-container": "#e1e3e5",
                    "on-primary-fixed-variant": "#42455d",
                    "on-secondary-fixed": "#191c1e",
                    "surface-container": "#f0edef",
                    "outline-variant": "#c7c5cd",
                    "on-secondary-container": "#626567",
                    "outline": "#77767d",
                    "on-tertiary-fixed-variant": "#4b4828",
                    "surface-bright": "#fcf8fa",
                    "secondary-fixed-dim": "#c5c7c9",
                    "surface": "#fcf8fa",
                    "on-surface-variant": "#46464d",
                    "on-secondary": "#ffffff",
                    "on-error": "#ffffff",
                    "on-surface": "#1c1b1d",
                    "inverse-surface": "#313032",
                    "on-error-container": "#93000a",
                    "inverse-primary": "#c2c4e2",
                    "on-background": "#1c1b1d",
                    "background": "#fcf8fa",
                    "surface-variant": "#e5e1e4",
                    "surface-container-high": "#ebe7e9"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "2xl": "1rem",
                    "full": "9999px"
            },
            "spacing": {
                    "gutter": "32px",
                    "margin-mobile": "20px",
                    "margin-desktop": "64px",
                    "section-gap": "120px",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "body-lg": ["Inter"],
                    "headline-lg-mobile": ["Inter"],
                    "headline-lg": ["Inter"],
                    "display-hero": ["Inter"],
                    "label-sm": ["Inter"],
                    "body-md": ["Inter"],
                    "headline-md": ["Inter"],
                    "label-md": ["Inter"],
                    "headline-sm": ["Inter"]
            },
            "fontSize": {
                    "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-lg-mobile": ["32px", {"lineHeight": "1.2", "fontWeight": "600"}],
                    "headline-lg": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                    "display-hero": ["72px", {"lineHeight": "1.1", "letterSpacing": "-0.04em", "fontWeight": "700"}],
                    "label-sm": ["12px", {"lineHeight": "1.0", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-md": ["30px", {"lineHeight": "1.3", "fontWeight": "600"}],
                    "label-md": ["14px", {"lineHeight": "1.0", "letterSpacing": "0.02em", "fontWeight": "500"}],
                    "headline-sm": ["20px", {"lineHeight": "1.4", "fontWeight": "600"}]
            }
          },
        },
      }
    </script>
<style>
        .step-transition { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .active-step-circle { @apply bg-primary text-on-primary ring-4 ring-primary-container; }
        .inactive-step-circle { @apply bg-surface-container-high text-on-surface-variant; }
        .completed-step-circle { @apply bg-primary-container text-on-primary-container; }
        .glass-panel { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .custom-calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    </style>
</head>
<body class="bg-background text-on-background font-body-md selection:bg-primary-container">
<!-- Top Navigation Anchor -->
<header class="sticky top-0 w-full bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md shadow-[0px_4px_20px_rgba(15,23,42,0.05)] z-50">
<nav class="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
<div class="font-headline-sm text-headline-sm font-bold text-primary dark:text-primary-fixed">AtomDrops</div>
<div class="hidden md:flex items-center gap-8">
<a class="text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary font-body-md text-body-md" href="#">New</a>
<a class="text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary font-body-md text-body-md" href="#">Used</a>
<a class="text-primary dark:text-primary-fixed font-bold border-b-2 border-primary font-body-md text-body-md" href="#">Services</a>
<a class="text-on-surface-variant dark:text-on-secondary-fixed-variant hover:text-primary font-body-md text-body-md" href="#">Auctions</a>
</div>
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-primary p-2 hover:bg-surface-container-low rounded-full transition-all duration-200">notifications</button>
<button class="material-symbols-outlined text-primary p-2 hover:bg-surface-container-low rounded-full transition-all duration-200">account_circle</button>
</div>
</nav>
</header>
<main class="max-w-[800px] mx-auto px-margin-mobile md:px-0 py-12 md:py-16">
<!-- Progress Indicators -->
<section class="mb-12">
<div class="flex items-center justify-between relative px-2">
<div class="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-high -z-10 -translate-y-1/2"></div>
<!-- Step 1 -->
<div class="flex flex-col items-center gap-3">
<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold active-step-circle text-label-md font-label-md" id="step-indicator-1">1</div>
<span class="text-label-sm font-label-sm text-on-surface">Describe</span>
</div>
<!-- Step 2 -->
<div class="flex flex-col items-center gap-3">
<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold inactive-step-circle text-label-md font-label-md" id="step-indicator-2">2</div>
<span class="text-label-sm font-label-sm text-on-surface-variant">Media</span>
</div>
<!-- Step 3 -->
<div class="flex flex-col items-center gap-3">
<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold inactive-step-circle text-label-md font-label-md" id="step-indicator-3">3</div>
<span class="text-label-sm font-label-sm text-on-surface-variant">Service</span>
</div>
<!-- Step 4 -->
<div class="flex flex-col items-center gap-3">
<div class="w-10 h-10 rounded-full flex items-center justify-center font-bold inactive-step-circle text-label-md font-label-md" id="step-indicator-4">4</div>
<span class="text-label-sm font-label-sm text-on-surface-variant">Schedule</span>
</div>
</div>
</section>
<!-- Form Canvas -->
<div class="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-8 md:p-12 min-h-[500px] relative overflow-hidden">
<!-- Step 1: Describe the issue -->
<div class="step-transition opacity-100 transform translate-x-0" id="step-1">
<div class="mb-8">
<h1 class="font-headline-md text-headline-md text-on-surface mb-2">Describe the issue</h1>
<p class="text-on-surface-variant font-body-md text-body-md">Provide technical details about your device and the symptoms you're experiencing.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
<div class="flex flex-col gap-2">
<label class="text-label-md font-label-md text-on-surface-variant">Item Brand</label>
<input class="w-full bg-surface-bright border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-4 transition-all" placeholder="e.g. Apple, Samsung, Sony" type="text"/>
</div>
<div class="flex flex-col gap-2">
<label class="text-label-md font-label-md text-on-surface-variant">Model Number</label>
<input class="w-full bg-surface-bright border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-4 transition-all" placeholder="e.g. SM-G991B, A2342" type="text"/>
</div>
</div>
<div class="flex flex-col gap-2">
<label class="text-label-md font-label-md text-on-surface-variant">Problem Description</label>
<textarea class="w-full bg-surface-bright border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-4 transition-all" placeholder="Describe what happened, any error codes, or physical signs of damage..." rows="6"></textarea>
</div>
</div>
<!-- Step 2: Media Upload -->
<div class="step-transition hidden opacity-0 transform translate-x-10" id="step-2">
<div class="mb-8">
<h1 class="font-headline-md text-headline-md text-on-surface mb-2">Media Upload</h1>
<p class="text-on-surface-variant font-body-md text-body-md">Clear photos or videos of the damage help our technicians provide a more accurate estimate.</p>
</div>
<div class="border-2 border-dashed border-outline-variant rounded-2xl bg-surface-container-low p-12 flex flex-col items-center justify-center text-center group hover:border-primary hover:bg-primary-container/10 transition-all cursor-pointer">
<span class="material-symbols-outlined text-[48px] text-primary mb-4 group-hover:scale-110 transition-transform">cloud_upload</span>
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">Drag and drop files</h3>
<p class="text-on-surface-variant font-body-md text-body-md mb-6">Or click to browse your local storage</p>
<div class="flex gap-2 flex-wrap justify-center">
<span class="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-label-sm">JPG, PNG</span>
<span class="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-label-sm">MP4 (Max 20MB)</span>
<span class="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-label-sm">Min 3 Photos</span>
</div>
</div>
<div class="mt-8 grid grid-cols-4 gap-4">
<div class="aspect-square bg-surface-container rounded-xl flex items-center justify-center">
<span class="material-symbols-outlined text-outline">add_photo_alternate</span>
</div>
<div class="aspect-square bg-surface-container rounded-xl flex items-center justify-center">
<span class="material-symbols-outlined text-outline">add_photo_alternate</span>
</div>
</div>
</div>
<!-- Step 3: Service Preference -->
<div class="step-transition hidden opacity-0 transform translate-x-10" id="step-3">
<div class="mb-8">
<h1 class="font-headline-md text-headline-md text-on-surface mb-2">Service Preference</h1>
<p class="text-on-surface-variant font-body-md text-body-md">How would you like to get your item repaired?</p>
</div>
<div class="space-y-4">
<button class="w-full flex items-center gap-6 p-6 rounded-2xl border border-outline-variant bg-surface-bright hover:bg-primary-container/20 hover:border-primary transition-all text-left group">
<div class="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center">
<span class="material-symbols-outlined text-on-primary-container text-[28px]">home</span>
</div>
<div class="flex-1">
<h4 class="font-headline-sm text-headline-sm text-on-surface">Home Visit</h4>
<p class="text-on-surface-variant font-body-md text-body-md">Technician travels to your location. Fast &amp; convenient.</p>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary">check_circle</span>
</button>
<button class="w-full flex items-center gap-6 p-6 rounded-2xl border border-outline-variant bg-surface-bright hover:bg-primary-container/20 hover:border-primary transition-all text-left group">
<div class="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center">
<span class="material-symbols-outlined text-on-secondary-container text-[28px]">storefront</span>
</div>
<div class="flex-1">
<h4 class="font-headline-sm text-headline-sm text-on-surface">Workshop Drop-off</h4>
<p class="text-on-surface-variant font-body-md text-body-md">Bring your item to our nearest certified facility.</p>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary">circle</span>
</button>
<button class="w-full flex items-center gap-6 p-6 rounded-2xl border border-outline-variant bg-surface-bright hover:bg-primary-container/20 hover:border-primary transition-all text-left group">
<div class="w-14 h-14 rounded-full bg-tertiary-container flex items-center justify-center">
<span class="material-symbols-outlined text-on-tertiary-container text-[28px]">local_shipping</span>
</div>
<div class="flex-1">
<h4 class="font-headline-sm text-headline-sm text-on-surface">Pickup Service</h4>
<p class="text-on-surface-variant font-body-md text-body-md">We pick up the item and return it when fixed.</p>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:text-primary">circle</span>
</button>
</div>
</div>
<!-- Step 4: Scheduling -->
<div class="step-transition hidden opacity-0 transform translate-x-10" id="step-4">
<div class="mb-8">
<h1 class="font-headline-md text-headline-md text-on-surface mb-2">Scheduling</h1>
<p class="text-on-surface-variant font-body-md text-body-md">Choose a time that works best for your schedule.</p>
</div>
<div class="flex flex-col lg:flex-row gap-8">
<!-- Calendar Widget -->
<div class="flex-1 bg-surface rounded-xl p-4 border border-outline-variant">
<div class="flex justify-between items-center mb-4 px-2">
<span class="font-bold text-on-surface">September 2024</span>
<div class="flex gap-2">
<button class="material-symbols-outlined text-on-surface-variant">chevron_left</button>
<button class="material-symbols-outlined text-on-surface-variant">chevron_right</button>
</div>
</div>
<div class="custom-calendar-grid mb-2">
<span class="text-center text-label-sm font-label-sm text-outline py-2">S</span>
<span class="text-center text-label-sm font-label-sm text-outline py-2">M</span>
<span class="text-center text-label-sm font-label-sm text-outline py-2">T</span>
<span class="text-center text-label-sm font-label-sm text-outline py-2">W</span>
<span class="text-center text-label-sm font-label-sm text-outline py-2">T</span>
<span class="text-center text-label-sm font-label-sm text-outline py-2">F</span>
<span class="text-center text-label-sm font-label-sm text-outline py-2">S</span>
</div>
<div class="custom-calendar-grid gap-1">
<!-- Placeholder dates -->
<div class="aspect-square flex items-center justify-center rounded-lg text-outline text-label-md font-label-md">28</div>
<div class="aspect-square flex items-center justify-center rounded-lg text-outline text-label-md font-label-md">29</div>
<div class="aspect-square flex items-center justify-center rounded-lg text-outline text-label-md font-label-md">30</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">1</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">2</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">3</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">4</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">5</div>
<div class="aspect-square flex items-center justify-center rounded-lg bg-primary text-on-primary cursor-pointer text-label-md font-label-md">6</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">7</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">8</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">9</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">10</div>
<div class="aspect-square flex items-center justify-center rounded-lg hover:bg-primary-container/20 cursor-pointer text-label-md font-label-md">11</div>
</div>
</div>
<!-- Time Slot Picker -->
<div class="w-full lg:w-48 flex flex-col gap-3">
<h5 class="text-label-md font-label-md text-on-surface-variant mb-1">Available Slots</h5>
<button class="w-full py-3 px-4 rounded-xl border border-primary bg-primary-container/10 text-primary font-bold text-label-md font-label-md">09:00 AM</button>
<button class="w-full py-3 px-4 rounded-xl border border-outline-variant hover:border-primary transition-colors text-on-surface-variant text-label-md font-label-md">11:30 AM</button>
<button class="w-full py-3 px-4 rounded-xl border border-outline-variant hover:border-primary transition-colors text-on-surface-variant text-label-md font-label-md">02:00 PM</button>
<button class="w-full py-3 px-4 rounded-xl border border-outline-variant hover:border-primary transition-colors text-on-surface-variant text-label-md font-label-md">04:30 PM</button>
</div>
</div>
</div>
<!-- Visual Decorative Element -->
<div class="absolute -bottom-16 -right-16 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -z-10"></div>
</div>
<!-- Trust Features -->
<section class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
<div class="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl">
<span class="material-symbols-outlined text-primary" data-weight="fill">verified_user</span>
<span class="text-label-md font-label-md text-on-surface">Certified Technicians</span>
</div>
<div class="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl">
<span class="material-symbols-outlined text-primary" data-weight="fill">update</span>
<span class="text-label-md font-label-md text-on-surface">90-Day Warranty</span>
</div>
<div class="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl">
<span class="material-symbols-outlined text-primary" data-weight="fill">shield</span>
<span class="text-label-md font-label-md text-on-surface">Secure Payment</span>
</div>
</section>
</main>
<!-- Fixed Footer Navigation -->
<footer class="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant z-50">
<div class="max-w-container-max mx-auto h-24 px-margin-desktop flex items-center justify-between">
<button class="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md px-6 py-3 rounded-2xl border border-outline-variant opacity-50 cursor-not-allowed" id="prev-btn">
<span class="material-symbols-outlined">arrow_back</span>
                Back
            </button>
<div class="flex items-center gap-6">
<p class="hidden md:block text-on-surface-variant font-label-md text-label-md">All data is encrypted and secure.</p>
<button class="bg-primary-container text-on-primary-container font-bold px-10 py-4 rounded-2xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-sm" id="next-btn">
                    Next Step
                    <span class="material-symbols-outlined">arrow_forward</span>
</button>
</div>
</div>
</footer>
<!-- Scripts for Step Management -->
<script>
        let currentStep = 1;
        const totalSteps = 4;

        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');

        function updateUI() {
            // Hide all steps
            for (let i = 1; i <= totalSteps; i++) {
                const stepEl = document.getElementById(`step-${i}`);
                const indicatorEl = document.getElementById(`step-indicator-${i}`);
                
                if (i === currentStep) {
                    stepEl.classList.remove('hidden');
                    setTimeout(() => {
                        stepEl.classList.remove('opacity-0', 'translate-x-10');
                        stepEl.classList.add('opacity-100', 'translate-x-0');
                    }, 50);
                    
                    indicatorEl.className = 'w-10 h-10 rounded-full flex items-center justify-center font-bold active-step-circle text-label-md font-label-md';
                } else {
                    stepEl.classList.add('hidden', 'opacity-0', 'translate-x-10');
                    stepEl.classList.remove('opacity-100', 'translate-x-0');
                    
                    if (i < currentStep) {
                        indicatorEl.className = 'w-10 h-10 rounded-full flex items-center justify-center font-bold completed-step-circle text-label-md font-label-md';
                        indicatorEl.innerHTML = '<span class="material-symbols-outlined text-[20px]">check</span>';
                    } else {
                        indicatorEl.className = 'w-10 h-10 rounded-full flex items-center justify-center font-bold inactive-step-circle text-label-md font-label-md';
                        indicatorEl.innerHTML = i;
                    }
                }
            }

            // Button states
            if (currentStep === 1) {
                prevBtn.classList.add('opacity-50', 'cursor-not-allowed');
                prevBtn.disabled = true;
            } else {
                prevBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                prevBtn.disabled = false;
            }

            if (currentStep === totalSteps) {
                nextBtn.innerHTML = 'Submit Request <span class="material-symbols-outlined">send</span>';
                nextBtn.classList.add('bg-primary', 'text-on-primary');
                nextBtn.classList.remove('bg-primary-container', 'text-on-primary-container');
            } else {
                nextBtn.innerHTML = 'Next Step <span class="material-symbols-outlined">arrow_forward</span>';
                nextBtn.classList.remove('bg-primary', 'text-on-primary');
                nextBtn.classList.add('bg-primary-container', 'text-on-primary-container');
            }
        }

        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                updateUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('Repair Request Submitted Successfully!');
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    </script>
</body></html>