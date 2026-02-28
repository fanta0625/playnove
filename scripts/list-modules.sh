#!/bin/bash
# 列出所有模块
echo "📁 后端模块："
find backend/src/modules -maxdepth 1 -type d | tail -n +2 | xargs basename -a
echo ""
echo "📁 前端页面："
ls -1 frontend/src/pages/*.tsx 2>/dev/null | xargs basename -a .tsx | sed 's/^/- /'
