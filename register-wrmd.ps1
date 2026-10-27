# WRMD Windows 文件关联注册脚本（当前用户 HKCU，无需管理员权限）
param (
    [string]$exePath = "D:\wrmd\src-tauri\target\release\wrmd.exe"
)

if (-not (Test-Path $exePath)) {
    Write-Warning "未找到可执行文件: $exePath，请先完成编译构建。"
}

$shellKey = "HKCU:\Software\Classes\SystemFileAssociations\.md\shell\WRMD"
$cmdKey = "$shellKey\command"

New-Item -Path $shellKey -Force | Out-Null
Set-ItemProperty -Path $shellKey -Name "(Default)" -Value "用 WRMD 打开"
Set-ItemProperty -Path $shellKey -Name "Icon" -Value "$exePath,0"

New-Item -Path $cmdKey -Force | Out-Null
Set-ItemProperty -Path $cmdKey -Name "(Default)" -Value "`"$exePath`" `"%1`""

Write-Output "✅ 成功在 Windows 右键菜单中注册 '用 WRMD 打开'！"
