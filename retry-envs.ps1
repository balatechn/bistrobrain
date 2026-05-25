$t = "31|AdhjuIrLnnM9X3iMkhenyJuGA5MwDPwvUrkpMZOa51ba1814"
$b = "http://187.127.134.246:8000/api/v1"
$h = @{Authorization="Bearer $t"; "Content-Type"="application/json"}
$appUuid = "i1144z7ummk2amu8qgrpp36u"

# Get existing env vars to find IDs for update
$r = Invoke-WebRequest "$b/applications/$appUuid/envs" -Headers $h
$existing = $r.Content | ConvertFrom-Json
Write-Host "Existing envs:"
$existing | Format-Table id, key, value -AutoSize

# Try PATCH for the ones that failed
$toFix = @(
  @{key="NODE_ENV"; value="production"},
  @{key="JWT_REFRESH_SECRET"; value="bistrobrain_jwt_refresh_secret_change_prod_min32"},
  @{key="POSTGRES_PASSWORD"; value="bistrobrain_secure_pass"}
)

foreach ($env in $toFix) {
  $found = $existing | Where-Object { $_.key -eq $env.key }
  if ($found) {
    # Update existing
    $body = @{key=$env.key; value=$env.value} | ConvertTo-Json -Compress
    try {
      $r2 = Invoke-WebRequest "$b/applications/$appUuid/envs" -Method PATCH -Headers $h -Body $body -ErrorAction Stop
      Write-Host "PATCH OK $($env.key): $($r2.StatusCode)"
    } catch {
      Write-Host "PATCH ERR $($env.key): $($_.ErrorDetails.Message)"
    }
  } else {
    # Create new
    $body = @{key=$env.key; value=$env.value} | ConvertTo-Json -Compress
    try {
      $r2 = Invoke-WebRequest "$b/applications/$appUuid/envs" -Method POST -Headers $h -Body $body -ErrorAction Stop
      Write-Host "POST OK $($env.key): $($r2.StatusCode)"
    } catch {
      Write-Host "POST ERR $($env.key): $($_.ErrorDetails.Message)"
    }
  }
}
