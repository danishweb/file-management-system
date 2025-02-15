# File Management System

A microservices-based file management system built with Node.js, MongoDB, and pnpm workspaces.

## Architecture

The system consists of three microservices:
- **User Service** (Port: 5001): Handles user authentication and management
- **Hierarchy Service** (Port: 5002): Manages file/folder hierarchy and structure
- **Version Service** (Port: 5003): Manages file versioning and storage

## Prerequisites

- Node.js (v16 or higher)
- pnpm (v8 or higher)
- MongoDB (Replica Set required for transactions)
- Git Bash (for Windows users)

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd file-management-system
   ```

2. **Install Dependencies**
   ```bash
   # Install all dependencies across workspaces
   pnpm install:all
   ```

3. **Environment Setup**
   ```bash
   # Run the environment setup script
   bash setup-env.sh
   ```
   When prompted, enter your MongoDB connection string:
   - For MongoDB Atlas: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
   - For local replica set: `mongodb://localhost:27017`

   > ⚠️ **Important**: This application uses MongoDB transactions which require a replica set.
   > Local standalone MongoDB instances will not work. Please use MongoDB Atlas or configure a local replica set.

4. **Start Development Servers**
   ```bash
   # Start all services in parallel
   pnpm dev
   ```

   Individual services can be started from their respective directories:
   ```bash
   cd backend/user-service
   pnpm dev
   ```

## Service Endpoints

### User Service (5001)
- Authentication endpoints
- User management

### Hierarchy Service (5002)
- File/folder structure management
- Connects to Version Service for file operations

### Version Service (5003)
- File storage and versioning
- File upload/download management

## Available Scripts

- `pnpm dev`: Start all services in development mode
- `pnpm build`: Build all services
- `pnpm clean`: Clean up build artifacts and node_modules
- `pnpm install:all`: Install dependencies across all workspaces

## Development Notes

1. **Workspace Structure**
   - Uses pnpm workspaces for monorepo management
   - Each service is an independent package
   - Shared dependencies are hoisted to the root

2. **MongoDB Requirements**
   - Transactions are used across services
   - Requires MongoDB replica set
   - Each service uses its own database for isolation

3. **Environment Variables**
   - Each service has its own `.env` file
   - Use `setup-env.sh` to configure all services
   - Never commit `.env` files to version control

## License

[License details here]