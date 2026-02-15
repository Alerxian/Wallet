#!/bin/bash

# 主题迁移脚本
# 批量更新组件以使用新的主题系统

echo "🎨 开始主题迁移..."

# 定义需要更新的目录
DIRS=(
  "src/components"
  "src/screens"
)

# 备份文件
backup_file() {
  local file=$1
  cp "$file" "$file.backup"
  echo "  ✓ 已备份: $file"
}

# 更新导入语句
update_imports() {
  local file=$1

  # 检查是否已经导入了 useTheme
  if grep -q "useTheme" "$file"; then
    echo "  ⊘ 跳过（已更新）: $file"
    return
  fi

  # 检查是否使用了 colors
  if ! grep -q "from '@/theme'" "$file" || ! grep -q "colors" "$file"; then
    echo "  ⊘ 跳过（不使用 colors）: $file"
    return
  fi

  echo "  → 更新: $file"

  # 备份文件
  backup_file "$file"

  # 替换导入语句
  # 从: import { colors, typography, spacing } from '@/theme';
  # 到: import { typography, spacing } from '@/theme';
  #     import { useTheme } from '@/theme/ThemeContext';

  sed -i '' 's/import { colors, typography, spacing } from/import { typography, spacing } from/g' "$file"
  sed -i '' "s/import { colors, typography, spacing } from '@\/theme';/import { typography, spacing } from '@\/theme';\nimport { useTheme } from '@\/theme\/ThemeContext';/g" "$file"

  # 如果只导入了 colors
  sed -i '' "s/import { colors } from '@\/theme';/import { useTheme } from '@\/theme\/ThemeContext';/g" "$file"

  # 添加 useTheme hook（在组件函数内部）
  # 这需要手动处理，因为位置可能不同

  echo "  ✓ 已更新导入语句"
}

# 遍历所有 TypeScript 文件
for dir in "${DIRS[@]}"; do
  echo ""
  echo "📁 处理目录: $dir"

  find "$dir" -name "*.tsx" -type f | while read -r file; do
    update_imports "$file"
  done
done

echo ""
echo "✅ 迁移完成！"
echo ""
echo "⚠️  注意事项："
echo "1. 请检查备份文件（.backup）"
echo "2. 需要手动在组件中添加: const { theme: colors } = useTheme();"
echo "3. 需要将 StyleSheet 中的固定颜色改为动态颜色"
echo "4. 测试所有更新的组件"
echo ""
echo "📝 详细说明请查看: THEME_IMPLEMENTATION.md"
