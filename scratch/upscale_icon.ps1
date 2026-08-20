Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\Future\Documents\App\pos-app\assets\icon.png"
$destPath = "C:\Users\Future\Documents\App\pos-app\assets\icon_256.png"
$bmp = [System.Drawing.Bitmap]::FromFile($sourcePath)
$newBmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($newBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($bmp, 0, 0, 256, 256)
$newBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$newBmp.Dispose()
$bmp.Dispose()
Write-Host "Resized image to 256x256 at assets/icon_256.png"
