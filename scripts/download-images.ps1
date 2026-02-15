# Download external images to local directory

$imageDir = "public\images"

$images = @{
    "hero-bg" = "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cyberpunk%20city%20night%20rain%20neon&image_size=landscape_16_9"
    "neon-genesis" = "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=futuristic%20city%20generator%20interface%20cyberpunk&image_size=landscape_16_9"
    "cyber-deck" = "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cyberpunk%20hacking%20station%20interface&image_size=landscape_16_9"
    "neural-link" = "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=brain%20computer%20interface%20dashboard%20cyberpunk&image_size=landscape_16_9"
}

Write-Host "Downloading images to local directory..."

foreach ($key in $images.Keys) {
    $url = $images[$key]
    $filename = "$imageDir\$key.jpg"
    
    Write-Host "Downloading $key..."
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $filename -UseBasicParsing
        Write-Host "  Downloaded: $filename" -ForegroundColor Green
    }
    catch {
        Write-Host "  Failed to download: $url" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Download complete! Images saved to: $imageDir" -ForegroundColor Cyan
