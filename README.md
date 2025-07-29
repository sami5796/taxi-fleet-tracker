# 🚗 Taxi Fleet Tracker Pro

A modern, comprehensive taxi fleet management system built with Next.js, TypeScript, and Supabase. Features Norwegian language support, driver authentication, photo capture, and real-time fleet monitoring.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Fleet Monitoring** - Track vehicle status, location, and battery levels
- **Driver Authentication** - Secure driver login with photo capture
- **Photo Documentation** - Capture before/after photos for each trip
- **Norwegian Interface** - Complete Norwegian language support
- **Admin Dashboard** - Comprehensive fleet management and statistics

### 🔐 Security & Authentication
- **Driver Validation** - Only authenticated drivers can take/return vehicles
- **Same Driver Policy** - Only the driver who picked up a car can return it
- **Photo Verification** - Document vehicle condition with photos

### 📱 User Experience
- **Mobile Optimized** - Responsive design for all devices
- **Loading States** - Visual feedback during operations
- **Real-time Updates** - Live fleet status updates
- **Dark/Light Theme** - Modern UI with theme switching

### 🛠️ Admin Features
- **Vehicle Management** - Add, edit, and delete vehicles
- **Status Tracking** - Monitor available, busy, maintenance vehicles
- **Photo Management** - View and manage trip photos
- **Reservation System** - Schedule vehicle reservations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd taxi-fleet-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up database**
   ```bash
   # Run the database setup script
   npm run setup-db
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🗄️ Database Setup

The application uses Supabase with the following main tables:

- **cars** - Vehicle information and status
- **drivers** - Driver profiles and authentication
- **photos** - Trip photo storage
- **reservations** - Vehicle reservation system
- **vaktliste** - Driver schedule/roster

## 🎮 Usage

### Driver Authentication
- **Driver ID**: `1234` (for all sample drivers)
- **Driver Names**: `Bruker 1` to `Bruker 10`

### Vehicle Operations
1. **Take Vehicle**: Authenticate → Capture photos → Confirm charge level
2. **Return Vehicle**: Authenticate → Capture photos → Set parking location
3. **Admin Management**: Add/edit vehicles, view statistics, manage photos

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom driver auth system
- **File Storage**: Supabase Storage for photos
- **Deployment**: Vercel

## 📁 Project Structure

```
taxi-fleet-tracker/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   └── types/            # TypeScript types
├── lib/                   # Utility libraries
│   ├── data-service.ts   # Database operations
│   ├── photo-service.ts  # Photo management
│   └── supabase.ts       # Supabase configuration
├── components/            # UI components
└── public/               # Static assets
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
Set these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📸 Features in Detail

### Photo Capture System
- **4-angle capture**: Front, back, left, right
- **Real-time camera**: Mobile-optimized camera interface
- **Photo storage**: Automatic upload to Supabase Storage
- **Trip documentation**: Before/after photos for each trip

### Fleet Management
- **Real-time status**: Available, busy, reserved, maintenance
- **Battery tracking**: Monitor vehicle charge levels
- **Location tracking**: Floor and side parking information
- **Driver assignment**: Track which driver has each vehicle

### Admin Dashboard
- **Statistics cards**: Total, available, in-use, maintenance vehicles
- **Vehicle management**: Add, edit, delete vehicles
- **Photo management**: View and manage trip photos
- **Reservation system**: Schedule and manage vehicle reservations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support or questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for modern fleet management**