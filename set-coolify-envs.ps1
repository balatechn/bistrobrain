$t = "31|AdhjuIrLnnM9X3iMkhenyJuGA5MwDPwvUrkpMZOa51ba1814"
$b = "http://187.127.134.246:8000/api/v1"
$h = @{Authorization="Bearer $t"; "Content-Type"="application/json"}
$appUuid = "i1144z7ummk2amu8qgrpp36u"

$envs = @(
  @{key="NODE_ENV"; value="production"},
  @{key="APP_NAME"; value="Bistro Brain"},
  @{key="DATABASE_URL"; value="postgresql://bistrobrain:bistrobrain_secure_pass@postgres:5432/bistrobrain"},
  @{key="REDIS_URL"; value="redis://redis:6379"},
  @{key="JWT_ACCESS_SECRET"; value="bistrobrain_jwt_access_secret_change_in_production_min32chars"},
  @{key="JWT_REFRESH_SECRET"; value="bistrobrain_jwt_refresh_secret_change_in_production_min32ch"},
  @{key="JWT_ACCESS_EXPIRES"; value="15m"},
  @{key="JWT_REFRESH_EXPIRES"; value="7d"},
  @{key="POSTGRES_USER"; value="bistrobrain"},
  @{key="POSTGRES_PASSWORD"; value="bistrobrain_secure_pass"},
  @{key="POSTGRES_DB"; value="bistrobrain"},
  @{key="AUTH_SERVICE_PORT"; value="4001"},
  @{key="POS_SERVICE_PORT"; value="4002"},
  @{key="INVENTORY_SERVICE_PORT"; value="4003"},
  @{key="FINANCE_SERVICE_PORT"; value="4004"},
  @{key="CRM_SERVICE_PORT"; value="4005"},
  @{key="PURCHASE_SERVICE_PORT"; value="4006"},
  @{key="KITCHEN_SERVICE_PORT"; value="4007"},
  @{key="HR_SERVICE_PORT"; value="4008"},
  @{key="REPORTING_SERVICE_PORT"; value="4009"},
  @{key="NOTIFICATION_SERVICE_PORT"; value="4010"},
  @{key="MINIO_ROOT_USER"; value="bistrobrain"},
  @{key="MINIO_ROOT_PASSWORD"; value="bistrobrain_minio_secure_pass"},
  @{key="MINIO_ENDPOINT"; value="http://minio:9000"},
  @{key="MINIO_BUCKET"; value="bistrobrain"}
)

foreach ($env in $envs) {
  $body = $env | ConvertTo-Json -Compress
  $r = $null
  $err = ""
  try {
    $r = Invoke-WebRequest "$b/applications/$appUuid/envs" -Method POST -Headers $h -Body $body -ErrorAction Stop
    Write-Host "OK $($env.key): $($r.StatusCode)"
  } catch {
    $err = $_.ErrorDetails.Message
    Write-Host "ERR $($env.key): $err"
  }
}

Write-Host "Done setting env vars. Triggering deployment..."
$r2 = $null
$err2 = ""
try {
  $r2 = Invoke-WebRequest "$b/applications/$appUuid/start" -Method GET -Headers $h -ErrorAction Stop
  Write-Host "Deploy started: $($r2.StatusCode)"
} catch {
  $err2 = $_.ErrorDetails.Message
  Write-Host "Deploy ERR: $err2"
}
