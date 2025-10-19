# Authentication Service

This folder contains the authentication service for integrating with the backend API.

## Setup

1. Create a `.env.local` file in the frontend root directory based on `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update the `NEXT_PUBLIC_API_URL` in `.env.local` with your backend API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## Usage

### Importing the service

```typescript
import { authService } from '@/services';
// or
import { authService } from '@/services/authService';

// Import types separately
import type { RegisterData, LoginData, User } from '@/services/types/user';
```

### Register a new user

```typescript
import { authService } from '@/services';
import type { RegisterData } from '@/services/types/user';

const registerUser = async () => {
  try {
    const data: RegisterData = {
      email: 'user@example.com',
      password: 'securePassword123',
      full_name: 'John Doe',
      university: 'University Name'
    };
    
    const response = await authService.register(data);
    console.log('Registration successful:', response.data.user);
    // Tokens are automatically stored in localStorage
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
};
```

### Login an existing user

```typescript
import { authService } from '@/services';
import type { LoginData } from '@/services/types/user';

const loginUser = async () => {
  try {
    const data: LoginData = {
      email: 'user@example.com',
      password: 'securePassword123'
    };
    
    const response = await authService.login(data);
    console.log('Login successful:', response.data.user);
    // Tokens are automatically stored in localStorage
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};
```

### Logout

```typescript
import { authService } from '@/services';

const logoutUser = () => {
  authService.logout();
  // Redirects to login page or home page
};
```

### Check authentication status

```typescript
import { authService } from '@/services';

const isAuthenticated = authService.isAuthenticated();
if (isAuthenticated) {
  const user = authService.getCurrentUser();
  console.log('Current user:', user);
}
```

### Get tokens

```typescript
import { authService } from '@/services';

const accessToken = authService.getAccessToken();
const refreshToken = authService.getRefreshToken();
```

## API Response Format

Both register and login endpoints return the following structure:

```typescript
{
  success: true,
  message: "User registered successfully" | "Login successful",
  data: {
    user: {
      user_id: string;
      email: string;
      full_name: string;
      university: string;
      created_at: string;
      last_login: string;
    },
    tokens: {
      accessToken: string;
      refreshToken: string;
    }
  }
}
```

## Error Handling

All service methods throw errors that can be caught with try-catch blocks. Error messages are extracted from the API response or provide a default message.

```typescript
try {
  await authService.login(loginData);
} catch (error) {
  // error.message will contain the error description
  console.error(error.message);
}
```

## Storage

The service automatically stores the following in `localStorage`:
- `accessToken`: JWT access token for authenticated requests
- `refreshToken`: JWT refresh token for obtaining new access tokens
- `user`: User object as JSON string

## Auth Guard

Protect routes that require authentication using the `AuthGuard` component:

```typescript
import { AuthGuard } from '@/components/auth-guard';

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
```

The `AuthGuard` component:
- Checks if the user is authenticated
- Redirects to `/login` if not authenticated
- Stores the attempted URL to redirect back after login
- Shows a loading spinner while checking authentication

## Custom Auth Hook

Use the `useAuth` hook for easier authentication management:

```typescript
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' });
      // Automatically redirects to dashboard or stored redirect URL
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.full_name}</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## Axios Interceptors

The service includes automatic interceptors:

### Request Interceptor
- Automatically adds `Authorization: Bearer <token>` header to all requests
- **Excludes** `/api/auth/login` and `/api/auth/register` endpoints
- No manual token management needed

### Response Interceptor
- Handles 401 (Unauthorized) errors automatically
- Attempts to refresh the access token using the refresh token
- Retries the original request with the new token
- Redirects to login if refresh fails
- Clears all auth data on refresh failure

## Token Refresh Flow

```
1. API request returns 401
2. Interceptor catches the error
3. Calls /api/auth/refresh with refresh token
4. Updates tokens in localStorage
5. Retries original request with new token
6. If refresh fails, clears auth data and redirects to /login
```

## Middleware

The Next.js middleware provides an additional layer of route protection:
- Configured to run on all routes except API, static files, and images
- Can be extended to handle server-side authentication checks
- Currently works in conjunction with the client-side `AuthGuard`

## Next Steps

- ✅ Axios interceptors for automatic token refresh
- ✅ Token expiration handling
- ✅ Request interceptors to automatically include access tokens
- ✅ Custom hook for authentication state management (`useAuth`)
- Consider implementing httpOnly cookies for enhanced security
- Add refresh token rotation for additional security
