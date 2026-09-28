"""Normalize captured upstream responses. Usage: python scripts/prepare-season-snapshots.py SOURCE_DIR.
Raw responses are captured from the existing api/season.js, FFC and MFL endpoints.
Never extrapolate players between seasons. Preserve source and proxy labels.
"""
import sys,json,re,pathlib
source=pathlib.Path(sys.argv[1]);out=pathlib.Path('data/seasons');out.mkdir(parents=True,exist_ok=True)
TEAM={'GBP':'GB','GNB':'GB','KCC':'KC','KAN':'KC','NEP':'NE','NWE':'NE','NOS':'NO','NOR':'NO','TBB':'TB','TAM':'TB','SFO':'SF','JAC':'JAX','LVR':'LV','SDC':'SD','SDG':'SD','WSH':'WAS','FA*':'FA'}
ALIASES={'Hollywood Brown':'Marquise Brown','Gabe Davis':'Gabriel Davis','Kenny Gainwell':'Kenneth Gainwell','Chig Okonkwo':'Chigoziem Okonkwo','Steve Johnson':'Stevie Johnson','Benjamin Watson':'Ben Watson','Mitchell Trubisky':'Mitch Trubisky','Robert Kelley':'Rob Kelley'}
def normalize(p,y):
 p['team']=TEAM.get(p.get('team'),p.get('team')) or 'FA'
 if p['team'] in ['LAC','SD']:p['team']='SD' if y<2017 else 'LAC'
 if p['team'] in ['LAR','STL']:p['team']='STL' if y<2016 else 'LAR'
 if p['team'] in ['LV','OAK']:p['team']='OAK' if y<2020 else 'LV'
 p['name']=ALIASES.get(p['name'],p['name'])
 if p['name'] in ['Robbie Chosen','Chosen Anderson','Robbie Anderson','Robby Anderson']:p['name']='Robby Anderson' if y<=2021 else 'Robbie Anderson' if y==2022 else 'Chosen Anderson'
 if p['name'] in ['Chad Johnson','Chad Ochocinco']:p['name']='Chad Ochocinco' if 2008<=y<=2011 else 'Chad Johnson'
 if p['pos']=='DST':p['name']=p['team']+' Defense'
 return p
def key(p):
 if p['pos']=='DST': return 'DST:'+p['team']
 name=re.sub(r'\b(jr|sr|iii|ii|iv)\b','',p['name'].lower())
 return re.sub('[^a-z0-9]','',name)
for y in range(2000,2027):
 base=json.loads((source/f'{y}-api.json').read_text());players={}
 for p in base['players']:
  p=dict(p);p['name']=p['name'].replace('*','').replace('+','').strip();p['source']=base['source'];p['standardAdp']=p['adp'];normalize(p,y);players[key(p)]=p
 for fmt in ['standard','ppr']:
  path=source/(f'{y}-standard.json' if fmt=='standard' else f'{y}.json')
  if not path.exists():continue
  for x in json.loads(path.read_text()).get('players',[]):
   pos=x['position'];pos={'DEF':'DST','D/ST':'DST','PK':'K'}.get(pos,pos)
   if pos not in ['QB','RB','WR','TE','K','DST']:continue
   p={'name':x['name'],'pos':pos,'team':x['team'],'adp':x['adp'],'source':'Fantasy Football Calculator historical ADP'}
   normalize(p,y);k=key(p)
   if k not in players:players[k]=p
   players[k][fmt+'Adp']=x['adp']
   # Prefer the contemporaneous ADP listing's team over an end-of-season directory team.
   if p['team']!='FA':players[k]['team']=p['team']
 path=source/f'{y}-players.json'
 if path.exists():
  for x in json.loads(path.read_text()).get('players',{}).get('player',[]):
   pos={'PK':'K','Def':'DST','DEF':'DST',**({'DT':'DST'} if y<=2001 else {})}.get(x.get('position'),x.get('position'));team=x.get('team','FA')
   if pos not in ['QB','RB','WR','TE','K','DST'] or team in ['FA','FA*','','---']:continue
   if x.get('draft_year','').isdigit() and int(x['draft_year'])>y:continue
   if pos in ['QB','RB','WR','TE'] and (y<2006 or sum(p['pos']==pos for p in players.values())>={'QB':30,'RB':75,'WR':95,'TE':35}[pos]):continue
   name=x.get('name','');name=' '.join(reversed(name.split(', '))) if ', ' in name else name
   p={'name':name,'pos':pos,'team':team,'adp':400,'unranked':True,'mflId':x['id'],'source':f'MyFantasyLeague {y} player directory (unranked depth)'}
   normalize(p,y)
   if y<2002 and p['team']=='HOU':continue
   if key(p) not in players:players[key(p)]=p
 ps=list(players.values());ps.sort(key=lambda p:p.get('standardAdp',p['adp']))
 for i,p in enumerate(ps):p['id']=i
 j={'year':y,'source':base['source'],'capturedAt':'2026-09-28','marketQuality':'results-proxy' if y<=2005 else 'historical-adp','notes':('2000–2005 rankings are the existing results-based proxy, not verified preseason ADP. Unranked depth comes from the season player directory.' if y<=2005 else 'Archived 12-team ADP; scoring-specific FFC values where available. Missing scoring splits retain the source ADP. Unranked depth has no observed ADP.'),'players':ps}
 (out/f'{y}.json').write_text(json.dumps(j,separators=(',',':'))+'\n');print(y,len(ps))
