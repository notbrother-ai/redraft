import concurrent.futures,subprocess,pathlib,json,hashlib,io,time,sys
cache=pathlib.Path(sys.argv[1])
from PIL import Image
root=cache/'portrait-cache';root.mkdir(exist_ok=True)
data=json.load((cache/'portrait-matches.json').open());ids=data['identities'];results={};out=root/'checks.json'
if out.exists():results=json.loads(out.read_text())
def check(item):
 id,p=item
 if id in results:return id,results[id]
 errors=[];rejected=set(json.load((pathlib.Path(__file__).resolve().parents[1]/'data/portrait-rejected-hashes.json').open()))
 for i,url in enumerate(p['sources']):
  target=root/f'{id}-{i}.img';r=subprocess.run(['curl','-fLsS','--max-time','12','--retry','1','--retry-delay','0',url,'-o',str(target)],capture_output=True)
  try:
   if r.returncode:raise ValueError('http/network '+str(r.returncode))
   raw=target.read_bytes();image=Image.open(io.BytesIO(raw));image.load();w,h=image.size
   if hashlib.sha256(raw).hexdigest() in rejected:raise ValueError('generic placeholder')
   if w<40 or h<40:raise ValueError('image too small')
   return id,{'url':url,'bytes':len(raw),'width':w,'height':h,'sha256':hashlib.sha256(raw).hexdigest(),'path':str(target)}
  except Exception as e:errors.append(str(e))
 return id,{'error':errors or ['no source']}
start=time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=32) as ex:
 for i,(id,result) in enumerate(ex.map(check,ids.items()),1):
  results[id]=result
  if i%100==0:out.write_text(json.dumps(results));print(i,len(ids),'valid',sum('url' in x for x in results.values()),'seconds',round(time.time()-start),flush=True)
out.write_text(json.dumps(results));print('DONE',len(results),'valid',sum('url' in x for x in results.values()),flush=True)
