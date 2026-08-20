Add-Type -AssemblyName System.Drawing
$jpgPath = "C:\Users\Future\Documents\App\pos-app\assets\icon.jpg"
$pngPath = "C:\Users\Future\Documents\App\pos-app\assets\icon.png"
$img = [System.Drawing.Image]::FromFile($jpgPath)
$img.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "Converted JPG to PNG successfully."
