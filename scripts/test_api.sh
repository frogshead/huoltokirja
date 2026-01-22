#!/bin/bash
# API Test Script for Huoltokirja
# Usage: ./scripts/test_api.sh [base_url]
# Example: ./scripts/test_api.sh http://localhost:8000

set -e

BASE_URL="${1:-http://localhost:8000}"
API_URL="$BASE_URL/api/v1"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Huoltokirja API Test Script${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo -e "${BLUE}======================================${NC}"
echo

# Health check
echo -e "${YELLOW}[1] Health Check${NC}"
curl -s "$BASE_URL/health" | jq .
echo

# ==================== ITEMS ====================
echo -e "${BLUE}==================== ITEMS ====================${NC}"
echo

# List root items
echo -e "${YELLOW}[2] List Root Items${NC}"
curl -s "$API_URL/items" | jq .
echo

# Create a root item
echo -e "${YELLOW}[3] Create Root Item (Garage)${NC}"
GARAGE=$(curl -s -X POST "$API_URL/items" \
  -H "Content-Type: application/json" \
  -d '{"name": "Garage", "description": "Storage and workshop"}')
echo "$GARAGE" | jq .
GARAGE_ID=$(echo "$GARAGE" | jq -r '.id')
echo -e "${GREEN}Created item ID: $GARAGE_ID${NC}"
echo

# Create child items
echo -e "${YELLOW}[4] Create Child Item (Lawnmower)${NC}"
LAWNMOWER=$(curl -s -X POST "$API_URL/items/$GARAGE_ID/children" \
  -H "Content-Type: application/json" \
  -d '{"name": "Lawnmower", "description": "Honda self-propelled mower"}')
echo "$LAWNMOWER" | jq .
LAWNMOWER_ID=$(echo "$LAWNMOWER" | jq -r '.id')
echo -e "${GREEN}Created item ID: $LAWNMOWER_ID${NC}"
echo

echo -e "${YELLOW}[5] Create Child Item (Snowblower)${NC}"
SNOWBLOWER=$(curl -s -X POST "$API_URL/items/$GARAGE_ID/children" \
  -H "Content-Type: application/json" \
  -d '{"name": "Snowblower", "description": "Two-stage snowblower"}')
echo "$SNOWBLOWER" | jq .
SNOWBLOWER_ID=$(echo "$SNOWBLOWER" | jq -r '.id')
echo

# Get item with children
echo -e "${YELLOW}[6] Get Item with Children${NC}"
curl -s "$API_URL/items/$GARAGE_ID" | jq .
echo

# Update item
echo -e "${YELLOW}[7] Update Item${NC}"
curl -s -X PUT "$API_URL/items/$LAWNMOWER_ID" \
  -H "Content-Type: application/json" \
  -d '{"name": "Lawnmower", "description": "Honda HRX217 self-propelled mower, purchased 2022"}' | jq .
echo

# ==================== MAINTENANCE ====================
echo -e "${BLUE}==================== MAINTENANCE ====================${NC}"
echo

# Set maintenance schedule
echo -e "${YELLOW}[8] Set Maintenance Schedule (every 30 days)${NC}"
curl -s -X PUT "$API_URL/items/$LAWNMOWER_ID/schedule" \
  -H "Content-Type: application/json" \
  -d '{"maintenance_interval_days": 30}' | jq .
echo

# Log maintenance
echo -e "${YELLOW}[9] Log Maintenance${NC}"
MAINT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
curl -s -X POST "$API_URL/items/$LAWNMOWER_ID/maintenance" \
  -H "Content-Type: application/json" \
  -d "{\"performed_at\": \"$MAINT_DATE\", \"notes\": \"Changed oil, cleaned air filter, sharpened blade\"}" | jq .
echo

# Get maintenance history
echo -e "${YELLOW}[10] Get Maintenance History${NC}"
curl -s "$API_URL/items/$LAWNMOWER_ID/maintenance" | jq .
echo

# Check item (should have last_maintenance_at and next_maintenance_at set)
echo -e "${YELLOW}[11] Check Item After Maintenance${NC}"
curl -s "$API_URL/items/$LAWNMOWER_ID" | jq '{name, last_maintenance_at, next_maintenance_at, maintenance_interval_days}'
echo

# List items due for maintenance
echo -e "${YELLOW}[12] List Items Due for Maintenance${NC}"
curl -s "$API_URL/items/due" | jq .
echo

# ==================== COMMENTS ====================
echo -e "${BLUE}==================== COMMENTS ====================${NC}"
echo

# Add comment
echo -e "${YELLOW}[13] Add Comment${NC}"
COMMENT=$(curl -s -X POST "$API_URL/items/$LAWNMOWER_ID/comments" \
  -H "Content-Type: application/json" \
  -d '{"content": "Need to order replacement spark plug before next season"}')
echo "$COMMENT" | jq .
COMMENT_ID=$(echo "$COMMENT" | jq -r '.id')
echo

# Add another comment
echo -e "${YELLOW}[14] Add Another Comment${NC}"
curl -s -X POST "$API_URL/items/$LAWNMOWER_ID/comments" \
  -H "Content-Type: application/json" \
  -d '{"content": "Blade needs professional sharpening"}' | jq .
echo

# List comments
echo -e "${YELLOW}[15] List Comments${NC}"
curl -s "$API_URL/items/$LAWNMOWER_ID/comments" | jq .
echo

# Update comment
echo -e "${YELLOW}[16] Update Comment${NC}"
curl -s -X PUT "$API_URL/comments/$COMMENT_ID" \
  -H "Content-Type: application/json" \
  -d '{"content": "Ordered replacement spark plug from Amazon - arriving next week"}' | jq .
echo

# ==================== DOCUMENTS ====================
echo -e "${BLUE}==================== DOCUMENTS ====================${NC}"
echo

# Upload document (create a temp file)
echo -e "${YELLOW}[17] Upload Document${NC}"
echo "Honda HRX217 Lawnmower Manual - Maintenance Schedule" > /tmp/test_manual.txt
echo "- Change oil every 50 hours or annually" >> /tmp/test_manual.txt
echo "- Clean air filter every 25 hours" >> /tmp/test_manual.txt
echo "- Sharpen blade every season" >> /tmp/test_manual.txt

DOC=$(curl -s -X POST "$API_URL/items/$LAWNMOWER_ID/documents" \
  -F "file=@/tmp/test_manual.txt" \
  -F "document_type=manual")
echo "$DOC" | jq .
DOC_ID=$(echo "$DOC" | jq -r '.id')
echo -e "${GREEN}Uploaded document ID: $DOC_ID${NC}"
echo

# List documents
echo -e "${YELLOW}[18] List Documents${NC}"
curl -s "$API_URL/items/$LAWNMOWER_ID/documents" | jq .
echo

# Download document
echo -e "${YELLOW}[19] Download Document${NC}"
echo "Document contents:"
curl -s "$API_URL/documents/$DOC_ID/download"
echo
echo

# ==================== CLEANUP (Optional) ====================
echo -e "${BLUE}==================== FINAL STATE ====================${NC}"
echo

# Show all root items
echo -e "${YELLOW}[20] All Root Items${NC}"
curl -s "$API_URL/items" | jq .
echo

# Show the garage with all children
echo -e "${YELLOW}[21] Garage with Children${NC}"
curl -s "$API_URL/items/$GARAGE_ID" | jq .
echo

echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}API Test Complete!${NC}"
echo -e "${BLUE}======================================${NC}"
echo
echo "To clean up, delete the garage item (cascades to children):"
echo -e "${YELLOW}curl -X DELETE $API_URL/items/$GARAGE_ID${NC}"
echo
echo "Created resources:"
echo "  Garage ID:     $GARAGE_ID"
echo "  Lawnmower ID:  $LAWNMOWER_ID"
echo "  Snowblower ID: $SNOWBLOWER_ID"
echo "  Comment ID:    $COMMENT_ID"
echo "  Document ID:   $DOC_ID"
