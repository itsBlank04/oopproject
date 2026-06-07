param([string]$BaseUrl = "http://localhost:8080")
$ErrorActionPreference = "Stop"

Write-Host "=== Testing Upgrade Flow ===" -ForegroundColor Cyan
Write-Host ""

# 1. Register a test user
Write-Host "1. Registering test user..." -ForegroundColor Yellow
$body = @{ email = "testupgrade2@test.com"; password = "12345678"; displayName = "Test Upgrade" } | ConvertTo-Json
try {
    $reg = Invoke-RestMethod -Uri "$BaseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $body
    Write-Host "   Registered: $($reg.displayName) (id=$($reg.id))" -ForegroundColor Green
} catch {
    # User might already exist, try login
    Write-Host "   Registration failed (may already exist), trying login..." -ForegroundColor Yellow
}

# 2. Login
Write-Host "2. Logging in..." -ForegroundColor Yellow
$loginBody = @{ email = "testupgrade2@test.com"; password = "12345678" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -SessionVariable session
Write-Host "   Logged in as: $($login.displayName)" -ForegroundColor Green
Write-Host "   Current roles: $($login.roles -join ', ')" -ForegroundColor Green

# 3. Create upgrade
Write-Host "3. Creating VENDOR upgrade..." -ForegroundColor Yellow
$upgradeBody = @{ role = "VENDOR" } | ConvertTo-Json
$upgrade = Invoke-RestMethod -Uri "$BaseUrl/api/upgrades" -Method Post -ContentType "application/json" -Body $upgradeBody -WebSession $session
Write-Host "   Upgrade created: id=$($upgrade.id), status=$($upgrade.status)" -ForegroundColor Green

# 4. Pay for upgrade
Write-Host "4. Paying for upgrade..." -ForegroundColor Yellow
$payBody = @{ method = "BKASH"; providerRef = "TEST-$(Get-Random)"; success = $true } | ConvertTo-Json
$pay = Invoke-RestMethod -Uri "$BaseUrl/api/upgrades/$($upgrade.id)/pay" -Method Post -ContentType "application/json" -Body $payBody -WebSession $session
Write-Host "   Upgrade status after payment: $($pay.upgrade.status)" -ForegroundColor Green
Write-Host "   User roles after payment: $($pay.user.roles -join ', ')" -ForegroundColor Green

# 5. Check result
if ($pay.user.roles -contains "VENDOR") {
    Write-Host ""
    Write-Host "=== SUCCESS: VENDOR role granted! ===" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== FAILURE: VENDOR role NOT granted! ===" -ForegroundColor Red
}

# 6. Verify via GET /me
Write-Host ""
Write-Host "5. Verifying via GET /api/auth/me..." -ForegroundColor Yellow
$me = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method Get -WebSession $session
Write-Host "   User roles: $($me.roles -join ', ')" -ForegroundColor Green
if ($me.roles -contains "VENDOR") {
    Write-Host "   VERIFIED: VENDOR role confirmed!" -ForegroundColor Green
} else {
    Write-Host "   VERIFIED: VENDOR role NOT found!" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
