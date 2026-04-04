#!/bin/bash

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Create database
echo "Creating database..."
python -c "from app.database import Base; from app.database import engine; Base.metadata.create_all(bind=engine)"

# Run migrations
echo "Running migrations..."
python -c "from app.database import Base; from app.database import engine; Base.metadata.create_all(bind=engine)"

echo "Backend setup completed successfully!"