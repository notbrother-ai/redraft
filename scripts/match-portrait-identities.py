import csv,json,re,collections,pathlib,sys
cache=pathlib.Path(sys.argv[1]);root=pathlib.Path(__file__).resolve().parents[1]
rows=list(csv.DictReader((cache/'players-crosswalk.csv').open()))
ALIASES={'rocketismail':'raghibismail','camcleeland':'cameroncleeland','billgramatica':'billygramatica','hollywoodbrown':'marquisebrown','gabedavis':'gabrieldavis','kennygainwell':'kennethgainwell','chigokonkwo':'chigoziemokonkwo','stevejohnson':'steviejohnson','benjaminwatson':'benwatson','mitchelltrubisky':'mitchtrubisky','robertkelley':'robkelley','robbiechosen':'robbyanderson','chosenanderson':'robbyanderson','robbieanderson':'robbyanderson','chadococinco':'chadjohnson','chadochocinco':'chadjohnson','mauricedrew':'mauricejonesdrew'}
def norm(s):
 s=re.sub(r'\([^)]*\)','',s);s=re.sub(r'\b(jr|sr|ii|iii|iv)\b','',s.lower());s=re.sub('[^a-z0-9]','',s);return ALIASES.get(s,s)
def pos(s):return {'FB':'RB','HB':'RB','PK':'K'}.get(s,s)
def num(s,d):
 try:return int(float(s))
 except:return d
byname=collections.defaultdict(dict);bygsis={}
for p in rows:
 bygsis[p['gsis_id']]=p
 for name in [p['display_name'],p['football_name']+' '+p['last_name'],p['common_first_name']+' '+p['last_name'],p['first_name']+' '+p['last_name']]:byname[norm(name)][p['gsis_id']]=p
byMfl={}
fp=cache/'fantasy-ids.csv'
if fp.exists():
 for p in csv.DictReader(fp.open()):
  if p.get('mfl_id'):byMfl[p['mfl_id']]=p
matches={};missing=[];identities={};total=0;corrections=[]
for year in range(2000,2027):
 season={}; snapshot=json.loads((root/f'data/seasons/{year}.json').read_text()); roster=list(csv.DictReader((cache/f'rosters/{year}.csv').open()))
 names=collections.defaultdict(list)
 for r in roster:names[norm(r['full_name'])].append(r)
 for p in snapshot['players']:
  if p['pos']=='DST':continue
  total+=1; candidates=[x for x in byname[norm(p['name'])].values() if pos(x['position'])==p['pos'] and num(x['rookie_season'],0)<=year<=num(x['last_season'],2026)+1]
  # A verified MFL-to-GSIS join resolves namesakes when source IDs are available.
  cross=byMfl.get(str(p.get('mflId','')));exact=bygsis.get(cross.get('gsis_id','')) if cross else None
  if exact and norm(exact['display_name'])==norm(p['name']) and pos(exact['position'])==p['pos']:candidates=[exact]
  yr=[r for r in names[norm(p['name'])] if r['gsis_id'] in bygsis]
  teams={'JAX':'JAC','WSH':'WAS','SL':'LAR','LA':'LAR','STL':'LAR','OAK':'LV','SD':'LAC'}
  same_team=[r for r in yr if teams.get(r['team'],r['team'])==teams.get(p['team'],p['team'])]
  if same_team:yr=same_team
  yr={r['gsis_id']:r for r in yr}
  yr={k:r for k,r in yr.items() if pos(r['position'])==p['pos'] or (r['position']=='FB' and p['pos']=='TE')}
  if len(yr)==1:
   r=next(iter(yr.values()));rp=pos(r['position'])
   if rp in ['QB','RB','WR','TE','K']:
    candidates=[bygsis[r['gsis_id']]]
  elif len(candidates)>1:candidates=[]
  if len(candidates)!=1:missing.append({'year':year,'name':p['name'],'pos':p['pos'],'reason':'ambiguous' if candidates else 'no identity'});continue
  x=candidates[0];identity=x['gsis_id'];season[str(p['id'])]=identity
  sources=[]
  if x['espn_id']:sources.append(f"https://a.espncdn.com/i/headshots/nfl/players/full/{x['espn_id']}.png")
  if x['espn_id']:sources.append(f"https://a.espncdn.com/i/headshots/nfl/players/65/{x['espn_id']}.jpg")
  if x['headshot']:sources.append(x['headshot'])
  identities[identity]={'name':x['display_name'],'pos':p['pos'],'espnId':x['espn_id'],'sources':sources}
 matches[str(year)]=season
out={'seasons':matches,'identities':identities,'missing':missing,'positionCorrections':corrections};(cache/'portrait-matches.json').write_text(json.dumps(out));print('entries',total,'matched',sum(map(len,matches.values())),'unique',len(identities),'missing',len(missing));print('missing unique',len(set((p['name'],p['pos']) for p in missing)));print(missing[:20])
