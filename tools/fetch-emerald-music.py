"""Download the selected public pre-looped RSE recordings for this local game.
The music retains its original copyright; see assets/music/README.txt.
"""
import concurrent.futures
import hashlib
import pathlib
import re
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets' / 'music'
PREFIX = 'https://enls.eu/prelooped/downloads/RSE/'
TRACKS = [
    ('littleroot-town', 'RSE 105 Littleroot Town', 433371, 2359088),
    ('route-101', 'RSE 111 Route 101', 1154487, 1489913),
    ('cave-of-origin', 'RSE 228 Cave of Origin & Meteor Falls', 541103, 1910807),
    ('mt-chimney', 'RSE 146 Mt. Chimney', 1630643, 3980907),
    ('gym-leader', 'RSE 150 Battle! (Gym Leader)', 2190663, 2816160),
    ('super-ancient', 'RSE 229 Battle! (Super-Ancient Pokemon)', 1792215, 1733190),
    ('route-104', 'RSE 122 Route 104', 1579673, 1666104),
    ('petalburg-woods', 'RSE 123 Petalburg Woods', 880285, 1714761),
    ('route-119', 'RSE 201 Route 119', 2202320, 2497684),
    ('sealed-chamber', 'RSE 237 Sealed Chamber', 851578, 1592395),
    ('abandoned-ship', 'RSE 240 Abandoned Ship', 850042, 1698522),
    ('victory-road', 'RSE 242 Victory Road', 715768, 1980126),
    ('route-113', 'RSE 142 Route 113', 906242, 2488104),
    ('magma-hideout', 'RSE 219 Magma & Aqua Hideout', 903476, 1799546),
    ('route-111', 'RSE 148 Route 111', 1882506, 1769316),
    ('frontier-brain', 'RSE 314 Battle! Frontier Brain', 2322994, 3966955),
]

def download(track):
    stem, name, start, length = track
    url = PREFIX + urllib.parse.quote(name + '.ogg', safe='')
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()
    if not data.startswith(b'OggS'):
        raise ValueError('Not an Ogg recording: ' + name)
    for key, expected in [('LOOPSTART', start), ('LOOPLENGTH', length)]:
        found = re.search(key.encode() + rb'=(\d+)', data[:65536])
        if not found or int(found.group(1)) != expected:
            raise ValueError('Unexpected loop metadata: ' + name)
    (DEST / (stem + '.ogg')).write_bytes(data)
    print(stem, len(data), 'bytes', flush=True)
    return f'{hashlib.sha256(data).hexdigest()}  {stem}.ogg\n'

if __name__ == '__main__':
    DEST.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        hashes = list(pool.map(download, TRACKS))
    (DEST / 'SHA256SUMS.txt').write_text(''.join(hashes), encoding='utf-8')
