Add-Type -AssemblyName System.Drawing
$source = "C:\Users\Future\Documents\App\pos-app\assets\icon.png"
$dest = "C:\Users\Future\Documents\App\pos-app\assets\icon.ico"

try {
    $image = [System.Drawing.Bitmap]::FromFile($source)
    $iconHandle = $image.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($iconHandle)
    $stream = [System.IO.File]::Create($dest)
    $icon.Save($stream)
    $stream.Close()
    $image.Dispose()
    Write-Host "Icon created successfully!"
} catch {
    Write-Host "Error: " $_.Exception.Message
}
