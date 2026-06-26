from pathlib import Path
import math
import textwrap

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parent
OUT = ROOT
W = H = 1080
FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"


def font(size, weight="regular"):
    return ImageFont.truetype(FONT_PATH, size=size)


F = {
    "brand": font(26),
    "eyebrow": font(26),
    "title": font(72),
    "title_sm": font(58),
    "subtitle": font(34),
    "body": font(30),
    "body_sm": font(26),
    "caption": font(22),
    "number": font(58),
    "step": font(31),
}

COL = {
    "ink": "#101422",
    "muted": "#5F6878",
    "paper": "#F6F4EE",
    "card": "#FFFFFF",
    "line": "#D9DEE8",
    "navy": "#111735",
    "blue": "#2855D9",
    "teal": "#0F8F8D",
    "coral": "#E15A4F",
    "green": "#2F8F5B",
    "gold": "#B78318",
    "lav": "#7274D8",
}


def rr(draw, box, r, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def text(draw, xy, s, f, fill=COL["ink"], anchor=None, spacing=8, align="left"):
    draw.multiline_text(xy, s, font=f, fill=fill, anchor=anchor, spacing=spacing, align=align)


def wrap(s, width):
    return "\n".join(textwrap.wrap(s, width=width, break_long_words=False, replace_whitespace=False))


def cover_crop(img, size):
    return ImageOps.fit(img, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def paste_rounded(base, img, box, radius=34, shadow=True, border=True):
    x1, y1, x2, y2 = box
    target = (x2 - x1, y2 - y1)
    im = cover_crop(img, target).convert("RGBA")
    if shadow:
        sh = Image.new("RGBA", target, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.rounded_rectangle((0, 0, target[0], target[1]), radius=radius, fill=(16, 20, 34, 70))
        sh = sh.filter(ImageFilter.GaussianBlur(24))
        base.alpha_composite(sh, (x1, y1 + 20))
    mask = Image.new("L", target, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, target[0], target[1]), radius=radius, fill=255)
    base.paste(im, (x1, y1), mask)
    if border:
        d = ImageDraw.Draw(base)
        d.rounded_rectangle(box, radius=radius, outline=(255, 255, 255, 180), width=2)


def grain(base, opacity=18):
    px = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(px)
    for i in range(0, W, 7):
        for j in range((i * 13) % 9, H, 11):
            d.point((i, j), fill=(255, 255, 255, opacity))
    base.alpha_composite(px)


def brand(draw, color=COL["ink"], inverse=False):
    c = "#FFFFFF" if inverse else color
    cx, cy = 78, 72
    for a in range(0, 360, 90):
        r = 18
        x = cx + math.cos(math.radians(a + 35)) * 7
        y = cy + math.sin(math.radians(a + 35)) * 7
        draw.arc((x - r, y - r, x + r, y + r), a, a + 250, fill=c, width=4)
    draw.text((116, 52), "Found.One", font=F["brand"], fill=c)


def icon(draw, kind, cx, cy, color, scale=1.0):
    w = int(4 * scale)
    if kind == "compass":
        draw.ellipse((cx - 25, cy - 25, cx + 25, cy + 25), outline=color, width=w)
        draw.polygon([(cx + 10, cy - 18), (cx + 1, cy + 7), (cx - 12, cy + 16), (cx - 3, cy - 7)], outline=color)
        draw.line((cx + 10, cy - 18, cx - 12, cy + 16), fill=color, width=w)
    elif kind == "check":
        draw.rounded_rectangle((cx - 25, cy - 25, cx + 25, cy + 25), radius=11, outline=color, width=w)
        draw.line((cx - 12, cy + 1, cx - 2, cy + 12, cx + 15, cy - 12), fill=color, width=w)
    elif kind == "pin":
        draw.ellipse((cx - 9, cy - 18, cx + 9, cy), outline=color, width=w)
        draw.line((cx - 17, cy - 4, cx, cy + 26, cx + 17, cy - 4), fill=color, width=w)
        draw.ellipse((cx - 4, cy - 13, cx + 4, cy - 5), fill=color)
    elif kind == "coin":
        draw.ellipse((cx - 26, cy - 20, cx + 26, cy + 20), outline=color, width=w)
        draw.line((cx - 8, cy - 12, cx - 8, cy + 12), fill=color, width=w)
        draw.arc((cx - 2, cy - 14, cx + 16, cy + 4), 90, 270, fill=color, width=w)
        draw.arc((cx - 2, cy - 4, cx + 16, cy + 14), 90, 270, fill=color, width=w)
    elif kind == "store":
        draw.rectangle((cx - 24, cy - 4, cx + 24, cy + 26), outline=color, width=w)
        draw.line((cx - 30, cy - 4, cx - 18, cy - 25, cx + 18, cy - 25, cx + 30, cy - 4), fill=color, width=w)
        draw.line((cx - 8, cy + 26, cx - 8, cy + 6, cx + 8, cy + 6, cx + 8, cy + 26), fill=color, width=w)
    elif kind == "spark":
        draw.line((cx, cy - 28, cx, cy + 28), fill=color, width=w)
        draw.line((cx - 28, cy, cx + 28, cy), fill=color, width=w)
        draw.line((cx - 18, cy - 18, cx + 18, cy + 18), fill=color, width=w)
        draw.line((cx - 18, cy + 18, cx + 18, cy - 18), fill=color, width=w)


def base(bg=COL["paper"]):
    im = Image.new("RGBA", (W, H), bg)
    grain(im, 10)
    return im


roadmap = Image.open(ROOT / "roadmap-desktop.png").convert("RGBA")


def card01():
    im = base(COL["navy"])
    d = ImageDraw.Draw(im)
    brand(d, inverse=True)
    bg = roadmap.filter(ImageFilter.GaussianBlur(3))
    bg = ImageEnhanceSafe.brightness(bg, 0.62)
    paste_rounded(im, bg, (610, 160, 1040, 835), radius=38, shadow=True)
    rr(d, (62, 190, 548, 260), 35, "#253056")
    text(d, (95, 210), "창업 로드맵 카드뉴스", F["eyebrow"], "#C8D2FF")
    text(d, (72, 318), "시작부터\n운영까지,\n한 흐름으로.", F["title"], "#FFFFFF", spacing=12)
    text(d, (78, 680), "Found.One의 21단계 로드맵을\n한눈에 읽히는 여정으로 정리했습니다.", F["subtitle"], "#D7DCEF", spacing=10)
    rr(d, (76, 884, 372, 944), 30, "#FFFFFF")
    text(d, (224, 898), "로드맵 보기", F["body_sm"], COL["navy"], anchor="ma")
    return im


def card02():
    im = base("#F8FAFC")
    d = ImageDraw.Draw(im)
    brand(d)
    text(d, (72, 150), "21단계가 복잡해 보일 때", F["eyebrow"], COL["blue"])
    text(d, (72, 202), "Found.One은\n지금 해야 할\n한 단계만 남깁니다.", F["title_sm"], COL["ink"], spacing=8)
    paste_rounded(im, roadmap.crop((180, 70, 980, 690)), (92, 545, 988, 892), radius=34, shadow=True)
    rr(d, (92, 920, 988, 996), 26, "#EAF0FF", outline="#C9D6FF")
    text(d, (126, 940), "현재 계정: 스타터 플로우 100% · 21 / 21 완료", F["body_sm"], COL["blue"])
    return im


def timeline_card(title, subtitle, items, color, idx):
    im = base("#FFFFFF")
    d = ImageDraw.Draw(im)
    brand(d)
    text(d, (72, 146), f"ROADMAP {idx}", F["eyebrow"], color)
    text(d, (72, 196), title, F["title_sm"], COL["ink"], spacing=8)
    text(d, (74, 346), subtitle, F["body"], COL["muted"], spacing=8)
    y = 450
    for n, label, body, kind in items:
        rr(d, (72, y, 1008, y + 104), 26, "#F7F8FB", outline="#E5E9F2")
        rr(d, (104, y + 25, 158, y + 79), 16, color)
        text(d, (131, y + 34), str(n), F["body_sm"], "#FFFFFF", anchor="ma")
        icon(d, kind, 204, y + 52, color, 0.76)
        text(d, (258, y + 22), label, F["body"], COL["ink"])
        text(d, (258, y + 61), body, F["caption"], COL["muted"])
        y += 118
    return im


def card03():
    return timeline_card(
        "처음 5단계는\n방향을 정하는 시간",
        "업종, 형태, 고객, 예산을 먼저 고정해야 다음 판단이 흔들리지 않습니다.",
        [
            (1, "업종 선택", "하고 싶은 일보다 운영 가능한 업종을 먼저 정의", "compass"),
            (2, "창업 형태 선택", "개인 창업, 프랜차이즈, 온라인 등 출발 방식 결정", "check"),
            (3, "운영 방식 선택", "매장형, 배달형, 예약형 등 일하는 구조 설계", "store"),
            (4, "타깃 고객 정의", "누구의 문제를 해결할지 한 문장으로 압축", "pin"),
            (5, "예산 설정", "초기 자금과 버틸 수 있는 기간을 숫자로 확인", "coin"),
        ],
        COL["teal"],
        "01",
    )


def card04():
    return timeline_card(
        "6-13단계는\n위험을 줄이는 구간",
        "상권, 계약, 인허가, 세무, 자금까지 열기 전 반드시 확인해야 할 것들입니다.",
        [
            (6, "인허가 사전 확인", "영업 가능 조건과 필요한 서류를 먼저 점검", "check"),
            (7, "상권 후보 비교", "유동인구, 경쟁 밀도, 임대료를 함께 비교", "pin"),
            (8, "계약 전 검토", "권리금, 해지, 원상복구 조항을 확인", "spark"),
            (10, "사업자 등록 및 신고", "사업자등록, 영업신고, 위생교육 흐름 정리", "store"),
            (13, "대출 가이드", "정책자금과 운영자금 선택지를 비교", "coin"),
        ],
        COL["coral"],
        "02",
    )


def card05():
    return timeline_card(
        "14-21단계는\n오픈을 실행하는 구간",
        "메뉴, 공급처, 직원, 마케팅, 소프트 오픈을 지나 실제 운영으로 연결됩니다.",
        [
            (14, "메뉴·서비스 확정", "팔 상품과 가격, 객단가 전략을 정리", "check"),
            (15, "공급처 및 장비 확정", "재료, 장비, 발주 흐름을 운영 가능하게 연결", "store"),
            (16, "직원 채용", "근로계약, 급여, 4대보험까지 미리 준비", "spark"),
            (18, "운영 및 마케팅 준비", "네이버 플레이스, SNS, 리뷰 대응 루틴 세팅", "pin"),
            (21, "개업 최종 준비", "소프트 오픈 후 체크리스트를 운영 모드로 전환", "compass"),
        ],
        COL["gold"],
        "03",
    )


def card06():
    im = base("#F5F7FB")
    d = ImageDraw.Draw(im)
    brand(d)
    rr(d, (72, 142, 1008, 884), 42, "#FFFFFF", outline="#E3E8F2")
    paste_rounded(im, roadmap.crop((210, 112, 1020, 680)), (122, 196, 958, 556), radius=30, shadow=False)
    text(d, (122, 622), "창업은 한 번에 끝내는 일이 아니라\n매일 한 칸씩 진행하는 일입니다.", F["title_sm"], COL["ink"], spacing=8)
    text(d, (124, 790), "Found.One 로드맵은 준비, 검증, 실행, 운영을\n하나의 흐름으로 이어줍니다.", F["body"], COL["muted"], spacing=8)
    rr(d, (72, 918, 1008, 996), 28, COL["navy"])
    text(d, (540, 938), "Found.One · 창업 로드맵 멘토링", F["body_sm"], "#FFFFFF", anchor="ma")
    return im


class ImageEnhanceSafe:
    @staticmethod
    def brightness(img, factor):
        from PIL import ImageEnhance
        return ImageEnhance.Brightness(img).enhance(factor)


def save_all():
    cards = [card01(), card02(), card03(), card04(), card05(), card06()]
    for i, im in enumerate(cards, 1):
        im.convert("RGB").save(OUT / f"card-{i:02d}.png", quality=96)
    grid = Image.new("RGB", (3 * 540, 2 * 540), "#ECEFF5")
    for i, im in enumerate(cards):
        thumb = im.convert("RGB").resize((520, 520), Image.Resampling.LANCZOS)
        x = (i % 3) * 540 + 10
        y = (i // 3) * 540 + 10
        grid.paste(thumb, (x, y))
    grid.save(OUT / "preview-grid.png", quality=95)


if __name__ == "__main__":
    save_all()
