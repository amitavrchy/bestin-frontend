import { useEffect, useState } from 'react';
import type { Viseme, VisemeId } from '../types';
export type Expression = 'idle'|'listening'|'thinking'|'speaking'|'happy';
export function visemeAt(cues: Viseme[], time: number): VisemeId { return cues.find(c => time >= c.start && time < c.end)?.value || 'X'; }
export function useLipSync(audio: HTMLAudioElement | null, cues: Viseme[]): VisemeId {
 const [shape,setShape] = useState<VisemeId>('X');
 useEffect(() => { if (!audio) { setShape('X'); return; } let frame = 0; let context: AudioContext | undefined; let analyser: AnalyserNode | undefined; let data: Uint8Array<ArrayBuffer> | undefined;
  if (!cues.length) { try { context = new AudioContext(); const source = context.createMediaElementSource(audio); analyser = context.createAnalyser(); source.connect(analyser); analyser.connect(context.destination); data = new Uint8Array(analyser.fftSize); } catch { /* timeline remains closed if audio analysis is unavailable */ } }
  const tick = () => { let next: VisemeId = 'X'; if (!audio.paused && !audio.ended) { next = visemeAt(cues,audio.currentTime); if (analyser && data) { analyser.getByteTimeDomainData(data); const volume = Math.sqrt(data.reduce((n,v)=>n+((v-128)/128)**2,0)/data.length); next = volume > .12 ? 'D' : volume > .035 ? 'C' : 'X'; } } setShape(next); frame=requestAnimationFrame(tick); }; tick(); return () => { cancelAnimationFrame(frame); void context?.close(); };
 },[audio,cues]); return shape;
}
const mouths: Record<VisemeId, React.ReactNode> = {
 X:<path d="M139 195 Q150 201 161 195" fill="none" stroke="#783d3b" strokeWidth="2.5" strokeLinecap="round"/>,
 A:<path d="M140 196 Q150 192 160 196 Q150 201 140 196" fill="#713e40"/>,
 B:<path d="M137 194 Q150 190 163 194 Q159 204 150 204 Q141 204 137 194" fill="#67363a"/>,
 C:<><path d="M139 193 Q150 188 161 193 Q162 207 150 208 Q138 207 139 193" fill="#633238"/><path d="M142 194 Q150 196 158 194" stroke="#fff6e7" strokeWidth="3"/></>,
 D:<><ellipse cx="150" cy="199" rx="12" ry="14" fill="#633238"/><path d="M141 192 Q150 195 159 192" stroke="#fff6e7" strokeWidth="3"/><path d="M144 208 Q150 202 156 208" fill="#dd777b"/></>,
 E:<><path d="M135 194 Q150 189 165 194 Q160 204 150 204 Q140 204 135 194" fill="#633238"/><path d="M139 194 Q150 197 161 194" stroke="#fff6e7" strokeWidth="3"/></>,
 F:<><path d="M139 193 Q150 191 161 193 Q158 201 150 202 Q142 201 139 193" fill="#874c4a"/><path d="M140 194 H160" stroke="#fff6e7" strokeWidth="3"/></>,
 G:<ellipse cx="150" cy="199" rx="7" ry="10" fill="#633238"/>, H:<><ellipse cx="150" cy="199" rx="9" ry="12" fill="#633238"/><path d="M146 206 Q150 202 154 206" stroke="#df8888" strokeWidth="3"/></>
};
const EMPTY_VISEMES: Viseme[] = [];
export function Avatar({audio=null,visemes=EMPTY_VISEMES,expression='idle',character='sage',manual}: {audio?:HTMLAudioElement|null; visemes?:Viseme[]; expression?:Expression; character?:string; manual?:VisemeId}) {
 const shape = useLipSync(audio,visemes); const [blink,setBlink] = useState(false); const [gaze,setGaze] = useState(0);
 useEffect(() => { let timer:number; let live=true; const next=()=>{ timer=window.setTimeout(()=>{ if (!live) return; setBlink(true); window.setTimeout(()=>setBlink(false),140); if(Math.random()<.18) window.setTimeout(()=>{setBlink(true);window.setTimeout(()=>setBlink(false),120);},260); setGaze(Math.random()*4-2); next(); },2200+Math.random()*3500); }; next(); return ()=>{live=false;clearTimeout(timer);}; },[]);
 const outfit = character === 'rose' ? '#ad6b70' : character === 'ocean' ? '#577f91' : '#718b71';
 return <svg className={`avatar avatar-${expression}`} viewBox="0 0 300 360" role="img" aria-label={`Bestin, ${expression}`}>
 <defs><linearGradient id="skin" x2="1" y2="1"><stop stopColor="#ffe0bd"/><stop offset="1" stopColor="#d99b7f"/></linearGradient><linearGradient id="hair" x2="1" y2="1"><stop stopColor="#694940"/><stop offset="1" stopColor="#362b30"/></linearGradient></defs>
 <g className="avatar-body"><path d="M37 360 Q40 274 104 260 L196 260 Q260 274 263 360" fill={outfit}/><path d="M102 262 Q150 305 198 262 L179 250 H121Z" fill="#f4dfbe"/><path d="M118 245 L118 273 Q150 295 182 273 L182 245" fill="url(#skin)"/><path d="M90 360 L103 285 M210 360 L197 285" fill="none" stroke="#ffffff" opacity=".2" strokeWidth="3"/><path d="M130 280 Q150 310 170 280 L162 317 H138Z" fill="#e6be89"/><circle cx="150" cy="319" r="4" fill="#dfc59c"/></g>
 <g className="avatar-head"><path d="M76 149 Q62 40 150 35 Q238 40 224 149 L230 218 Q214 259 182 256 L118 256 Q85 259 70 218Z" fill="url(#hair)"/><ellipse cx="91" cy="168" rx="15" ry="24" fill="#dba284"/><ellipse cx="209" cy="168" rx="15" ry="24" fill="#dba284"/><path d="M91 126 Q93 65 150 62 Q207 65 209 126 L205 182 Q199 237 150 251 Q101 237 95 182Z" fill="url(#skin)"/><path d="M91 133 Q80 60 132 48 Q193 25 211 94 L210 133 Q193 122 188 88 Q155 121 97 113Z" fill="url(#hair)"/><path d="M101 103 Q112 67 149 60" fill="none" stroke="#b48470" opacity=".35" strokeWidth="4" strokeLinecap="round"/>
 <path className="eyebrows" d="M111 140 Q123 134 136 140 M164 140 Q177 134 189 140" fill="none" stroke="#60423d" strokeWidth="3" strokeLinecap="round"/>
 <g transform={`translate(${gaze} ${expression==='thinking'?-3:0})`}><ellipse cx="124" cy="153" rx="12" ry={blink?1:8} fill="#fffaf0"/><ellipse cx="176" cy="153" rx="12" ry={blink?1:8} fill="#fffaf0"/>{!blink && <><circle cx="125" cy="153" r="5" fill="#496459"/><circle cx="177" cy="153" r="5" fill="#496459"/><circle cx="126" cy="151" r="1.8" fill="white"/><circle cx="178" cy="151" r="1.8" fill="white"/></>}</g>
 <path d="M149 155 Q145 173 151 175 L155 174" fill="none" stroke="#bd806f" strokeWidth="2" strokeLinecap="round"/><ellipse cx="112" cy="180" rx="10" ry="5" fill="#e89d92" opacity=".3"/><ellipse cx="188" cy="180" rx="10" ry="5" fill="#e89d92" opacity=".3"/>
 <g className="mouth" key={manual || shape}>{expression === 'happy' && !manual && shape === 'X' ? <path d="M137 194 Q150 209 163 194 Q150 203 137 194" fill="#783d3b"/> : mouths[manual || shape]}</g><g fill="none" stroke="#806d5a" strokeWidth="2" opacity=".8"><circle cx="124" cy="154" r="17"/><circle cx="176" cy="154" r="17"/><path d="M141 153 Q150 148 159 153 M107 151 L93 147 M193 151 L207 147"/></g></g></svg>;
}
