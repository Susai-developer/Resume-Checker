// ResumeIQ - shared + page scripts (dynamic version, no sample data)
const API = "http://127.0.0.1:5000";
const page = document.body.dataset.page;
const links = [["index.html","Home","home"],["dashboard.html","Dashboard","dashboard"],["quiz.html","Quiz","quiz"],["result.html","Results","result"]];
document.getElementById("nav").innerHTML = `
<nav class="navbar navbar-expand-md sticky-top"><div class="container">
 <a class="brand" href="index.html">Resume<span>IQ</span></a>
 <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#m"><span class="navbar-toggler-icon"></span></button>
 <div class="collapse navbar-collapse" id="m"><ul class="navbar-nav ms-auto align-items-md-center gap-md-3">
 ${links.map(l=>`<li class="nav-item"><a class="nav-link ${l[2]==page?'active':''}" href="${l[0]}">${l[1]}</a></li>`).join("")}
 <li><a class="btn btn-brand btn-sm" href="dashboard.html">Check my resume</a></li></ul></div></div></nav>`;
document.getElementById("foot").innerHTML = `<footer><div class="container text-center">© 2026 ResumeIQ - AI Powered Universal Resume Checker. For every profession.</div></footer>`;

const $ = id => document.getElementById(id);
// Escape AI text before inserting into HTML (security)
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const chips = (arr,cls="") => (arr&&arr.length) ? arr.map(s=>`<span class="chip ${cls}">${esc(s)}</span>`).join("") : '<span class="text-muted">Not found in resume</span>';
const items = (arr,cls="") => (arr&&arr.length) ? `<ul class="list-check ${cls}">${arr.map(s=>`<li>${esc(s)}</li>`).join("")}</ul>` : '<span class="text-muted">Not found in resume</span>';
const load = key => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } };
function animateRing(el,val){let n=0;const t=setInterval(()=>{n++;el.style.setProperty("--p",n);el.querySelector("b").textContent=n;if(n>=val)clearInterval(t)},18)}

/* HOME (decorative preview card only) */
if(page==="home") animateRing($("heroRing"),78);

/* DASHBOARD */
if(page==="dashboard"){
  const drop=$("drop"),input=$("file"),btn=$("analyzeBtn");
  const okExt=["pdf","jpg","jpeg","png"];
  let chosen=null;
  drop.onclick=()=>input.click();
  ["dragover","dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.toggle("over",ev==="dragover");if(ev==="drop")pick(e.dataTransfer.files[0])}));
  input.onchange=()=>pick(input.files[0]);
  function pick(f){
    if(!f)return;
    const ext=f.name.split(".").pop().toLowerCase();
    if(!okExt.includes(ext)){$("err").textContent="Please upload a PDF, JPG, JPEG or PNG file.";return}
    if(f.size>5*1024*1024){$("err").textContent="File is larger than 5 MB.";return}
    chosen=f;$("err").textContent="";$("fname").textContent=f.name;$("fsize").textContent=(f.size/1024).toFixed(0)+" KB";
    $("chip").classList.add("show");btn.disabled=false;
  }
  $("remove").onclick=()=>{chosen=null;input.value="";$("chip").classList.remove("show");btn.disabled=true;$("results").classList.remove("show")};

  btn.onclick=async()=>{
    if(!chosen)return;
    btn.disabled=true;btn.innerHTML='<span class="spinner-border spinner-border-sm me-2"></span>Analyzing your resume (about 20 seconds)...';
    $("err").textContent="";$("results").classList.remove("show");
    try{
      const fd=new FormData();fd.append("resume",chosen);
      const r=await fetch(API+"/api/analyze",{method:"POST",body:fd});
      const j=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(j.error||"Something went wrong. Please try again.");
      sessionStorage.setItem("analysis",JSON.stringify(j.analysis));
      sessionStorage.setItem("questions",JSON.stringify(j.questions));
      sessionStorage.setItem("analysis_id",String(j.analysis_id || ""));
      sessionStorage.removeItem("answers");
      show(j.analysis);
    }catch(e){
      $("err").textContent = e instanceof TypeError ? "Cannot reach the server. Start the Flask backend with: python app.py" : e.message;
    }finally{btn.innerHTML="Analyze resume";btn.disabled=!chosen}
  };

  function show(a){
    $("pName").textContent=a.name||"Your resume";$("pJob").textContent=a.profession||"";
    $("edu").innerHTML=items(a.education,"tip");
    const sk=a.skills||{};
    $("skills").innerHTML=chips(sk.technical)+chips(sk.non_technical,"alt");
    $("exp").innerHTML=`<h6>Work experience</h6>${items(a.experience,"tip")}<h6 class="mt-3">Projects</h6>${items(a.projects,"tip")}`;
    $("certs").innerHTML=items(a.certifications,"tip");
    $("str").innerHTML=items(a.strengths);$("weak").innerHTML=items(a.weaknesses,"weak");$("tips").innerHTML=items(a.suggestions,"tip");
    $("bars").innerHTML=(a.section_scores||[]).map(s=>`<div class="mb-3"><div class="d-flex justify-content-between small fw-bold"><span>${esc(s.label)}</span><span>${esc(s.score)}/100</span></div><div class="bar"><i style="width:${Math.max(0,Math.min(100,+s.score||0))}%"></i></div></div>`).join("");
    $("results").classList.add("show");animateRing($("ring"),a.score);
    $("results").scrollIntoView({behavior:"smooth"});
  }
  const saved=load("analysis");if(saved)show(saved); // keep results when coming back
}

/* QUIZ */
if(page==="quiz"){
  const Q=load("questions");
  if(!Q||!Q.length){
    document.querySelector(".quiz-card").innerHTML='<h5>No quiz yet</h5><p class="text-muted">Upload and analyze your resume first.</p><a href="dashboard.html" class="btn btn-brand">Go to dashboard</a>';
  }else{
    let i=0;const ans=new Array(Q.length).fill(null);
    function render(){
      const q=Q[i];
      $("count").textContent=`Question ${i+1} of ${Q.length}`;
      $("bar").style.width=((i+1)/Q.length*100)+"%";
      $("body").innerHTML=`<div class="slide"><span class="diff ${esc(q.difficulty)}">${esc(q.difficulty)}</span><h4 class="my-3">${esc(q.question)}</h4>
        ${q.options.map((t,k)=>`<button class="opt ${ans[i]===k?'sel':''}" data-k="${k}"><span class="l">${"ABCD"[k]}</span>${esc(t)}</button>`).join("")}</div>`;
      document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ans[i]=+b.dataset.k;render()});
      $("prev").disabled=i===0;
      $("next").classList.toggle("d-none",i===Q.length-1);
      $("submit").classList.toggle("d-none",i!==Q.length-1);
      $("dots").innerHTML=Q.map((_,k)=>`<button class="dot ${k===i?'now':ans[k]!==null?'done':''}" data-k="${k}">${k+1}</button>`).join("");
      document.querySelectorAll(".dot").forEach(d=>d.onclick=()=>{i=+d.dataset.k;render()});
    }
    $("prev").onclick=()=>{i--;render()};
    $("next").onclick=()=>{i++;render()};
    $("submit").onclick=()=>{
      const left=ans.filter(a=>a===null).length;
      if(left&&!confirm(`${left} question(s) are unanswered. Submit anyway?`))return;
      sessionStorage.setItem("answers",JSON.stringify(ans));location.href="result.html";
    };
    render();
  }
}

/* RESULT */
if(page==="result"){
  const ans=load("answers"),Q=load("questions");
  if(!ans||!Q){$("empty").classList.remove("d-none")}
  else{
    $("content").classList.remove("d-none");
    let ok=0,wrong=0;
    Q.forEach((q,k)=>{ans[k]===q.answer?ok++:wrong++});
    const pct=Math.round(ok/Q.length*100);
    const analysisId=Number(sessionStorage.getItem("analysis_id"));
    if(analysisId){
      fetch(API+"/api/quiz-result",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({analysis_id:analysisId,total_questions:Q.length,correct_answers:ok,wrong_answers:wrong,percentage:pct})
      }).then(r=>r.json()).then(data=>{if(!data.saved)console.warn("Quiz result was not saved:",data.error)}).catch(err=>console.warn("Quiz result save failed:",err));
    }
    $("total").textContent=`${ok}/${Q.length}`;$("ok").textContent=ok;$("wrong").textContent=wrong;$("pct").textContent=pct+"%";
    $("verdict").textContent=`${Q.length} questions. `+(pct>=80?"Excellent. Your resume skills are strong.":pct>=50?"Good effort. Review the explanations below.":"Keep practising. Read the explanations below.");
    $("review").innerHTML=Q.map((q,k)=>{
      const good=ans[k]===q.answer;
      return `<div class="card-x review ${good?'':'wrong'} mb-3"><div class="d-flex justify-content-between gap-2"><b>Q${k+1}. ${esc(q.question)}</b><span class="diff ${esc(q.difficulty)}">${esc(q.difficulty)}</span></div>
      <div class="mt-2 small">Your answer: <b class="${good?'text-success':'text-danger'}">${ans[k]===null?'Not answered':"ABCD"[ans[k]]+". "+esc(q.options[ans[k]])}</b></div>
      <div class="small">Correct answer: <b class="text-success">${"ABCD"[q.answer]}. ${esc(q.options[q.answer])}</b></div>
      <div class="expl">${esc(q.explanation)}</div></div>`}).join("");
  }
  $("retry").onclick=()=>{sessionStorage.removeItem("answers");location.href="quiz.html"};
}
