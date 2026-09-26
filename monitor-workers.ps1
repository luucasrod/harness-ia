# Monitor background workers and update RUN_REPORT

$tempDir = "C:\Users\syann\AppData\Local\Temp\claude\A--Projetos-Lucas-Curso-Engenharia-Harness-IA\7f00022c-eb6e-4985-abd4-b76140cd7417\tasks"

$opencode_log = "$tempDir\brpqnrhbg.output"
$codex_log = "$tempDir\boz3m1se1.output"

function Check-Task($name, $logfile) {
    if (Test-Path $logfile) {
        $content = Get-Content $logfile -Raw
        $lines = $content.Split("`n").Count

        # Check for completion patterns
        $completed = $content -match "^.*git push.*feature.*success|^.*Successfully.*|^.*completed successfully"
        $failed = $content -match "error|failed|Error|Failed"

        return @{
            Name = $name
            LogExists = $true
            LineCount = $lines
            HasErrors = $failed -and $true -or $false
            IsCompleted = $completed -and $true -or $false
        }
    } else {
        return @{
            Name = $name
            LogExists = $false
        }
    }
}

Write-Output "=== WORKER STATUS CHECK ==="
Write-Output "Time: $(Get-Date -Format 'HH:mm:ss')"
Write-Output ""

$opencode = Check-Task "P0-001 (OpenCode)" $opencode_log
$codex = Check-Task "P0-009 (Codex)" $codex_log

Write-Output "P0-001 (OpenCode - Setup):"
Write-Output "  Exists: $($opencode.LogExists)"
Write-Output "  Lines: $($opencode.LineCount)"
Write-Output "  Status: $(if ($opencode.IsCompleted) { 'DONE' } elseif ($opencode.HasErrors) { 'ERROR' } else { 'RUNNING' })"
Write-Output ""

Write-Output "P0-009 (Codex - Content):"
Write-Output "  Exists: $($codex.LogExists)"
Write-Output "  Lines: $($codex.LineCount)"
Write-Output "  Status: $(if ($codex.IsCompleted) { 'DONE' } elseif ($codex.HasErrors) { 'ERROR' } else { 'RUNNING' })"
Write-Output ""

Write-Output "=== RECENT OUTPUT ==="
if (Test-Path $opencode_log) {
    Write-Output "OpenCode (last 10 lines):"
    Get-Content $opencode_log | Select-Object -Last 10
}

Write-Output ""
