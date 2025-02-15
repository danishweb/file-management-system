# File Management System - Architecture Document

## System Overview

The File Management System is a modern, microservices-based application designed to handle file storage, versioning, and user management. The system is built using Node.js and TypeScript, following best practices for scalability, maintainability, and security.

## Architecture Decisions

### 1. Microservices Architecture

**Decision**: Split the application into four distinct microservices
- Gateway Service
- User Service
- Hierarchy Service
- Version Service

**Rationale**:
- **Scalability**: Each service can be scaled independently based on demand
- **Maintainability**: Smaller, focused codebases are easier to maintain and test
- **Technology Flexibility**: Services can evolve independently with different technologies
- **Fault Isolation**: Issues in one service don't directly affect others

### 2. Technology Stack

#### Core Technologies:
- **Node.js & TypeScript**
  - Strong typing and better developer experience
  - Rich ecosystem of packages
  - Excellent async/await support for I/O operations

- **Express.js**
  - Lightweight and flexible
  - Rich middleware ecosystem
  - Easy to extend and customize

- **MongoDB**
  - Schema flexibility for different file types
  - Good performance for document-based data
  - Built-in support for GridFS for file storage
  - Replica set support for transactions

#### Development Tools:
- **pnpm Workspaces**
  - Efficient package management
  - Monorepo support
  - Better dependency deduplication

- **TypeScript**
  - Type safety
  - Better IDE support
  - Enhanced code maintainability

### 3. Service Architecture

#### API Gateway (Port 5000)
- **Purpose**: Single entry point for all client requests
- **Features**:
  - Request routing
  - Cross-Origin Resource Sharing (CORS)
  - Error handling
  - Request logging

#### User Service (Port 5001)
- **Purpose**: Authentication and user management
- **Features**:
  - JWT-based authentication
  - User registration and login
  - Password hashing with bcrypt
  - Input validation
  - Error handling middleware

#### Hierarchy Service (Port 5002)
- **Purpose**: Manage file/folder structure
- **Features**:
  - Folder creation and management
  - File metadata management
  - Access control
  - Tree structure handling

#### Version Service (Port 5003)
- **Purpose**: Handle file storage and versioning
- **Features**:
  - File upload/download
  - Version control
  - File chunking for large files
  - GridFS integration

### 4. Security Measures

1. **Authentication**:
   - JWT-based token system
   - Refresh token rotation
   - Secure password hashing

2. **Authorization**:
   - Role-based access control
   - Resource-level permissions
   - Token validation middleware

3. **Data Protection**:
   - Input validation
   - Request sanitization
   - CORS configuration
   - Environment variable protection

### 5. Database Design

**Decision**: Separate MongoDB database for each service

**Rationale**:
- Data isolation
- Independent scaling
- Reduced coupling
- Transaction support within service boundaries

### 6. Error Handling

**Standardized Error Handling**:
- Custom error classes
- Centralized error middleware
- Consistent error responses
- Detailed logging

### 7. Logging and Monitoring

**Implementation**:
- Winston logger
- Request/Response logging
- Error tracking
- Performance monitoring

### 8. API Documentation

**Approach**: Postman Collection
- Comprehensive API documentation
- Environment variables
- Request/Response examples
- Authentication setup

## Development Workflow

1. **Environment Setup**:
   - `setup-env.sh` script for configuration
   - Environment variable management
   - MongoDB connection setup

2. **Development Process**:
   - TypeScript compilation
   - Hot reloading with ts-node-dev
   - Parallel service development

3. **Testing Strategy**:
   - Unit tests per service
   - Integration tests
   - API testing via Postman

## Conclusion

The architecture is designed to be scalable, maintainable, and secure while providing a solid foundation for future enhancements. The microservices approach allows for independent scaling and development of components while maintaining system reliability and performance.
