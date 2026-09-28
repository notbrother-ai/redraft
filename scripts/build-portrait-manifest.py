"""Freeze audited photos: python scripts/build-portrait-manifest.py matches.json checks.json.

Inputs use nflverse players/season rosters and dynastyprocess's MFL→GSIS crosswalk.
checks.json contains downloaded, decoded images with SHA-256 hashes; generic NFL
silhouettes and blank responses must be rejected before running this script.
Neither image searching nor unverified name-only fallbacks run in the app.
"""
import json,sys,pathlib,collections
root=pathlib.Path(__file__).resolve().parents[1]
matches=json.load(open(sys.argv[1]));checks=json.load(open(sys.argv[2]));manifest={};seasons=[];missing=[]
for identity,p in matches['identities'].items():
 c=checks.get(identity,{})
 if c.get('url'):
  manifest[identity]={'name':p['name'],'url':c['url'],'width':c['width'],'height':c['height'],'sha256':c['sha256']}
for year,ids in matches['seasons'].items():
 path=root/f'data/seasons/{year}.json';snapshot=json.loads(path.read_text());count=0;defenses=0
 for p in snapshot['players']:
  p.pop('portraitId',None)
  if p['pos']=='DST':defenses+=1;continue
  identity=ids.get(str(p['id']))
  if identity in manifest:p['portraitId']=identity;count+=1
  else:missing.append({'year':int(year),'name':p['name'],'pos':p['pos'],'reason':'no verified available image' if identity else 'identity unresolved'})
 path.write_text(json.dumps(snapshot,separators=(',',':')))
 seasons.append({'year':int(year),'players':len(snapshot['players'])-defenses,'photos':count,'fallbacks':len(snapshot['players'])-defenses-count,'teamGraphics':defenses})
(root/'verified-portraits.js').write_text('// Audited stable NFL identities and decoded image URLs. See data/portrait-audit.json.\nwindow.REDRAFT_VERIFIED_PORTRAITS='+json.dumps(manifest,separators=(',',':'))+';\n')
report={'checkedAt':'2026-09-28','sources':['https://github.com/nflverse/nflverse-data/releases/tag/players','https://github.com/nflverse/nflverse-data/releases/tag/rosters','https://github.com/dynastyprocess/data/blob/master/files/db_playerids.csv'],'uniquePhotos':len(manifest),'playerSeasonPhotos':sum(s['photos'] for s in seasons),'playerSeasonFallbacks':len(missing),'seasons':seasons,'missing':missing}
(root/'data/portrait-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print({k:v for k,v in report.items() if k not in ['seasons','missing','sources']})
