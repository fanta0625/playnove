#!/bin/bash
# 检查功能是否已存在
echo "🔍 搜索 '$1' 相关代码..."
grep -r "$1" backend/src --include='*.ts' -l 2>/dev/null || echo "✅ 未找到相关代码，可以创建"
