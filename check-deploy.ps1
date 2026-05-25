$t = "31|AdhjuIrLnnM9X3iMkhenyJuGA5MwDPwvUrkpMZOa51ba1814"
$b = "http://187.127.134.246:8000/api/v1"
$h = @{Authorization="Bearer $t"; "Content-Type"="application/json"}
$appUuid = "i1144z7ummk2amu8qgrpp36u"

# Get deployments for this application
Write-Host "=== Deployments ==="
try {
  $r = Invoke-WebRequest "$b/applications/$appUuid/deployments" -Headers $h
  $deployments = $r.Content | ConvertFrom-Json
  Write-Host "Count: $($deployments.Count)"
  $deployments | Select-Object -First 3 | Format-Table id, commit, status, created_at -AutoSize
  
  if ($deployments.Count -gt 0) {
    $latest = $deployments[0]
    Write-Host "Latest deployment ID: $($latest.id), UUID: $($latest.uuid), Status: $($latest.status)"
    
    # Get deployment logs
    Write-Host ""
    Write-Host "=== Latest Deployment Logs ==="
    try {
      $logR = Invoke-WebRequest "$b/deployments/$($latest.uuid)" -Headers $h
      $log = $logR.Content | ConvertFrom-Json
      Write-Host "Log type: $($log.GetType().Name)"
      if ($log -is [System.Array]) {
        $log | Select-Object -Last 30 | ForEach-Object { Write-Host $_ }
      } else {
        Write-Host ($log | ConvertTo-Json -Depth 3 | Select-Object -First 100)
      }
    } catch {
      Write-Host "Log ERR: $($_.ErrorDetails.Message)"
    }
  }
} catch {
  Write-Host "ERR: $($_.ErrorDetails.Message)"
}
