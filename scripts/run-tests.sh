#!/bin/bash
# scripts/run-tests.sh
# Script para ejecutar tests con diferentes opciones

set -e

echo "🚀 TruckMatch API Testing Script"
echo "=================================="

# Parse arguments
COMMAND="${1:-test}"

case $COMMAND in
  "setup")
    echo "🔧 Setting up test database..."
    node scripts/setup-test-db.js
    ;;
  "test")
    echo "🧪 Running all tests..."
    npm test
    ;;
  "watch")
    echo "👀 Running tests in watch mode..."
    npm run test:watch
    ;;
  "coverage")
    echo "📊 Running tests with coverage..."
    npm run test:coverage
    echo "✅ Coverage report generated in ./coverage"
    ;;
  "clean")
    echo "🧹 Cleaning test database..."
    npm run seed:clean
    ;;
  "reset")
    echo "🔄 Resetting test database..."
    npm run seed:clean
    npm run seed:demo
    ;;
  "full")
    echo "🔧 Setting up test database with realistic data..."
    node scripts/setup-test-db.js
    echo ""
    echo "🧪 Running all tests..."
    npm test
    echo ""
    echo "📊 Generating coverage report..."
    npm run test:coverage
    ;;
  *)
    echo "Usage: npm run tests [command]"
    echo ""
    echo "Commands:"
    echo "  setup     - Setup test database with realistic data"
    echo "  test      - Run all tests (default)"
    echo "  watch     - Run tests in watch mode"
    echo "  coverage  - Run tests with coverage report"
    echo "  clean     - Clean all test data"
    echo "  reset     - Reset to demo data"
    echo "  full      - Complete setup, test, and coverage report"
    ;;
esac

echo ""
echo "✅ Done!"
