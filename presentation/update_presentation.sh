#!/bin/bash

# This script updates the presentation to focus on methodology rather than findings

FILE="presentation.tex"

# Backup
cp "$FILE" "${FILE}.backup"

# Replace the Key Findings section title
sed -i '' 's/\\section{Key Findings}/\\section{Analysis Approach}/' "$FILE"

echo "Presentation updated successfully!"
echo "Backup saved as ${FILE}.backup"
