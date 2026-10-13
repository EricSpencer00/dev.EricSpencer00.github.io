const byId = id => document.getElementById(id);
let widget, ready = false, initializing;
const status = message => { byId('status').textContent = message; };
async function initialize() {
  try {
    const response = await fetch('/meet/api/config', {cache:'no-store'});
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw Error();
    const {sitekey} = await response.json();
    if (!sitekey) throw Error();
    window.meetTurnstileReady = () => {
      widget = turnstile.render('#challenge', {sitekey, action:'meet', callback:()=>status(''), 'error-callback':()=>status('Bot verification failed. Please try again.'), 'expired-callback':()=>status('Verification expired. Please verify again.')});
      ready = true;
    };
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=meetTurnstileReady&render=explicit';
    script.onerror = () => status('Bot verification could not load. Please reload and try again.');
    document.head.append(script);
  } catch { status('Zoom access is not enabled in this preview yet. You can still book a time above.'); }
}
byId('open').onclick = () => {
  byId('form').hidden = false; byId('open').hidden = true; byId('open').setAttribute('aria-expanded','true'); byId('email').focus();
  initializing ||= initialize();
};
byId('cancel').onclick = () => {
  byId('form').hidden = true; byId('open').hidden = false; byId('open').setAttribute('aria-expanded','false'); byId('email').value='';
  if(ready) turnstile.reset(widget); byId('open').focus();
};
byId('form').onsubmit = async event => {
  event.preventDefault();
  if(!ready) {status('Zoom access is not enabled in this preview yet.');return;}
  const token = turnstile.getResponse(widget);
  if(!token) {status('Please complete bot verification.');return;}
  byId('submit').disabled = true;status('Checking…');
  try {
    const response = await fetch('/meet/api/reveal', {method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:byId('email').value,token})});
    const data = await response.json();
    if(!response.ok) throw Error(data.error || 'Could not verify. Please try again.');
    const url = new URL(data.url);
    if(url.protocol!=='https:' || url.hostname!=='luc.zoom.us') throw Error('Invalid meeting response.');
    const link = document.createElement('a');link.href=url.href;link.textContent='Join our Cloud HD Video Meeting';link.rel='noreferrer noopener';
    byId('result').replaceChildren(link);byId('result').hidden=false;byId('form').reset();byId('form').hidden=true;byId('result').focus();
  } catch(error) {status(error.message);turnstile.reset(widget);} finally {byId('submit').disabled=false;}
};
