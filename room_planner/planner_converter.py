"""Tool for converting layouts from https://screeps.dissi.me/ into relative coordinates"""

from json import loads, dumps

SITE_JSON = "raw_layout.json"
ANRCHOR_POINT = {"x": 2, "y": 0}
NEW_JSON = 'layout.json'

with open(SITE_JSON) as fl:
    orig_json = loads(fl.read())

orig_json = orig_json['buildings']

for building, coords in orig_json.items():
    for i, coord in enumerate(coords['pos']):
        (_, x_val), (_, y_val) = coord.items()
        coords['pos'][i]['x'] = ANRCHOR_POINT['x'] - x_val
        coords['pos'][i]['y'] = ANRCHOR_POINT['y'] - y_val

with open(NEW_JSON, 'w') as nj:
    nj.write(orig_json.dumps())