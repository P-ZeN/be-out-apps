# GitHub Copilot Instructions for Be-Out Apps

## Project Architecture

**Monorepo Structure**: 4 interconnected applications running simultaneously during development:
- `server/` - Express.js API (port 3000) with PostgreSQL, OAuth, and file uploads
- `client/` - React/Vite user app (port 5173) with Tauri mobile support
- `admin-client/` - React/Vite admin panel (port 5174) for content management
- `organizer-client/` - React/Vite organizer panel (port 5175) for event management

**Key Pattern**: Always run from project root `/home/zen/dev/be-out-apps` - use `npm run dev` to start all apps or `npm run dev:client|server|admin|organizer` for individual services.

## Development Environment

**Platform**: WSL/Linux with bash (not Windows PowerShell)
**Package Manager**: Uses npm workspaces, not individual node_modules
**Port Management**: Check `netstat -tlnp | grep -E ":(3000|5173|5174|5175)"` before starting to avoid conflicts

**Always Running Applications**: Assume `npm run dev` is already running all 4 apps during development:
- Don't suggest starting/stopping individual apps unless specifically needed
- Check existing terminal logs for debugging information instead of restarting
- Use `get_terminal_output` or check running processes for status

```bash
# Correct development startup
cd /home/zen/dev/be-out-apps
npm run dev  # Starts all 4 applications

# Individual apps for debugging
npm run dev:server    # API only
npm run dev:client    # User app only
```

## Mobile Development (Tauri)

**Critical**: Tauri builds MUST run from project root due to monorepo structure:

```bash
cd /home/zen/dev/be-out-apps  # NOT from client/
export VITE_API_URL="https://server.be-out-app.dedibox2.philippezenone.net"
export VITE_GOOGLE_CLIENT_ID_DESKTOP="1064619689471-mrna5dje1h4ojt62d9ckmqi3e8q07sjc.apps.googleusercontent.com"
export VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJrc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw"
npm run tauri:android:build
```

**Mobile Auth Pattern**: Uses custom Tauri plugin `tauri-plugin-google-auth/` with platform detection:
- Android: Native Google Sign-in with Credential Manager
- Desktop: OAuth with system browser + deep links
- Web: Standard OAuth redirects
- **CRITICAL**: Plugin temporarily disabled - DO NOT MODIFY - preserve for future testing

## Authentication Architecture

**Multi-Platform OAuth**: Server handles 3 distinct auth flows:
- `routes/auth.js` - Standard web OAuth (Passport.js)
- `routes/mobileAuth.js` - Mobile app token exchange
- `routes/desktopAuth.js` - Desktop app PKCE flow

**Key Pattern**: Client detects platform via `utils/platformDetection.js` and routes to appropriate auth service.

**Major Pain Point**: Google OAuth requires 3 separate implementations (web/Android/iOS) - extremely complex to maintain and debug.

## Theming & UI Consistency

**Centralized Theme System**: All 3 client apps use Material-UI with shared theme configuration:
- Theme defined in `client/src/theme.js` as source of truth
- Avoid inline styles - use theme tokens and sx prop
- Colors, typography, spacing should reference theme values
- Copy theme patterns across admin-client and organizer-client for consistency
- **ALWAYS** check `docs/MUI_GRID_SYNTAX_REMINDER.md` before using Grid components

## API Configuration

**Environment-Driven URLs**: All services use `VITE_API_BASE_URL` for flexibility:
```javascript
// services/*.js pattern
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
```

**File Uploads**: Server serves static files directly (no nginx needed for development):
```javascript
// Server pattern in index.js
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
```

## Translation System

**Supported Languages**: French (fr), English (en), Spanish (es)
- Default language: French (fr)
- Fallback language: English (en)
- All client applications support full i18n with language detection and localStorage persistence
- Server-side i18n infrastructure available in `server/src/i18n/index.js`

**Centralized Translation System**: All translations stored in `server/translations/` for persistence:
- Client & Organizer-client use HTTP backend to load from server API
- Admin interface edits translations directly in server files
- Changes persist across deployments via volume mounts
- **CRITICAL**: Organizer-client currently broken (uses hardcoded strings instead of server API)

## Database & Services

**Remote PostgreSQL**: Database hosted on same server as Dockploy deployment
- **CRITICAL**: All schema changes require operator execution via remote console
- **AGENT RESTRICTION**: AI agents MUST NOT execute any database operations directly
- **PROTOCOL**: ALL queries must be prepared as SQL statements for operator to execute manually
- Always check `docs/schema.sql` before planning structure changes
- Ask operator to verify current schema matches docs before modifications
- Prepare SQL statements for operator to execute, then provide results back
- Follow `docs/DATABASE_OPERATIONS_PROTOCOL.md` for all database interactions

**Connection**: PostgreSQL with connection pooling (`server/src/db.js`)
**File Storage**: Local volume storage (not MinIO) - files persist in Docker volumes
**Email**: SendGrid integration for notifications
**Maps**: Mapbox with token in environment variables

## Deployment (Dockploy)

**Build-time vs Runtime Variables**: Critical distinction for Vite apps:
- Build-time: `VITE_*` variables must be available during Docker build
- Runtime: Environment replacement in `docker-entrypoint.sh`

**Volume Mounts for Persistence**:
- `/app/uploads` for file storage
- `/app/translations` for live translation editing

## Development Philosophy

**Avoid Overengineering**: Keep solutions simple and direct
- **NO "fallback methods"** unless explicitly requested
- Circumventing roadblocks with fallbacks creates exponentially more problems
- Address root issues directly rather than working around them
- Less is more - prefer simple, maintainable solutions

## Common Patterns

**Error Handling**: Check `get_errors` tool output when debugging - project has comprehensive error tracking
**Internationalization**: Use `useTranslation()` hook with namespace: `t('key', { ns: 'namespace' })`
**Platform Detection**: Always check `areTauriApisAvailable()` before using Tauri APIs
**File Organization**: Services in `services/`, components in `components/`, utilities in `utils/`

## Documentation Management

**Critical Issue**: `/docs` folder has grown excessively with overlapping/obsolete content
- **ALWAYS** check existing docs before creating new ones
- Update/consolidate rather than duplicate information
- Mark obsolete docs clearly or remove them
- Keep all documentation in `/docs` folder for centralization
- Many current docs may be misleading - verify before following

## Development Gotchas

- Tauri builds fail if run from `client/` directory - always use project root
- Translation changes may need browser refresh (not auto-reload)
- OAuth requires HTTPS in production - use desktop client credentials, not web
- Environment variables need different handling for development vs Docker builds
- Port conflicts common - check running processes before starting apps
- **NO fallback implementations** - solve root problems, don't work around them
