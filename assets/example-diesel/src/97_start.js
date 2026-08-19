/* ================================================================== 启动 */
CYC=buildCycle(ST.boost,ST.load); refreshTrace(); updateKinematics(); rebuildPick(); setView('free',true);
$('lbar').style.width='100%'; $('lmsg').textContent='就绪';
setTimeout(()=>{ const l=$('loading'); l.style.opacity=0; setTimeout(()=>l.remove(),650); },240);
loop();
