import os
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image, ImageDraw, ImageFont
import urllib.parse
import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_KEY")  # set this in your env

def _check_key():
    if not GOOGLE_API_KEY:
        raise RuntimeError("Set the GOOGLE_MAPS_KEY environment variable.")

def static_map_url(lat: float,
                   lng: float,
                   zoom: int = 18,
                   size: str = "600x400",
                   maptype: str = "satellite") -> str:
    """
    Return a URL for a static overhead image (PNG) of the location.
    """
    _check_key()
    params = {
        "center": f"{lat},{lng}",
        "zoom": zoom,
        "size": size,
        "maptype": maptype,
        "key": GOOGLE_API_KEY
    }
    return "https://maps.googleapis.com/maps/api/staticmap?" + urllib.parse.urlencode(params)

def street_view_url(lat: float,
                    lng: float,
                    size: str = "600x400",
                    heading: int = 0,
                    pitch: int = 0,
                    fov: int = 80) -> str:
    """
    Return a URL for a static Street View image (JPG) at the location.
    """
    _check_key()
    params = {
        "size": size,
        "location": f"{lat},{lng}",
        "heading": heading,
        "pitch": pitch,
        "fov": fov,
        "key": GOOGLE_API_KEY
    }
    return "https://maps.googleapis.com/maps/api/streetview?" + urllib.parse.urlencode(params)


def download_image(url: str, out_path: str, timeout: int = 10) -> None:
    """
    Fetch `url` and save the image to `out_path`.
    """
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    with open(out_path, "wb") as f:
        f.write(resp.content)


def annotate_point(
    src: Path,
    xy: Tuple[float, float],
    dst: Path,
    *,
    radius: int = 6,
    color: Tuple[int, int, int] = (255, 0, 0),
    label: Optional[str] = "1",
) -> None:
    """
    Draw a filled circle (and optional label) at (x, y) and save as PNG.

    Parameters
    ----------
    src   : Path            input image
    xy    : (x, y) tuple    pixel coordinates
    dst   : Path            output file
    radius: int             circle radius (default 6 px)
    color : (r, g, b)       circle / label colour (default bright red)
    label : str | None      text to show next to point, or None to skip
    """
    base = Image.open(src).convert("RGBA")
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    font = ImageFont.load_default()

    x, y = map(int, xy)

    # circle
    draw.ellipse(
        [(x - radius, y - radius), (x + radius, y + radius)],
        fill=color + (255,),
    )

    # label (optional)
    if label:
        left, top, right, bottom = draw.textbbox((0, 0), label, font=font)
        w, h = right - left, bottom - top
        pad = 2
        box = (
            x + radius + pad,
            y - h // 2 - pad,
            x + radius + pad + w + 2 * pad,
            y + h // 2 + pad,
        )
        draw.rectangle(box, fill=(255, 255, 255, 200))
        draw.text((box[0] + pad, box[1] + pad), label, fill=color, font=font)

    Image.alpha_composite(base, overlay).save(dst)
    print(f"✓ Saved annotated image → {dst}")
