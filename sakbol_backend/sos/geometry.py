from shapely.geometry import Point, Polygon

def is_point_inside_polygon(lat: float, lng: float, polygon: list[dict]) -> bool:
    """
    polygon: [{lat, lng}, ...]
    """
    if not polygon or len(polygon) < 3:
        return False

    poly = Polygon(
        [(p["lng"], p["lat"]) for p in polygon]  # ⚠️ порядок: (x=lng, y=lat)
    )
    point = Point(lng, lat)

    return poly.contains(point) or poly.touches(point)