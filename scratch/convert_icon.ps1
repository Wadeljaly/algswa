Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Bitmap]::FromFile("C:\Users\Future\Documents\App\pos-app\assets\icon_256.png")
$iconHandle = $image.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = [System.IO.File]::Create("C:\Users\Future\Documents\App\pos-app\assets\icon.ico")
$icon.Save($stream)
$stream.Close()
$image.Dispose()
Write-Host "Icon created successfully at assets/icon.ico"
