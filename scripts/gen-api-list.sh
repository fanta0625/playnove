#!/bin/bash
# 生成 API 列表
echo "# API 列表"
echo ""
grep -rh '@Get\|@Post\|@Put\|@Delete\|@Patch' backend/src --include='*.ts' | \
  sed 's/.*@//' | sort | uniq | \
  awk '{print "- " $0}'
