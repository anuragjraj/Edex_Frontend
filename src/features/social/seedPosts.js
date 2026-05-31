// ══════════════════════════════════════════════════════════════
//  SOCIAL FEED (no stories, with media upload)
// ══════════════════════════════════════════════════════════════
export const SEED_POSTS = [
  {id:'sp1',uid:'u1',uname:'Priya Sharma',ucls:'Class 10',subj:'Mathematics',body:"Just cracked quadratic equations! 🎉 Key tip: check the discriminant first. b²-4ac ≥ 0 means real roots exist.",likes:24,rich_comments:[],tags:['Maths','ExamTip'],created_at:new Date(Date.now()-3600000).toISOString(),anon:false,grad:'135deg,#6366F1,#8B5CF6'},
  {id:'sp2',uid:'u2',uname:'Anonymous Student',ucls:'Class 11',subj:'Physics',body:'Struggling with thermodynamics 😫 Can someone explain isothermal vs adiabatic processes?',likes:8,rich_comments:[{id:'c1',author_name:'Helpful Student',text:'Isothermal = constant temp, Adiabatic = no heat exchange!',created_at:new Date(Date.now()-1800000).toISOString()}],tags:['Physics','Help'],created_at:new Date(Date.now()-7200000).toISOString(),anon:true,grad:'135deg,#374151,#1f2937'},
  {id:'sp3',uid:'u3',uname:'Arjun Mehta',ucls:'Class 12',subj:'Chemistry',body:'🏆 WON 2nd place in District Chemistry Olympiad!! Months of hard work paid off!',likes:67,rich_comments:[],tags:['Achievement'],created_at:new Date(Date.now()-18000000).toISOString(),anon:false,grad:'135deg,#f59e0b,#ef4444'},
]
