Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param (
        [string]$SourcePath,
        [string]$TargetPath,
        [int]$Width,
        [int]$Height
    )
    try {
        $srcImage = [System.Drawing.Image]::FromFile($SourcePath)
        $destImage = New-Object System.Drawing.Bitmap($Width, $Height)
        $graphics = [System.Drawing.Graphics]::FromImage($destImage)
        
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        $graphics.DrawImage($srcImage, 0, 0, $Width, $Height)
        
        # Ensure directory exists
        $dir = Split-Path $TargetPath -Parent
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        
        # Save image
        $destImage.Save($TargetPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        $graphics.Dispose()
        $destImage.Dispose()
        $srcImage.Dispose()
        Write-Host "Generated: $TargetPath"
    } catch {
        Write-Error "Failed to resize $SourcePath to $TargetPath : $_"
    }
}

$source = "p:\BrideandGroom\assets\images\ShortLogo.png"
$resDir = "p:\BrideandGroom\android\app\src\main\res"

# 1. Launcher Icons (Square & Round)
$launcherSizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $launcherSizes.Keys) {
    $size = $launcherSizes[$folder]
    $folderPath = Join-Path $resDir $folder
    
    $squareTarget = Join-Path $folderPath "ic_launcher.png"
    $roundTarget = Join-Path $folderPath "ic_launcher_round.png"
    
    Resize-Image -SourcePath $source -TargetPath $squareTarget -Width $size -Height $size
    Resize-Image -SourcePath $source -TargetPath $roundTarget -Width $size -Height $size
}

# 2. Notification Icons
$notificationSizes = @{
    "drawable"          = 96
    "drawable-mdpi"     = 24
    "drawable-hdpi"     = 36
    "drawable-xhdpi"    = 48
    "drawable-xxhdpi"   = 72
    "drawable-xxxhdpi"  = 96
}

foreach ($folder in $notificationSizes.Keys) {
    $size = $notificationSizes[$folder]
    $folderPath = Join-Path $resDir $folder
    $target = Join-Path $folderPath "ic_notification.png"
    
    Resize-Image -SourcePath $source -TargetPath $target -Width $size -Height $size
}

# 3. iOS Launcher Icons
$iosAppIconDir = "p:\BrideandGroom\ios\BrideandGroom\Images.xcassets\AppIcon.appiconset"
$iosIcons = @(
    @{ filename = "AppIcon-20x20@2x.png"; width = 40; height = 40 }
    @{ filename = "AppIcon-20x20@3x.png"; width = 60; height = 60 }
    @{ filename = "AppIcon-29x29@2x.png"; width = 58; height = 58 }
    @{ filename = "AppIcon-29x29@3x.png"; width = 87; height = 87 }
    @{ filename = "AppIcon-40x40@2x.png"; width = 80; height = 80 }
    @{ filename = "AppIcon-40x40@3x.png"; width = 120; height = 120 }
    @{ filename = "AppIcon-60x60@2x.png"; width = 120; height = 120 }
    @{ filename = "AppIcon-60x60@3x.png"; width = 180; height = 180 }
    @{ filename = "AppIcon-1024x1024@1x.png"; width = 1024; height = 1024 }
)

foreach ($icon in $iosIcons) {
    $targetPath = Join-Path $iosAppIconDir $icon.filename
    Resize-Image -SourcePath $source -TargetPath $targetPath -Width $icon.width -Height $icon.height
}

Write-Host "Icon generation completed successfully!"
