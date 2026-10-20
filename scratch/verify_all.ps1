# Bounded verification script with strict timeouts
$ErrorActionPreference = "Stop"
$sessionId = "c2c9c659-2d22-4460-bb54-4f2cddeac1fc"

Write-Host "=== 1. KIEM TRA HEALTH CHECK & DATABASE CONNECTIVITY ==="
$health = Invoke-RestMethod -Uri "http://localhost:5228/api/health" -Method Get -TimeoutSec 15
Write-Host "Status: $($health.status), Connected: $($health.databaseConnected)"
Write-Host "Counts: Animals=$($health.counts.animals), Languages=$($health.counts.languages), Narrations=$($health.counts.narrations), Audios=$($health.counts.audios), Translations=$($health.counts.contentTranslations)"

Write-Host "`n=== 2. KIEM TRA DANH SACH 12 NGON NGU ==="
$langs = Invoke-RestMethod -Uri "http://localhost:5228/api/languages" -Method Get -TimeoutSec 15
Write-Host "Total Active Languages: $($langs.data.Count)"
foreach ($l in $langs.data) {
    Write-Host " - [$($l.code)] $($l.name) / $($l.nativeName) | Flag: $($l.flagIcon) | TTS: $($l.ttsVoice)"
}

Write-Host "`n=== 3. KIEM TRA PHIEN THAM QUAN (TICKET SESSION) ==="
# Test ticket validation if needed, or use active session
Write-Host "Using Active Ticket Session: $sessionId"

Write-Host "`n=== 4. KIEM TRA THUYET MINH DA NGON NGU (ANIMAL 1 - SU TU SIMBA) ==="
$testLangs = @("vi", "en", "ko", "de", "fr")
foreach ($code in $testLangs) {
    $n = Invoke-RestMethod -Uri "http://localhost:5228/api/narrations/animal/1?lang=$code" -Method Get -Headers @{ "X-Session-Id" = $sessionId } -TimeoutSec 15
    Write-Host "[$code] ID: $($n.data.narrationId) | Title: $($n.data.title) | Audio: $($n.data.audioUrl) | Duration: $($n.data.durationSeconds)s"
}

Write-Host "`n=== 5. KIEM TRA STREAM AUDIO QUA ENDPOINT /api/narrations/{id}/stream ==="
# Test stream via WebClient / HttpClient to safely handle binary stream without hanging
# Test stream via Invoke-WebRequest with OutFile and strict timeout
$tempAudioPath = "scratch/test_streamed.mp3"
if (Test-Path $tempAudioPath) { Remove-Item $tempAudioPath -Force }

$streamUrl = "http://localhost:5228/api/narrations/1/stream?sessionId=$sessionId"
Write-Host "Requesting stream from: $streamUrl"
$resp = Invoke-WebRequest -Uri $streamUrl -Method Get -TimeoutSec 15 -UseBasicParsing -OutFile $tempAudioPath
$fileInfo = Get-Item $tempAudioPath
Write-Host "Streamed Audio File Size: $($fileInfo.Length) bytes ($([Math]::Round($fileInfo.Length / 1024, 2)) KB)"

$audioBytes = [System.IO.File]::ReadAllBytes($tempAudioPath)


# Verify MP3 Magic Header
$isMp3 = $false
if ($audioBytes.Length -ge 3) {
    # Check ID3 tag (0x49, 0x44, 0x33) or MPEG sync word (0xFF, 0xFB / 0xFA / 0xF3 / 0xF2)
    if ($audioBytes[0] -eq 0x49 -and $audioBytes[1] -eq 0x44 -and $audioBytes[2] -eq 0x33) {
        $isMp3 = $true
        Write-Host "Audio Header Check: VALID ID3v2 container detected."
    } elseif ($audioBytes[0] -eq 0xFF -and ($audioBytes[1] -band 0xE0) -eq 0xE0) {
        $isMp3 = $true
        Write-Host "Audio Header Check: VALID MPEG sync frame header detected (0x$("{0:X2}" -f $audioBytes[0]) 0x$("{0:X2}" -f $audioBytes[1]))."
    } else {
        Write-Host "Audio Header: First 4 bytes = 0x$("{0:X2}" -f $audioBytes[0]) 0x$("{0:X2}" -f $audioBytes[1]) 0x$("{0:X2}" -f $audioBytes[2]) 0x$("{0:X2}" -f $audioBytes[3])"
    }
}
Write-Host "Is Verified Valid Audio: $isMp3"

Write-Host "`n=== 6. KIEM TRA GHI HEALTH LOG VAO SUPABASE & DOC STATS ==="
$logBodyObj = @{
    animalId = 1
    healthStatus = "KhoeManh"
    notes = "Kiem tra dinh ky 2026: The trang tot, hoat dong tich cuc."
    recordedBy = "BS. Nguyen Van An"
    temperatureCelsius = 38.4
    weightKg = 192.5
}
$logJson = $logBodyObj | ConvertTo-Json -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($logJson)
$postReq = [System.Net.HttpWebRequest]::Create("http://localhost:5228/api/dashboard/health-logs")
$postReq.Method = "POST"
$postReq.ContentType = "application/json; charset=utf-8"
$postReq.Timeout = 15000
$postStream = $postReq.GetRequestStream()
$postStream.Write($bytes, 0, $bytes.Length)
$postStream.Close()
$postResp = $postReq.GetResponse()
Write-Host "POST /api/dashboard/health-logs Status: $([int]$postResp.StatusCode)"
$postResp.Close()

$stats = Invoke-RestMethod -Uri "http://localhost:5228/api/dashboard/stats" -Method Get -TimeoutSec 15
Write-Host "Dashboard Stats: Total Animals: $($stats.data.totalAnimals), Recent Logs: $($stats.data.recentHealthLogs.Count)"
$latestLog = $stats.data.recentHealthLogs | Select-Object -First 1
Write-Host "Latest Log in Supabase: Animal=$($latestLog.animalName), Vet=$($latestLog.recordedBy), Notes=$($latestLog.notes), Date=$($latestLog.recordedAt)"

Write-Host "`n=== 7. KIEM TRA ENCLOSURE 8 KHONG CO BAN DICH TIENG DUC (FALLBACK TESTING) ==="
$encGerman = Invoke-RestMethod -Uri "http://localhost:5228/api/enclosures/8?lang=de" -Method Get -TimeoutSec 15
Write-Host "Enclosure 8 (de): Name: $($encGerman.data.name), RequestedLang: $($encGerman.data.requestedLanguage), HasTranslation: $($encGerman.data.hasTranslation)"

Write-Host "`n=== TAT CA KIEM TRA HOAN TAT THANH CONG! ==="
