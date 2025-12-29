# scripts/run-tests.ps1
# PowerShell script para ejecutar tests en Windows

param(
    [string]$Command = "test"
)

Write-Host "🚀 TruckMatch API Testing Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

switch ($Command) {
    "setup" {
        Write-Host "🔧 Setting up test database with realistic data..." -ForegroundColor Yellow
        node scripts/setup-test-db.js
    }
    "test" {
        Write-Host "🧪 Running all tests..." -ForegroundColor Yellow
        npm test
    }
    "watch" {
        Write-Host "👀 Running tests in watch mode..." -ForegroundColor Yellow
        npm run test:watch
    }
    "coverage" {
        Write-Host "📊 Running tests with coverage report..." -ForegroundColor Yellow
        npm run test:coverage
        Write-Host "✅ Coverage report generated in ./coverage" -ForegroundColor Green
    }
    "clean" {
        Write-Host "🧹 Cleaning test database..." -ForegroundColor Yellow
        npm run seed:clean
    }
    "reset" {
        Write-Host "🔄 Resetting to demo data..." -ForegroundColor Yellow
        npm run seed:clean
        npm run seed:demo
    }
    "full" {
        Write-Host "🔧 Setting up test database with realistic data..." -ForegroundColor Yellow
        node scripts/setup-test-db.js
        Write-Host ""
        Write-Host "🧪 Running all tests..." -ForegroundColor Yellow
        npm test
        Write-Host ""
        Write-Host "📊 Generating coverage report..." -ForegroundColor Yellow
        npm run test:coverage
    }
    default {
        Write-Host "Usage: .\scripts\run-tests.ps1 [command]" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor Cyan
        Write-Host "  setup     - Setup test database with realistic data"
        Write-Host "  test      - Run all tests (default)"
        Write-Host "  watch     - Run tests in watch mode"
        Write-Host "  coverage  - Run tests with coverage report"
        Write-Host "  clean     - Clean all test data"
        Write-Host "  reset     - Reset to demo data"
        Write-Host "  full      - Complete setup, test, and coverage report"
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Cyan
        Write-Host "  .\scripts\run-tests.ps1 setup"
        Write-Host "  .\scripts\run-tests.ps1 test"
        Write-Host "  .\scripts\run-tests.ps1 coverage"
    }
}

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green
