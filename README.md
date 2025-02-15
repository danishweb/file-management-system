# File Management System

A microservices-based file management system built with Node.js, MongoDB, and pnpm workspaces.

## Architecture

The system consists of four microservices:
- **API Gateway** (Port: 5000): Central entry point for all services
- **User Service** (Port: 5001): Handles user authentication and management
- **Hierarchy Service** (Port: 5002): Manages file/folder hierarchy and structure
- **Version Service** (Port: 5003): Manages file versioning and storage

For detailed technical architecture and implementation details, check out my [Architecture Documentation](./ARCHITECTURE.md).

## Trade-off Analysis (The Good & The Bad)

Hey there! 👋 Let me walk you through the choices I made while building this system and why I made them. Every choice has its ups and downs, so let's break it down:

### 1. Breaking it into Small Pieces (Microservices) 🧩
Think of it like having different specialists instead of one person doing everything.

**What's Cool About It:**
- Each part can grow on its own (like adding more power to just the upload service when needed)
- If one part breaks, the others keep working (like if user login is down, people can still view files)

**The Not-So-Cool Parts:**
- More moving parts = more complexity (like coordinating between different pieces)
- Things take a bit longer (messages have to travel between services)

### 2. How I Store Folders (Data Structure) 📁
I had two ways to store folder structures - like a family tree or a full address.

**The Full Address Way (What I Chose):**
```
/Documents/Work/Project1
```
- Super fast to find things (like typing your full address vs giving directions)
- BUT moving folders around is slower (like changing everyone's address when a street name changes)

### 3. Handling File Uploads 📤
I needed to decide how to handle files when people upload them.

**What I Did:**
- Save files to disk temporarily (like a staging area)
- Keep track of versions (like 1.0, 1.1, 2.0)

**Good Stuff:**
- Won't crash if someone uploads a huge file
- Keeps track of changes nicely

**Challenges:**
- Files sit on disk temporarily (needs cleanup)
- Might get messy if two people upload at the exact same time

### 4. Security Stuff 🔒
I went with simple API keys for now.

**The Good:**
- Easy to set up and use
- Gets the job done

**The 'Could Be Better':**
- Not as secure as it could be
- Planning to upgrade to something fancier (JWT) later

### 5. Cleaning Up After Ourselves 🧹
I made sure to clean up temporary files.

**What's Nice:**
- Keeps the system tidy
- Doesn't waste space

**What Could Be Better:**
- Sometimes cleanup might fail silently
- Might need a cleanup crew (background job) later

### 6. Where I Store Files 💾
Right now, files are stored on the same computer running the service.

**Why I Did This:**
- Easy to build and test
- Works great for getting started

**Future Plans:**
- Move to cloud storage (like AWS S3)
- Better for handling lots of files and keeping them safe

### The Bottom Line 🎯
I made choices that help me:
1. Get up and running quickly
2. Keep things organized
3. Make it easy to improve later

But I know some things could be better, and I've got plans to upgrade as the system grows! 

Need more details about any of these choices? Just ask! 😊

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

## API Endpoints

All API requests should go through the API Gateway at `http://localhost:5000/api`

### User Service (`/api/users`)
- POST `/register` - Register new user
- POST `/login` - User login
- POST `/refresh` - Refresh access token

### Hierarchy Service (`/api/hierarchy`)
- File/folder structure management
- Connects to Version Service for file operations

### Version Service (`/api/versions`)
- File storage and versioning
- File upload/download management

## Available Scripts

- `pnpm dev`: Start all services in development mode
- `pnpm build`: Build all services
- `pnpm clean`: Clean up build artifacts and node_modules
- `pnpm install:all`: Install dependencies across all workspaces

## Development Notes

1. **API Gateway**
   - Single entry point for all API requests
   - Routes requests to appropriate microservices
   - Handles CORS and error scenarios
   - Health check endpoint at `/health`

2. **Workspace Structure**
   - Uses pnpm workspaces for monorepo management
   - Each service is an independent package
   - Shared dependencies are hoisted to the root

3. **MongoDB Requirements**
   - Transactions are used across services
   - Requires MongoDB replica set
   - Each service uses its own database for isolation

4. **Environment Variables**
   - Each service has its own `.env` file
   - Use `setup-env.sh` to configure all services
   - Never commit `.env` files to version control

## Testing with Postman

A Postman collection is available in the `docs` folder. To use it:
1. Import the collection into Postman
2. Set up your environment variables in Postman:
   - `gateway_url`: http://localhost:5000/api
   - `access_token`: Your JWT token after login

## License

[License details here]