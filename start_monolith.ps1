$ports = @(8080, 5000, 4200)

Write-Host "Killing processes on ports: $($ports -join ', ')"
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $processIds = $connections.OwningProcess | Select-Object -Unique
        foreach ($pid_ in $processIds) {
            Write-Host "Killing PID $pid_ on port $port"
            Stop-Process -Id $pid_ -Force -ErrorAction SilentlyContinue
        }
    }
}

$workDir = "c:\Users\DELL\Desktop\projet pi final\pi-deploy"

Write-Host "Starting Backend..."
Start-Process "powershell.exe" -ArgumentList "-NoExit -Command `"cd backend; .\mvnw.cmd spring-boot:run`"" -WorkingDirectory $workDir

Write-Host "Starting Flask API..."
Start-Process "powershell.exe" -ArgumentList "-NoExit -Command `"cd flask_api; python app.py`"" -WorkingDirectory $workDir

Write-Host "Starting Angular Frontend..."
Start-Process "powershell.exe" -ArgumentList "-NoExit -Command `"cd frontend; npm start`"" -WorkingDirectory $workDir

Write-Host "All services have been launched in new terminal windows."
