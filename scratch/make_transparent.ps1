Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\Future\Documents\App\pos-app\assets\icon.png"
$destPath = "C:\Users\Future\Documents\App\pos-app\assets\icon_transparent.png"
$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)
$newBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)

for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        # If the pixel is very close to white, make it transparent
        if ($pixel.R -gt 240 -and $pixel.G -gt 240 -and $pixel.B -gt 240) {
            $newBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $newBmp.SetPixel($x, $y, $pixel)
        }
    }
}

$newBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$newBmp.Dispose()
Write-Host "Created transparent icon at assets/icon_transparent.png"
