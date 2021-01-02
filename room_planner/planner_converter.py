"""Tool for converting layouts from https://screeps.dissi.me/ into relative coordinates"""

from json import loads, dumps

SITE_JSON = "raw_layout.json"
ANRCHOR_POINT = {"x": 28, "y": 17}
NEW_JSON = "layout.json"

with open(SITE_JSON) as fl:
    orig_json = loads(fl.read())

orig_json = orig_json["buildings"]
new_json = {}

for building, coords in orig_json.items():
    for i, coord in enumerate(coords["pos"]):
        (_, x_val), (_, y_val) = coord.items()
        x_offset = ANRCHOR_POINT["x"] - x_val
        y_offset = ANRCHOR_POINT["y"] - y_val
        dist = abs(y_offset) if abs(y_offset) > abs(x_offset) else abs(x_offset)

        if building not in new_json.keys():
            new_json.update({building: []})

        new_json[building].append({"x": x_offset, "y": y_offset, "dist": dist})


with open(NEW_JSON, "w") as nj:
    nj.write(dumps(new_json))
