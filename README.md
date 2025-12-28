# Axis Configuration Management

A full-stack application for managing system configurations with parent-based inheritance, validation rules, and multi-language support.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Setup & Run

1. **Clone or navigate to the project:**
   ```bash
   cd task-1
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Start the application:**
   ```bash
   docker compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Database Initialization
The database is automatically initialized on first startup using the SQL script in `backend/scripts/init-db.sql`. The schema includes:
- `configurations` table with UUID primary key
- JSON columns for validation rules, parent conditions, and translations
- Timestamps for audit trails

## Architecture

### Backend (FastAPI)
- **Framework:** FastAPI with async/await support
- **Database:** PostgreSQL with SQLAlchemy async ORM
- **Structure:** Clean architecture (API → Service → Repository → Domain)
- **Key Features:**
  - CRUD operations for configurations
  - Parent-based configuration inheritance
  - Validation rules per data type
  - Multi-language translations
  - Async database operations with connection pooling
  - Structured JSON logging

**Endpoints:**
- `POST /api/configurations` - Create new configuration
- `GET /api/configurations?limit=10&offset=0` - List with pagination
- `GET /api/configurations/{id}` - Get single configuration
- `PUT /api/configurations/{id}` - Update configuration
- `DELETE /api/configurations/{id}` - Delete configuration
- `GET /api/configurations/parent-options/{config_id}` - Get available parents
- `GET /health` - Health check

### Frontend (React + TypeScript)
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand
- **Routing:** React Router
- **HTTP Client:** Axios with TypeScript interfaces
- **Styling:** CSS with design tokens

**Pages:**
- **List Page** (`/`) - View all configurations with search and delete
- **Create Page** (`/create`) - Create new configuration with all fields
- **Edit Page** (`/edit/:id`) - Update existing configuration

**Components:**
- Button - Primary/secondary variants with sizes
- Card - Reusable container with title and content
- FormField - Label, input wrapper with error display
- Badge - Data type display with color coding

## Configuration Fields

Each configuration supports:
- **Key** - Unique identifier (immutable)
- **Label** - Human-readable name
- **Description** - Additional details
- **Data Type** - string, number, date, or list
- **Default Value** - Fallback value
- **Validation Rules** - Type-specific constraints
  - String: min/max length, regex, allowed values
  - Number: min, max, greater_than, less_than
  - Date: format, min_date, max_date
  - List: max_items, min_items, unique_items
- **Parent Configuration** - Inherit from another config
- **Parent Conditions** - Rules to apply inherited defaults
  - Operators: equals, not_equals, greater_than, contains, date_range, in_list
- **Translations** - Multi-language labels and descriptions
- **Status** - Active/Draft/Inactive

## Development

### Local Development (Without Docker)

**Backend:**
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Set environment variables
export DATABASE_URL="sqlite:///./test.db"
export LOG_LEVEL="DEBUG"

# Run the server
uvicorn src.main:app --reload

# Run tests
pytest

# Run integration tests
pytest tests/integration/
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Common Commands

### Docker Commands
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild images
docker compose up --build

# Run backend tests
docker compose exec backend pytest

# Access backend shell
docker compose exec backend bash

# Access database
docker compose exec postgres psql -U admin -d configurations
```

### Development Workflow
```bash
# Create a new configuration
curl -X POST http://localhost:8000/api/configurations \
  -H "Content-Type: application/json" \
  -d '{
    "key": "api_timeout",
    "label": "API Timeout",
    "description": "Maximum API response time in seconds",
    "data_type": "number",
    "default_value": "30",
    "active": true,
    "validation_rules": [
      {"rule_type": "min", "value": "1"},
      {"rule_type": "max", "value": "300"}
    ]
  }'

# List configurations
curl http://localhost:8000/api/configurations

# Get single configuration
curl http://localhost:8000/api/configurations/{id}

# Update configuration
curl -X PUT http://localhost:8000/api/configurations/{id} \
  -H "Content-Type: application/json" \
  -d '{"label": "Updated Label"}'

# Delete configuration
curl -X DELETE http://localhost:8000/api/configurations/{id}
```

## Project Structure

```
task-1/
├── backend/
│   ├── src/
│   │   ├── main.py                 # FastAPI application
│   │   ├── configs/
│   │   │   └── settings.py         # Configuration management
│   │   ├── domain/
│   │   │   └── configuration.py    # Domain entities
│   │   ├── infrastructure/
│   │   │   └── database/           # SQLAlchemy models and connection
│   │   ├── application/
│   │   │   ├── repositories/       # Data access layer
│   │   │   └── services/           # Business logic
│   │   ├── apis/
│   │   │   ├── models/             # Request/response DTOs
│   │   │   └── routers/            # API endpoints
│   │   └── utils/
│   │       └── logging.py          # Logging configuration
│   ├── tests/
│   │   ├── integration/            # Integration tests
│   │   └── conftest.py             # Pytest fixtures
│   ├── pyproject.toml              # Dependencies
│   ├── Dockerfile                  # Container image
│   └── scripts/
│       └── init-db.sql             # Database initialization
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Main application component
│   │   ├── services/
│   │   │   └── api.ts              # API client with TypeScript interfaces
│   │   ├── store/
│   │   │   └── configurationStore.ts  # Global state management
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   └── styles/
│   │       └── globals.css         # Design tokens and global styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── public/
│
├── docker-compose.yml              # Service orchestration
├── .env.example                    # Environment template
└── README.md                       # This file
```

## Environment Variables

Create a `.env` file at the project root (copy from `.env.example`):

```env
# Database
POSTGRES_USER=admin
POSTGRES_PASSWORD=password
POSTGRES_DB=configurations
DATABASE_URL=postgresql+asyncpg://admin:password@postgres:5432/configurations

# Backend
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:8000/api
```

## Design System

The application follows the Figma design tokens:

**Colors:**
- Primary Dark: #0b1739
- Primary Green: #66d1a3
- Primary Blue: #e5e2fa
- Text Primary: #ffffff
- Text Secondary: #97a3b7
- Text Dark: #1a1f26

**Typography:**
- Font: Inter
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- Sizes: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px)

**Spacing:**
- Base unit: 8px
- Scale: 4px, 8px, 12px, 16px, 20px, 24px, 32px

## Testing

### Backend
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=src tests/

# Run integration tests only
pytest tests/integration/

# Run unit tests only
pytest tests/unit/
```

### Frontend
```bash
cd frontend

# Run tests
npm run test

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `docker compose logs postgres`
- Check DATABASE_URL environment variable is set correctly
- Verify migrations have run: `docker compose exec backend alembic upgrade head`

### Frontend won't connect to backend
- Check VITE_API_URL is set to correct backend URL
- Verify CORS_ORIGINS includes frontend URL in backend .env
- Check backend is running: `curl http://localhost:8000/health`

### Database connection issues
- Reset database: `docker compose down -v && docker compose up`
- Check database logs: `docker compose logs postgres`
- Verify credentials in docker-compose.yml match .env

## API Examples

### Create Configuration with Parent Conditions
```json
{
  "key": "feature_flags",
  "label": "Feature Flags",
  "data_type": "list",
  "parent_config_id": "uuid-of-parent",
  "parent_conditions": [
    {
      "operator": "equals",
      "value": "production",
      "default_value": "[\"feature_a\", \"feature_b\"]"
    }
  ],
  "validation_rules": [
    {"rule_type": "unique_items", "value": "true"}
  ]
}
```

### Create Configuration with Translations
```json
{
  "key": "app_title",
  "label": "Application Title",
  "default_value": "Axis Configuration Manager",
  "translations": [
    {
      "language": "fr",
      "label": "Titre de l'Application",
      "description": "Gestionnaire de Configuration Axis"
    },
    {
      "language": "es",
      "label": "Título de la Aplicación",
      "description": "Gestor de Configuración Axis"
    }
  ]
}
```

## Performance Considerations

- Pagination (limit, offset) to handle large configuration lists
- Database indexes on frequently queried fields (key, active status)
- Async database operations for high-concurrency scenarios
- Frontend state caching with Zustand
- Lazy loading of translations and validation rules

## Security Notes

- Environment variables should never be committed to version control
- Change default database password in production
- Use HTTPS in production environments
- Implement authentication/authorization before deploying to production
- Validate all user inputs on both frontend and backend
- Use SQL parameterization to prevent injection attacks (SQLAlchemy handles this)

## Future Enhancements

- [ ] Authentication/Authorization (OAuth2, JWT)
- [ ] Audit logging with timestamps and user tracking
- [ ] Batch operations (import/export)
- [ ] Configuration versioning and rollback
- [ ] Advanced filtering and search
- [ ] Configuration templates
- [ ] Webhook notifications on configuration changes
- [ ] API rate limiting and throttling
- [ ] Advanced validation rule builder UI
- [ ] Configuration dependency graph visualization

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Docker logs: `docker compose logs -f`
3. Check application logs in the console output
4. Review API documentation at http://localhost:8000/docs
