# 1st Impression Media Portal

A modern, responsive web application for browsing and filtering media publications. Features a comprehensive database of 1,700+ publications with advanced search, filtering, and sorting capabilities.

## 🌟 Features

- **Comprehensive Database**: Browse 1,738+ media publications with detailed information
- **Advanced Filtering**: Filter by genres, regions, price range, sponsored status, indexing, and backlinks
- **Smart Search**: Real-time search across publication names
- **Flexible Sorting**: Sort by price, DA (Domain Authority), TAT (Turnaround Time), and region
- **Best Sellers**: Quick access to curated top-performing publications
- **Mobile Responsive**: Fully optimized for desktop, tablet, and mobile devices
- **Professional Logos**: SVG logos for major publications with elegant fallback badges
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + Custom Components
- **Icons**: Lucide React
- **Backend**: Express.js (Node.js)
- **Data Format**: JSON

## 📋 Prerequisites

- Node.js 18+ (recommended: Node.js 20+)
- pnpm 10+ (package manager)

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ascend-portal-final-code/ascend-portal
```

2. Install dependencies:
```bash
pnpm install
```

3. (Optional) Configure analytics by creating a `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your analytics credentials if needed.

### Development

Start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build the application for production:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

### Other Commands

- **Type Checking**: `pnpm check`
- **Code Formatting**: `pnpm format`
- **Start Production Server**: `pnpm start`

## 📁 Project Structure

```
ascend-portal/
├── client/                 # Frontend application
│   ├── public/            # Static assets
│   │   ├── data/          # JSON data files
│   │   ├── logos_svg/     # SVG logos
│   │   ├── logos_ascend/  # Legacy logos
│   │   └── logos/         # Generated logos
│   └── src/
│       ├── components/    # React components
│       ├── pages/         # Page components
│       ├── hooks/         # Custom React hooks
│       └── lib/           # Utilities
├── server/                # Backend server
├── tools/                 # Build and conversion scripts
└── shared/                # Shared constants
```

## 🎨 Key Components

### Data Files
- `client/public/table_data_complete.json` - Main publications database
- `client/public/best_sellers.json` - Curated best sellers list
- `client/public/data/logo-registry.json` - Logo mappings

### Main Features
- **Home Page** (`client/src/pages/Home.tsx`) - Main portal interface
- **Filters System** - Advanced filtering with genre, region, and attribute filters
- **Logo Display** - Smart logo loading with professional fallback badges
- **Mobile Experience** - Responsive design with slide-over filters drawer

## 🔧 Data Management

### Converting Source Data

To update the publications database from an Excel file:

```bash
pnpm tsx tools/convert-mediaupdated.ts --in path/to/source.xlsx --out client/public/table_data_complete.json
```

The conversion script handles:
- Column mapping and normalization
- Genre overrides for specific publications
- Logo registry integration
- Data validation and cleanup

## 🌐 Deployment

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
pnpm add -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to complete deployment.

### Option 2: Netlify

1. Install Netlify CLI:
```bash
pnpm add -g netlify-cli
```

2. Build and deploy:
```bash
pnpm build
netlify deploy --prod
```

### Option 3: GitHub Pages

1. Install gh-pages:
```bash
pnpm add -D gh-pages
```

2. Add to `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/repo-name",
  "scripts": {
    "deploy": "pnpm build && gh-pages -d dist"
  }
}
```

3. Deploy:
```bash
pnpm deploy
```

### Option 4: Traditional Hosting

1. Build the application:
```bash
pnpm build
```

2. Upload the `dist/public` folder to your web server.

3. Configure your web server to:
   - Serve `index.html` for all routes (SPA routing)
   - Enable gzip compression
   - Set appropriate cache headers for static assets

## 🎯 Features in Detail

### Filtering
- **Price Range**: Slider control for $0 to $85,000+
- **Genres**: Multi-select with popular categories (News, Business, Tech, etc.)
- **Regions**: Geographic filtering (USA, UK, Australia, Middle East, etc.)
- **Attributes**: Sponsored, Indexed, Do-Follow/Backlink status
- **Reset**: One-click reset of all filters

### Sorting
- Price (ascending/descending)
- Domain Authority (DA)
- Turnaround Time (TAT)
- Region (alphabetical)

### Best Sellers
Quick access to 30+ curated top-performing publications including:
- Rolling Stone
- Forbes
- USA Today
- Wired
- And more...

## 🔐 Environment Variables

The following environment variables are optional:

- `VITE_ANALYTICS_WEBSITE_ID` - Umami analytics website ID
- `VITE_ANALYTICS_ENDPOINT` - Umami analytics endpoint URL

If not provided, the application will run without analytics tracking.

## 🐛 Troubleshooting

### Build Warnings
The analytics warnings during build are expected if you haven't configured analytics. They won't affect the application functionality.

### Port Already in Use
If port 5173 is already in use, Vite will automatically try the next available port.

### Missing Dependencies
If you encounter dependency issues, try:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📝 License

MIT

## 🤝 Contributing

This is a private project for 1st Impression Media. For questions or support, please contact the development team.

## 📧 Support

For technical support or questions about the portal, please contact your system administrator.

---

**Built with ❤️ for 1st Impression Media**

