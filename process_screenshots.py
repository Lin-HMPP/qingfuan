"""
青付安截图后处理脚本
- 缩放到 390×844
- 右下角叠加 10pt 灰色标题
- 输出到「处理后」文件夹
"""
import os
from PIL import Image, ImageDraw, ImageFont

SRC = r'F:\HuaweiMoveData\Users\HUAWEI\Desktop\青付安 功能截图包\1 现有页面'
DST = r'F:\HuaweiMoveData\Users\HUAWEI\Desktop\青付安 功能截图包\处理后'
TARGET_SIZE = (390, 844)

# 每张图的右下角标题
TITLES = {
    '01': '到期提醒与资产总览',
    '02': '双路径录入设计',
    '03': '多卡管理与状态区分',
    '04': '实时成本智能预览',
    '05': '场景化录入与智能匹配',
    '06': '买前多维度风险评估',
    '07': '从发现到行动的闭环',
    '08': '无限次充卡价值分析',
    '09': '到店打卡智能核销',
    '10': '维权证据归集闭环',
    '11': '用户中心数据总览',
    '12': '一键隐私锁定保护',
    '13': '10秒极简快速建卡',
}

os.makedirs(DST, exist_ok=True)

# 加载字体（优先用系统中文字体）
FONT_PATHS = [
    'C:/Windows/Fonts/msyh.ttc',       # 微软雅黑
    'C:/Windows/Fonts/simsun.ttc',     # 宋体
    'C:/Windows/Fonts/simhei.ttf',     # 黑体
]
font = None
for fp in FONT_PATHS:
    if os.path.exists(fp):
        try:
            font = ImageFont.truetype(fp, 22)  # 22px ≈ 10pt on retina
            print(f'使用字体: {fp}')
            break
        except:
            continue

if font is None:
    font = ImageFont.load_default()
    print('警告: 使用默认字体，中文可能显示为方框')

files = sorted([f for f in os.listdir(SRC) if f.endswith('.png') and f[:2].isdigit()])
print(f'找到 {len(files)} 张截图')

for f in files:
    num = f[:2]
    title = TITLES.get(num, '')
    if not title:
        print(f'  ⚠ {f} — 无标题映射，跳过')
        continue

    img = Image.open(os.path.join(SRC, f))
    ow, oh = img.size

    # 缩放宽到 390，高度按比例；长截图（高 > 900）保留完整高度
    scale = TARGET_SIZE[0] / ow
    new_h = round(oh * scale)
    if new_h <= 900:
        new_h = TARGET_SIZE[1]  # 标准屏幕，统一 844
    new_size = (TARGET_SIZE[0], new_h)
    print(f'  {f} {img.size} → {new_size}  + "{title}"')

    img = img.resize(new_size, Image.LANCZOS)

    # 右下角叠加文字
    draw = ImageDraw.Draw(img)
    text_w = draw.textlength(title, font=font) if hasattr(draw, 'textlength') else len(title) * 12
    x = new_size[0] - text_w - 16
    y = new_size[1] - 36

    # 阴影
    draw.text((x + 1, y + 1), title, fill=(0, 0, 0, 80), font=font)
    # 主体
    draw.text((x, y), title, fill=(153, 153, 153, 255), font=font)

    # 保存
    out = os.path.join(DST, f)
    img.save(out, 'PNG')
    print(f'    → 已保存 {out}')

print(f'\n✅ 全部完成！输出目录: {DST}')
