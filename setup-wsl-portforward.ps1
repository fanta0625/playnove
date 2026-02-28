# PlayNova WSL2 端口转发自动配置脚本
# 使用方法：右键选择"以管理员身份运行PowerShell"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PlayNova WSL2 端口转发配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取Windows宿主机IP
$windows_ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*vEthernet*" } | Select-Object -First 1).IPAddress

if (-not $windows_ip) {
    Write-Host "❌ 无法获取Windows IP地址" -ForegroundColor Red
    Write-Host "请手动配置端口转发" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✅ Windows宿主机IP: $windows_ip" -ForegroundColor Green
Write-Host ""

# 获取WSL IP
$wsl_ip_output = wsl hostname -I
$wsl_ip = $wsl_ip_output.Trim().Split(" ")[0]

if (-not $wsl_ip) {
    Write-Host "❌ 无法获取WSL IP地址，请确保WSL正在运行" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ WSL IP: $wsl_ip" -ForegroundColor Green
Write-Host ""

# 需要转发的端口
$ports = @(5173, 3000)

# 删除旧的转发规则
Write-Host "🗑️  清理旧的端口转发规则..." -ForegroundColor Yellow
foreach ($port in $ports) {
    $result = netsh interface portproxy delete v4tov4 listenport=$port listenaddress=$windows_ip 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ 已删除端口 $port 的旧规则" -ForegroundColor Gray
    }
}

Write-Host ""

# 添加新的转发规则
Write-Host "🔄 配置新的端口转发规则..." -ForegroundColor Yellow
foreach ($port in $ports) {
    $result = netsh interface portproxy add v4tov4 listenport=$port listenaddress=$windows_ip connectport=$port connectaddress=$wsl_ip
    
    if ($?) {
        Write-Host "  ✓ 端口 $port: ${windows_ip}:${port} -> ${wsl_ip}:${port}" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 端口 $port 配置失败" -ForegroundColor Red
        Write-Host "    错误信息: $result" -ForegroundColor Gray
    }
}

Write-Host ""

# 配置Windows防火墙
Write-Host "🔥 配置Windows防火墙..." -ForegroundColor Yellow
$firewall_ports = @(5173, 3000)

foreach ($port in $firewall_ports) {
    $rule_name = "PlayNova-Port-$port"
    
    # 删除旧规则
    netsh advfirewall firewall delete rule name=$rule_name 2>$null | Out-Null
    
    # 添加新规则
    $result = netsh advfirewall firewall add rule name=$rule_name dir=in action=allow protocol=TCP localport=$port profile=any
    
    if ($?) {
        Write-Host "  ✓ 防火墙规则已添加：端口 $port" -ForegroundColor Green
    }
}

Write-Host ""

# 显示所有转发规则
Write-Host "📋 当前端口转发规则：" -ForegroundColor Cyan
Write-Host ""
netsh interface portproxy show v4tov4

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 配置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 在手机浏览器中访问：" -ForegroundColor Yellow
Write-Host "   http://${windows_ip}:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示：" -ForegroundColor Yellow
Write-Host "   1. 每次重启Windows或WSL后需要重新运行此脚本" -ForegroundColor Gray
Write-Host "   2. 确保手机和电脑在同一WiFi网络" -ForegroundColor Gray
Write-Host "   3. 在WSL中启动：npm run dev" -ForegroundColor Gray
Write-Host ""

pause
