# Local Business Ranking Tool - TypeScript Edition

A comprehensive Next.js 14 application built with TypeScript and the App Router for tracking local business rankings and competitor analysis using Google Maps and Places APIs.

## 🚀 Features

- **Full TypeScript Support**: Complete type safety throughout the application
- **Business Search**: Find businesses using Google Places API integration
- **Location Targeting**: Select specific areas for ranking analysis
- **Interactive Map**: Visual representation of business rankings with heat zones
- **Competitor Analysis**: Compare your business against competitors with detailed metrics
- **Ranking Metrics**: Track visibility scores and difficulty ratings
- **Export Options**: Export results as CSV, JSON, or PDF
- **Advanced Filters**: Customize search radius, ratings, and result limits
- **Real-time Updates**: Live ranking analysis with loading states
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Google Maps JavaScript API
- **Search**: Google Places API
- **State Management**: React Hooks with TypeScript
- **Type Definitions**: Custom types + Google Maps types

## 📁 Project Structure

```
app/
├── components/           # React components with TypeScript
│   ├── BusinessSearch.tsx
│   ├── RankingMap.tsx
│   ├── CompetitorsList.tsx
│   ├── SearchFilters.tsx
│   └── ExportOptions.tsx
├── hooks/               # Custom hooks with TypeScript
│   ├── useDebounce.ts
│   └── useGeolocation.ts
├── api/                 # API routes with TypeScript
│   ├── search-businesses/
│   └── analyze-rankings/
├── globals.css
├── layout.tsx
└── page.tsx
lib/                     # Utility libraries with TypeScript
├── googlePlaces.ts
└── rankingService.ts
types/
└── index.ts            # Global type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- TypeScript 5+
- Google Cloud Platform account
- Google Maps API key
- Google Places API key

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd local-ranking-tool
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

4. **Add your API keys to `.env.local`:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
GOOGLE_PLACES_API_KEY=your_places_api_key_here
```

5. **Run type checking:**
```bash
npm run type-check
```

6. **Run the development server:**
```bash
npm run dev
```

### TypeScript Configuration

The project includes comprehensive TypeScript configuration:

- **Strict Mode**: Enabled for maximum type safety
- **Path Mapping**: Configured for clean imports (`@/types`, `@/components`, etc.)
- **Google Maps Types**: Included for Maps API integration
- **Custom Types**: Defined for all business logic

## 🎯 Type Safety Features

### Custom Type Definitions

```typescript
interface Business {
  id: string | number;
  name: string;
  address: string;
  placeId: string;
  rating?: number;
  reviews?: number;
  lat?: number;
  lng?: number;
  visibility?: number;
  difficulty?: 'LOW' | 'MEDIUM' | 'HIGH';
  rank?: number;
  isTarget?: boolean;
}

interface RankingData {
  center: Location;
  timestamp: string;
  businesses: Business[]; 
}
```

### Component Props

All components are fully typed with interfaces:

```typescript
interface BusinessSearchProps {
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business | null) => void;
  location: string;
  onLocationChange: (location: string) => void;
  keywords: string;
  onKeywordsChange: (keywords: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}
```

### API Routes

Type-safe API routes with proper request/response types:

```typescript
interface SearchBusinessesRequest {
  query: string;
  location: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: SearchBusinessesRequest = await request.json();
  // Type-safe handling
}
```

## 🔧 Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**: Import your GitHub repository to Vercel
2. **Environment Variables**: Configure in Vercel dashboard
3. **TypeScript Build**: Automatic type checking during build
4. **Deploy**: Automatic deployment on git push

### Environment Variables for Production

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
GOOGLE_PLACES_API_KEY=your_key
```

## 🎨 Customization

### Adding New Types

```typescript
// types/index.ts
export interface NewFeature {
  id: string;
  name: string;
  // Add your properties
}
```

### Extending Components

```typescript
// app/components/NewComponent.tsx
interface NewComponentProps {
  data: SomeType;
  onAction: (value: string) => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ data, onAction }) => {
  // Fully typed component logic
};
```

## 🔍 Type Checking

The project enforces strict TypeScript checking:

- **No implicit any**: All variables must be explicitly typed
- **Strict null checks**: Prevents null/undefined errors
- **No unused locals**: Helps keep code clean
- **Return type annotations**: Required for complex functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Ensure TypeScript compliance (`npm run type-check`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
