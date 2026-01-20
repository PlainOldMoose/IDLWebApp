# Implementation Plan: Simple Admin Authentication

## Overview

Add simple admin authentication to IDLWebApp. Three hardcoded admin accounts can log in to access CRUD capabilities for Seasons, Players, Teams, and Matches. The public API remains fully open - no authentication required for viewing data.

**Key Design Decisions:**
- **Public API**: All read endpoints open, no auth required
- **Admin Auth**: 3 hardcoded username/password accounts from environment variables
- **Session-based**: Simple HttpOnly cookies, no JWT complexity
- **Conditional UI**: Admins see edit buttons on existing pages (not separate admin routes)
- **Admin Dashboard**: `/admin` route for statistics, only visible to logged-in admins

## Architecture

### Authentication Flow
```
1. Admin visits /login
2. Enters username/password
3. Backend validates against env var credentials
4. Session cookie set (HttpOnly)
5. Frontend auth store updated
6. Admin sees edit buttons on pages + "Admin" link in navbar
```

### Route Structure
```
/                  → Leaderboard (public, admins see edit buttons)
/matches           → Matches list (public, admins see create/edit/delete)
/seasons           → Seasons list (public, admins see create/edit/delete)
/players/:steamId  → Player profile (public, admins see ELO adjust)
/login             → Admin login form (public, redirects if already logged in)
/admin             → Admin dashboard with statistics (admin only)
```

### Navbar Behavior
```
Regular User:  [Leaderboard] [Matches] [Seasons]
Logged-in Admin: [Leaderboard] [Matches] [Seasons] [Admin] [Logout]
```

## Implementation Phases

### Phase 1: Backend Security Foundation

#### 1.1 Add Dependencies to `backend/pom.xml`

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

#### 1.2 Configure Admin Credentials

**Update**: `backend/src/main/resources/application.properties`

```properties
# Admin credentials (format: username:password, comma-separated)
app.admin.credentials=${ADMIN_CREDENTIALS:admin1:changeme1,admin2:changeme2,admin3:changeme3}

# CORS configuration
app.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:5173}
```

#### 1.3 Create Security Configuration

**File**: `backend/src/main/java/com/plainoldmoose/IDLWebApp/config/SecurityConfig.java`

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.admin.credentials}")
    private String adminCredentials;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // Disable for API simplicity, or configure properly
            .authorizeHttpRequests(auth -> auth
                // Public read endpoints
                .requestMatchers(HttpMethod.GET, "/api/players/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/matches/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/seasons/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/teams/**").permitAll()

                // Auth endpoints
                .requestMatchers("/api/auth/**").permitAll()

                // Admin write endpoints (POST, PUT, DELETE)
                .requestMatchers(HttpMethod.POST, "/api/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")

                // Admin dashboard stats
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        List<UserDetails> users = new ArrayList<>();

        // Parse credentials from env var: "user1:pass1,user2:pass2,user3:pass3"
        for (String credential : adminCredentials.split(",")) {
            String[] parts = credential.trim().split(":");
            if (parts.length == 2) {
                users.add(User.builder()
                    .username(parts[0].trim())
                    .password(passwordEncoder.encode(parts[1].trim()))
                    .roles("ADMIN")
                    .build());
            }
        }

        return new InMemoryUserDetailsManager(users);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

#### 1.4 Create Auth Controller

**File**: `backend/src/main/java/com/plainoldmoose/IDLWebApp/controller/AuthController.java`

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<AdminUserResponse> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.ok(null);
        }

        String username = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(new AdminUserResponse(username, isAdmin));
    }

    @PostMapping("/login")
    public ResponseEntity<AdminUserResponse> login(Authentication authentication) {
        // Spring Security handles the actual authentication via HTTP Basic
        // This endpoint just returns the user info after successful auth
        String username = authentication.getName();
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(new AdminUserResponse(username, isAdmin));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok().build();
    }
}
```

**File**: `backend/src/main/java/com/plainoldmoose/IDLWebApp/dto/response/auth/AdminUserResponse.java`

```java
public record AdminUserResponse(
    String username,
    boolean isAdmin
) {}
```

#### 1.5 Create Admin Stats Controller

**File**: `backend/src/main/java/com/plainoldmoose/IDLWebApp/controller/AdminController.java`

```java
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;
    private final SeasonRepository seasonRepository;
    private final TeamRepository teamRepository;

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
            playerRepository.count(),
            matchRepository.count(),
            seasonRepository.count(),
            teamRepository.count()
        );
    }
}
```

**File**: `backend/src/main/java/com/plainoldmoose/IDLWebApp/dto/response/admin/AdminStatsResponse.java`

```java
public record AdminStatsResponse(
    long totalPlayers,
    long totalMatches,
    long totalSeasons,
    long totalTeams
) {}
```

#### 1.6 Environment Setup

**Create**: `backend/.env.example`

```
# Admin credentials (format: username:password, comma-separated)
# IMPORTANT: Change these in production!
ADMIN_CREDENTIALS=admin1:securepass1,admin2:securepass2,admin3:securepass3

# CORS allowed origins
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Update**: `docker-compose.yml` environment section for backend:

```yaml
backend:
  environment:
    ADMIN_CREDENTIALS: ${ADMIN_CREDENTIALS}
    CORS_ALLOWED_ORIGINS: http://localhost:80
```

---

### Phase 2: Frontend Authentication

#### 2.1 Add Zustand Dependency

```bash
cd frontend && npm install zustand
```

#### 2.2 Create Auth Store

**File**: `frontend/src/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  username: string;
  isAdmin: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const API_URL = 'http://localhost:8080/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (username: string, password: string) => {
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${username}:${password}`),
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const user = await response.json();
            set({ user, isAuthenticated: true });
            return true;
          }
          return false;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        }
      },

      logout: async () => {
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
        } finally {
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include',
          });

          if (response.ok) {
            const user = await response.json();
            if (user) {
              set({ user, isAuthenticated: true, isLoading: false });
              return;
            }
          }
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

#### 2.3 Create Login Page

**File**: `frontend/src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = await login(username, password);

    if (success) {
      navigate('/');
    } else {
      setError('Invalid username or password');
    }

    setIsSubmitting(false);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '100%', maxWidth: '400px' }} className="bg-dark text-light">
        <Card.Body>
          <h2 className="text-center mb-4">Admin Login</h2>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
```

#### 2.4 Create Admin Dashboard Page

**File**: `frontend/src/pages/Admin.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface AdminStats {
  totalPlayers: number;
  totalMatches: number;
  totalSeasons: number;
  totalTeams: number;
}

export default function Admin() {
  const { isAuthenticated, user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      fetch('http://localhost:8080/api/admin/stats', {
        credentials: 'include',
      })
        .then(res => res.json())
        .then(setStats)
        .catch(console.error);
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container className="mt-4">
      <h1 className="title-gradient mb-4">Admin Dashboard</h1>
      <p className="text-muted mb-4">Welcome, {user.username}</p>

      <Row>
        <Col md={3}>
          <Card className="bg-dark text-light mb-3">
            <Card.Body className="text-center">
              <h3>{stats?.totalPlayers ?? '-'}</h3>
              <p className="text-muted mb-0">Players</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-dark text-light mb-3">
            <Card.Body className="text-center">
              <h3>{stats?.totalMatches ?? '-'}</h3>
              <p className="text-muted mb-0">Matches</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-dark text-light mb-3">
            <Card.Body className="text-center">
              <h3>{stats?.totalSeasons ?? '-'}</h3>
              <p className="text-muted mb-0">Seasons</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-dark text-light mb-3">
            <Card.Body className="text-center">
              <h3>{stats?.totalTeams ?? '-'}</h3>
              <p className="text-muted mb-0">Teams</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="bg-dark text-light mt-4">
        <Card.Body>
          <h5>Quick Actions</h5>
          <p className="text-muted">
            Use the edit buttons on the Matches, Seasons, and Player pages to manage data.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
}
```

#### 2.5 Update Navbar with Conditional Admin Link

**Update**: `frontend/src/components/Navbar.tsx`

```typescript
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuthStore } from '../store/authStore';

export default function NavbarComponent() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">IDL</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Leaderboard</Nav.Link>
            <Nav.Link as={Link} to="/matches">Matches</Nav.Link>
            <Nav.Link as={Link} to="/seasons">Seasons</Nav.Link>

            {/* Admin-only link */}
            {isAuthenticated && user?.isAdmin && (
              <Nav.Link as={Link} to="/admin">Admin</Nav.Link>
            )}
          </Nav>

          <Nav>
            {isAuthenticated ? (
              <>
                <Navbar.Text className="me-3">
                  {user?.username}
                </Navbar.Text>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="outline-light" size="sm" as={Link} to="/login">
                Admin Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
```

#### 2.6 Update App.tsx with Routes

**Update**: `frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';

import NavbarComponent from './components/Navbar';
import Leaderboard from './pages/Leaderboard';
import PlayerProfile from './pages/PlayerProfile';
import Matches from './pages/Matches';
import Seasons from './pages/Seasons';
import Login from './pages/Login';
import Admin from './pages/Admin';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

function AppContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <NavbarComponent />
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/players/:steamId" element={<PlayerProfile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/seasons" element={<Seasons />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

#### 2.7 Update API Service for Credentials

**Update**: `frontend/src/services/Api.tsx`

```typescript
import axios from 'axios';

export const BASE_URL = 'http://localhost:8080/api';

// Create axios instance with credentials for session cookies
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// ... existing API functions remain the same ...
```

---

### Phase 3: Conditional Admin UI on Pages

#### 3.1 Example: Matches Page with Admin Controls

**Update**: `frontend/src/pages/Matches.tsx`

```typescript
import { useState } from 'react';
import { Container, Button, Modal, Form } from 'react-bootstrap';
import { useAuthStore } from '../store/authStore';
// ... other imports

export default function Matches() {
  const { user } = useAuthStore();
  const isAdmin = user?.isAdmin ?? false;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  // ... query hooks for matches data

  const handleDelete = async (matchId: number) => {
    if (confirm('Are you sure you want to delete this match?')) {
      // Call delete API
      await fetch(`http://localhost:8080/api/matches/${matchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      // Refetch matches
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="title-gradient">Matches</h2>

        {/* Admin-only create button */}
        {isAdmin && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Match
          </Button>
        )}
      </div>

      {/* Match list */}
      {matches?.map(match => (
        <div key={match.id} className="match-card">
          {/* Match content */}

          {/* Admin-only actions */}
          {isAdmin && (
            <div className="admin-actions mt-2">
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setEditingMatch(match)}
              >
                Edit
              </Button>
              {' '}
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => handleDelete(match.id)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      ))}

      {/* Create/Edit Modal - only rendered for admins */}
      {isAdmin && (
        <Modal show={showCreateModal || !!editingMatch} onHide={() => {
          setShowCreateModal(false);
          setEditingMatch(null);
        }}>
          {/* Modal content with form */}
        </Modal>
      )}
    </Container>
  );
}
```

#### 3.2 Pattern for Other Pages

Apply the same pattern to:
- `Seasons.tsx` - Add create/edit/delete for seasons
- `Leaderboard.tsx` - Add "Adjust ELO" button per player
- `PlayerProfile.tsx` - Add edit player details button

```typescript
// Common pattern for all pages
const { user } = useAuthStore();
const isAdmin = user?.isAdmin ?? false;

// Conditional render
{isAdmin && <Button>Admin Action</Button>}
```

---

### Phase 4: Backend CRUD Endpoints

Add POST, PUT, DELETE endpoints to existing controllers. Spring Security config already protects these for ADMIN role only.

#### 4.1 Season CRUD

**Update**: `backend/src/main/java/com/plainoldmoose/IDLWebApp/controller/SeasonController.java`

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public SeasonSummaryResponse createSeason(@Valid @RequestBody CreateSeasonRequest request) {
    return seasonService.createSeason(request);
}

@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public SeasonSummaryResponse updateSeason(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateSeasonRequest request) {
    return seasonService.updateSeason(id, request);
}

@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Void> deleteSeason(@PathVariable UUID id) {
    seasonService.deleteSeason(id);
    return ResponseEntity.noContent().build();
}
```

#### 4.2 Match, Player, Team CRUD

Follow the same pattern for other controllers.

---

## File Summary

### Backend - Create:
- `config/SecurityConfig.java` - Spring Security configuration
- `controller/AuthController.java` - Login/logout/me endpoints
- `controller/AdminController.java` - Admin stats endpoint
- `dto/response/auth/AdminUserResponse.java`
- `dto/response/admin/AdminStatsResponse.java`
- `dto/request/UpdateSeasonRequest.java`
- `.env.example`

### Backend - Modify:
- `pom.xml` - Add Spring Security dependency
- `application.properties` - Add admin credentials config
- `controller/SeasonController.java` - Add POST/PUT/DELETE
- `controller/MatchController.java` - Add POST/PUT/DELETE
- `controller/PlayerController.java` - Add POST/PUT/DELETE
- `controller/TeamController.java` - Add POST/PUT/DELETE
- `service/*.java` - Add create/update/delete methods
- `docker-compose.yml` - Add environment variables

### Frontend - Create:
- `store/authStore.ts` - Zustand auth state
- `pages/Login.tsx` - Admin login form
- `pages/Admin.tsx` - Admin dashboard

### Frontend - Modify:
- `package.json` - Add zustand
- `components/Navbar.tsx` - Add conditional Admin link + logout
- `App.tsx` - Add auth check + new routes
- `services/Api.tsx` - Add withCredentials
- `pages/Matches.tsx` - Add conditional admin controls
- `pages/Seasons.tsx` - Add conditional admin controls
- `pages/Leaderboard.tsx` - Add conditional admin controls
- `pages/PlayerProfile.tsx` - Add conditional admin controls

---

## Environment Setup

### Local Development

**Create**: `backend/.env`

```
ADMIN_CREDENTIALS=admin1:yourpassword1,admin2:yourpassword2,admin3:yourpassword3
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Docker

**Create**: `.env` in root directory

```
ADMIN_CREDENTIALS=admin1:yourpassword1,admin2:yourpassword2,admin3:yourpassword3
```

---

## Verification

### Test Authentication:
1. Start backend and frontend
2. Visit http://localhost:5173
3. Verify navbar shows only "Admin Login" button (no "Admin" link)
4. Click "Admin Login", enter credentials
5. Verify navbar now shows "Admin" link + username + "Logout"
6. Visit /admin - should show dashboard
7. Visit /matches - should see Create/Edit/Delete buttons
8. Click Logout - verify admin UI disappears

### Test Authorization:
1. While logged out, try POST to `/api/seasons` - should get 401
2. While logged in as admin, try POST to `/api/seasons` - should succeed
3. Visit `/admin` while logged out - should redirect to home

### Test CORS:
1. Check browser console for CORS errors
2. Verify credentials (cookies) sent with requests

---

## Security Notes

- Passwords are stored only in environment variables, never in code
- Session cookies are HttpOnly (not accessible via JavaScript)
- CSRF can be enabled for additional security (currently disabled for simplicity)
- In production, use HTTPS and set `Secure` flag on cookies
- Consider rate limiting on login endpoint to prevent brute force
