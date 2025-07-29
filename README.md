# Beach Safety Frontend

A modern React TypeScript frontend for the Beach Safety Management System with Material-UI and real-time features.

##  Features

### Authentication & Authorization
- **Role-based Access Control**: Three user roles (Lifeguard, Center Admin, System Admin)
- **JWT Authentication**: Secure login/logout with token management
- **Form Validation**: Comprehensive form validation with Yup and React Hook Form
- **Protected Routes**: Role-based route protection

### User Interface
- **Material-UI Design**: Modern, responsive design system
- **Responsive Layout**: Mobile-first design with sidebar navigation
- **Theme Customization**: Custom theme with beach safety branding
- **Loading States**: Smooth loading experiences

### Real-time Features
- **Socket.io Integration**: Real-time communication with backend
- **Live Updates**: Weather data, emergency alerts, and status changes
- **Event-driven Architecture**: Efficient real-time event handling

### Component Architecture
- **Modular Design**: Organized component structure by feature
- **TypeScript**: Full type safety throughout the application
- **Custom Hooks**: Reusable logic for common operations
- **Context API**: Global state management for authentication

##  Tech Stack

- **React 18** with TypeScript
- **Material-UI v5** for UI components
- **React Router v6** for navigation
- **React Hook Form** with Yup validation
- **Socket.io Client** for real-time features
- **Axios** for API communication
- **React Query** for data fetching
- **Date-fns** for date manipulation

##  Project Structure

```
src/
 components/
    auth/                 # Authentication components
       LoginPage.tsx
       RegisterPage.tsx
    common/               # Shared components
       Layout.tsx
       LoadingScreen.tsx
    public/               # Public dashboard
       PublicDashboard.tsx
    lifeguard/            # Lifeguard-specific components
       LifeguardDashboard.tsx
       ShiftManagement.tsx
       EmergencyAlerts.tsx
       IncidentReports.tsx
    admin/                # Center admin components
       CenterDashboard.tsx
       CenterManagement.tsx
       LifeguardManagement.tsx
       ShiftScheduling.tsx
       SafetyManagement.tsx
    system-admin/         # System admin components
        SystemDashboard.tsx
        SystemCenterManagement.tsx
        SystemUserManagement.tsx
        SystemReports.tsx
 context/
    AuthContext.tsx       # Authentication context
 services/
    api.ts               # API service layer
    socket.ts            # Socket.io service
 types/
    index.ts             # TypeScript type definitions
 hooks/                   # Custom hooks (future)
 utils/                   # Utility functions (future)
 App.tsx                  # Main application component
```

##  Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend server running on port 5000

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

### Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000
```

##  Authentication Flow

1. **Public Access**: Users can view the public dashboard
2. **Login/Register**: Users authenticate with email/password
3. **Role-based Routing**: Users are redirected based on their role:
   - Lifeguards → `/lifeguard`
   - Center Admins → `/admin`
   - System Admins → `/system`

##  UI Components

### Layout System
- **AppBar**: Top navigation with user menu
- **Sidebar**: Role-based navigation menu
- **Responsive Design**: Mobile-friendly layout

### Form Components
- **Login Form**: Email/password authentication
- **Registration Form**: User registration with role selection
- **Validation**: Real-time form validation with error messages

### Dashboard Components
- **Public Dashboard**: Landing page with system overview
- **Role-specific Dashboards**: Tailored interfaces for each user type
- **Statistics Cards**: Key metrics and system status

##  API Integration

### Service Layer
- **API Service**: Centralized API communication
- **Error Handling**: Consistent error handling across the app
- **Authentication**: Automatic token management

### Real-time Communication
- **Socket.io Client**: Real-time event handling
- **Event Types**: Weather updates, emergency alerts, status changes
- **Connection Management**: Automatic reconnection and error handling

## 🧪 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Material-UI**: Consistent design system

##  Configuration

### Theme Customization

The app uses a custom Material-UI theme with:
- Primary color: Blue (#1976d2)
- Secondary color: Red (#dc004e)
- Custom typography and component styles

### Routing Configuration

- **Public Routes**: `/`, `/login`, `/register`
- **Protected Routes**: Role-based access control
- **404 Handling**: Automatic redirects based on user role

##  Deployment

### Build for Production

```bash
npm run build
```

### Environment Setup

Ensure the backend API URL is correctly configured for production:

```env
REACT_APP_API_URL=https://your-api-domain.com
```

##  Integration with Backend

The frontend integrates with the backend API through:

1. **REST API**: HTTP requests for CRUD operations
2. **WebSocket**: Real-time communication
3. **JWT Authentication**: Secure token-based auth
4. **CORS**: Cross-origin resource sharing

##  Responsive Design

The application is fully responsive with:
- **Mobile-first approach**
- **Breakpoint system**: xs, sm, md, lg, xl
- **Touch-friendly interfaces**
- **Optimized navigation for mobile**

##  Future Enhancements

- **Interactive Maps**: Leaflet integration for location tracking
- **Real-time Charts**: Weather and safety data visualization
- **Push Notifications**: Browser notifications for alerts
- **Offline Support**: Service worker for offline functionality
- **Advanced Analytics**: Detailed reporting and analytics
- **Multi-language Support**: Internationalization (i18n)

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for all new components
3. Follow Material-UI design patterns
4. Add proper error handling
5. Test thoroughly before submitting

##  License

This project is part of the Beach Safety Management System.
