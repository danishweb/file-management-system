#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Important Note:${NC}"
echo "This application uses MongoDB transactions which require a replica set."
echo "Local standalone MongoDB instances will not work."
echo "Please use MongoDB Atlas or a replica set configuration."
echo -e "\n"

# Prompt for MongoDB URI
read -p "Please enter your MongoDB Atlas connection string (mongodb+srv://...): " MONGODB_URI

if [ -z "$MONGODB_URI" ]; then
    echo "MongoDB URI is required. Exiting..."
    exit 1
fi

# Function to insert database name into MongoDB URI
get_mongodb_uri_with_db() {
    local uri=$1
    local db_name=$2
    
    # Split the URI into parts before and after mongodb.net
    if [[ "$uri" =~ ^(.*mongodb.net)(.*)$ ]]; then
        local before_net="${BASH_REMATCH[1]}"
        local after_net="${BASH_REMATCH[2]}"
        
        # Remove leading slash from after_net if it exists
        if [[ "$after_net" == /* ]]; then
            after_net="${after_net:1}"
        fi
        
        # Construct the final URI with single slash before db_name and no trailing slash
        echo "${before_net}/${db_name}${after_net}"
    else
        # Fallback if pattern doesn't match
        echo "${uri}/${db_name}"
    fi
}

# Function to create .env file
create_env_file() {
    local service=$1
    local port=$2
    local db_name=$3
    local service_path="backend/$service"
    
    echo "Creating .env for $service..."
    
    # Get MongoDB URI with correct database name
    local final_mongodb_uri=$(get_mongodb_uri_with_db "$MONGODB_URI" "$db_name")
    
    cat > "$service_path/.env" << EOL
PORT=$port

# Database
MONGODB_URI=$final_mongodb_uri

# JWT secrets
EOL

    # Add specific configurations based on service
    case $service in
        "user-service")
            cat >> "$service_path/.env" << EOL
ACCESS_TOKEN_SECRET=fNPdteiAFDCLsZGlBXwmKSxoWaIbMjhu
REFRESH_TOKEN_SECRET=aYBHDXOMiuEAcwSjUkKpvtPnqZFhmbGV
EOL
            ;;
        "version-service")
            cat >> "$service_path/.env" << EOL
JWT_SECRET=fNPdteiAFDCLsZGlBXwmKSxoWaIbMjhu

# Service API key
SERVICE_API_KEY=59ba3700f0fc882ee60d95b7d840a38da007bf3305cd43e5c31e3b2d18f9b1ee

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=1024*1024*1024 # 1GB
EOL
            ;;
        "hierarchy-service")
            cat >> "$service_path/.env" << EOL
JWT_SECRET=fNPdteiAFDCLsZGlBXwmKSxoWaIbMjhu

# Service API key
VERSION_SERVICE_API_KEY=59ba3700f0fc882ee60d95b7d840a38da007bf3305cd43e5c31e3b2d18f9b1ee
VERSION_SERVICE_URL=http://localhost:5003

# File Storage
MAX_FILE_SIZE=1024*1024*1024 # 1GB
EOL
            ;;
    esac
    
    echo -e "${GREEN}✓${NC} Created .env file for $service"
}

# Create .env files for each service
create_env_file "user-service" "5001" "user-service"
create_env_file "version-service" "5003" "version-service"
create_env_file "hierarchy-service" "5002" "hierarchy-service"

echo -e "\n${GREEN}All environment files have been set up successfully!${NC}"
