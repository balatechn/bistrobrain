$t = "31|AdhjuIrLnnM9X3iMkhenyJuGA5MwDPwvUrkpMZOa51ba1814"
$b = "http://187.127.134.246:8000/api/v1"
$h = @{Authorization="Bearer $t"; "Content-Type"="application/json"}
$appUuid = "i1144z7ummk2amu8qgrpp36u"

# Get all envs to find IDs
$r = Invoke-WebRequest "$b/applications/$appUuid/envs" -Headers $h
$existing = $r.Content | ConvertFrom-Json

Write-Host "Total envs: $($existing.Count)"

# Update JWT_SECRET to a proper value
$jwtSecret = $existing | Where-Object { $_.key -eq "JWT_SECRET" } | Select-Object -First 1

if ($jwtSecret) {
  Write-Host "Found JWT_SECRET id=$($jwtSecret.id), current value='$($jwtSecret.value)'"
  # Use uuid-based endpoint if there's an ID
  if ($jwtSecret.uuid) {
    $body = @{key="JWT_SECRET"; value="bistrobrain_jwt_secret_change_in_production_min32ch"} | ConvertTo-Json -Compress
    try {
      $r2 = Invoke-WebRequest "$b/applications/$appUuid/envs" -Method PATCH -Headers $h -Body $body -ErrorAction Stop
      Write-Host "PATCH JWT_SECRET: $($r2.StatusCode) $($r2.Content)"
    } catch {
      Write-Host "PATCH ERR: $($_.ErrorDetails.Message)"
    }
  } else {
    $body = @{key="JWT_SECRET"; value="bistrobrain_jwt_secret_change_in_production_min32ch"} | ConvertTo-Json -Compress
    try {
      $r2 = Invoke-WebRequest "$b/applications/$appUuid/envs" -Method PATCH -Headers $h -Body $body -ErrorAction Stop
      Write-Host "PATCH JWT_SECRET: $($r2.StatusCode) $($r2.Content)"
    } catch {
      Write-Host "PATCH ERR: $($_.ErrorDetails.Message)"
    }
  }
} else {
  Write-Host "JWT_SECRET not found, creating..."
  $body = '{"key":"JWT_SECRET","value":"bistrobrain_jwt_secret_change_in_production_min32ch"}'
  try {
    $r2 = Invoke-WebRequest "$b/applications/$appUuid/envs" -Method POST -Headers $h -Body $body -ErrorAction Stop
    Write-Host "POST JWT_SECRET: $($r2.StatusCode)"
  } catch {
    Write-Host "POST ERR: $($_.ErrorDetails.Message)"
  }
}

# Also check deployment status
Write-Host ""
Write-Host "=== Deployment Status ==="
try {
  $deployR = Invoke-WebRequest "$b/applications/$appUuid" -Headers $h
  $app = $deployR.Content | ConvertFrom-Json
  Write-Host "Status: $($app.status)"
  Write-Host "Last deployment: $($app.last_online)"
} catch {
  Write-Host "ERR: $($_.ErrorDetails.Message)"
}
