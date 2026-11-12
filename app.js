let me={id:0,name:"",username:"",bio:"",pic:avatar(),followers:0,following:0,statusNote:"",isPrivate:false};
let users=[
 {id:1,name:"Alex",username:"alex.design",pic:avatar(),bio:"Creative soul | Design & lifestyle",followers:2450,following:430},
 {id:2,name:"Sarah",username:"sarah.official",pic:avatar(),bio:"Living beautifully | Everyday moments",followers:5200,following:610},
 {id:3,name:"John",username:"john.travel",pic:avatar(),bio:"Explore more | Travel photography",followers:1800,following:390},
 {id:4,name:"Emma",username:"emma.life",pic:avatar(),bio:"Photography | Little moments",followers:3400,following:720}
];

let posts=[
 {id:1,user:1,src:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900",video:false,caption:"Find your own beautiful world",likes:2450,liked:false,comments:[]},
 {id:2,user:2,src:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900",video:false,caption:"Every moment is special",likes:5821,liked:false,comments:[]},
 {id:3,user:3,src:"https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900",video:false,caption:"Travel. Explore. Repeat.",likes:912,liked:false,comments:[]},
 {id:4,user:1,src:"https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900",video:false,caption:"Nature is home.",likes:720,liked:false,comments:[]},
 {id:5,user:4,src:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900",video:false,caption:"A little sunshine.",likes:1600,liked:false,comments:[]}
];

let reels=[],archivedReels=[];

let follows=new Set(),followStates=new Map(),pendingFollows=new Set(),loadingFollowStates=new Set(),saved=new Set(),savedReels=new Set(),savedReelItems=[],pendingBookmarks=new Set(),savedBookmarksLoading=false,likedReels=new Set(),likedReelItems=[],pendingReelLikes=new Set(),pendingPostLikes=new Set(),notifications=[],chats={};
window.isGlobalAudioUnmuted=Boolean(window.isGlobalAudioUnmuted);
let nextId=10,activeChat=null,viewing=null,profileTab="posts",muted=!window.isGlobalAudioUnmuted;
window.isReelsMuted=muted;
let homeFeedMode='forYou',exploreHashtagQuery='',peopleDrawerPreviousOverflow='';
let dmConversations=[],dmProfiles=new Map(),dmMessages=[],dmChannel=null,dmRequestToken=0,dmSending=false;
let dmVoiceRecorder=null,dmVoiceStream=null,dmVoiceChunks=[],dmActionTargetUserId=null,reelShareTargetId=null;
let dmLongPressTimer=null;
let feedPlaybackObserver=null,activeFeedVideo=null;
let searchTerm="";
let searchDebounceTimer=null;
let searchRequestToken=0;
const searchedProfiles=new Map();
let storyGroups=[];
let archivedOwnStories=[],profileHighlights=[];
window.allExploreMedia=window.allExploreMedia||[];
let exploreFilter='all';
let storyViewerGroupIndex=-1;
let storyViewerItemIndex=0;
let storyAdvanceTimer=null,storyViewerPreviousOverflow='';
const viewedStoryIds=new Set();
const recordedStoryViewIds=new Set();
const storyLikeCounts=new Map();
const likedStoryIds=new Set();
const pendingStoryLikes=new Set();
let storyUploading=false;
let pendingStoryReplyMetadata=null;
let activityNotifications=[];
let activityChannel=null;
let activityPreviousOverflow='';
let bookmarkLoadToken=0;
let activityRequestToken=0;
let authMode = 'login';
let currentUser = null;
let currentProfile = null;
let hasCurrentProfile = false;
let authInitialized = false;
let mediaPreviewUrl = null;
let createAspectRatio='square';
let cameraStream=null,cameraRecorder=null,cameraChunks=[],cameraCaptureFile=null,cameraCaptureUrl=null,cameraRecordTimer=null,cameraPreviousOverflow='';
let highlightPreviousOverflow='';
let activeCommentReelId = null;
let activeCommentParentId=null;
let activeComments=[];
let commentLoadToken = 0;
let commentsSubmitting = false;
let commentLikes=new Set(),pendingCommentLikes=new Set(),commentLikeCounts=new Map();
let reelsLoading=false;
let creatingPost=false;
let feedRefreshing=false;
let feedPullStartY=null;
let feedPullDistance=0;
let audioContext=null;
let settingsSheetPreviousOverflow='';
let settingsSubviewName='';
let pendingStoryAudienceFile=null;
let storyAudiencePreviousOverflow='';
let appVisibleSince=Date.now();
let dailyAppUsageMs=0;
const localToday=new Date();
const dailyAppUsageKey=`vybe:daily-usage:${localToday.getFullYear()}-${String(localToday.getMonth()+1).padStart(2,'0')}-${String(localToday.getDate()).padStart(2,'0')}`;
const accountListKey='vybe:known-accounts';
let currentAccountPrivate=false;
let highQualityUploads=false;
try{dailyAppUsageMs=Number(localStorage.getItem(dailyAppUsageKey))||0;highQualityUploads=localStorage.getItem('vybe:high-quality-uploads')==='true';}catch(error){console.error('Local settings read error:',error);}

function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function avatarSrc(pic){return pic || avatarPlaceholder}

function renderTaggedText(value){
 const text=String(value??'');
 const tagPattern=/(@[A-Za-z0-9_.-]+|#[\p{L}\p{N}_]+)/gu;
 let result='',lastIndex=0,match;
 while((match=tagPattern.exec(text))){
  result+=safe(text.slice(lastIndex,match.index));
  const tag=match[0];
  if(tag[0]==='@'){
   result+=`<span class="mention-tag" role="link" tabindex="0" onclick="openTaggedProfile('${safe(tag.slice(1))}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openTaggedProfile('${safe(tag.slice(1))}')}">${safe(tag)}</span>`;
  }else{
   const hashtag=tag.slice(1);
   result+=`<span class="hashtag-link" role="link" tabindex="0" onclick="openHashtag('${safe(hashtag)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openHashtag('${safe(hashtag)}')}">${safe(tag)}</span>`;
  }
  lastIndex=tagPattern.lastIndex;
 }
 return result+safe(text.slice(lastIndex));
}

function playPopSound(){
 const AudioContextClass=window.AudioContext||window.webkitAudioContext;
 if(!AudioContextClass) return;
 try{
  audioContext=audioContext||new AudioContextClass();
  if(audioContext.state==='suspended') void audioContext.resume().catch(error=>console.info('Audio context resume was blocked:',error));
  const oscillator=audioContext.createOscillator();
  const gain=audioContext.createGain();
  const start=audioContext.currentTime;
  oscillator.type='sine';
  oscillator.frequency.setValueAtTime(600,start);
  oscillator.frequency.exponentialRampToValueAtTime(900,start+.09);
  gain.gain.setValueAtTime(.0001,start);
  gain.gain.exponentialRampToValueAtTime(.09,start+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,start+.16);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start+.17);
  oscillator.addEventListener('ended',()=>{oscillator.disconnect();gain.disconnect();},{once:true});
 }catch(error){console.error('Like sound playback error:',error);}
}

function triggerInteractionFeedback(){
 playPopSound();
 if(typeof navigator.vibrate==='function'){
  try{navigator.vibrate(35);}catch(error){console.info('Haptic feedback is unavailable:',error);}
 }
}

function normalizeUsername(value){
  return String(value||'').trim().replace(/\s+/g,'').replace(/[^a-zA-Z0-9_.-]/g,'').toLowerCase();
}

async function checkUsernameAvailable(username){
  return checkUsernameAvailableForUser(username,null);
}

async function checkUsernameAvailableForUser(username,excludeUserId){
  const clean = normalizeUsername(username);
  if(!clean){ return { available:false, error:'Username is required.'}; }
  if(clean.length < 3){ return { available:false, error:'Username must be at least 3 characters long.'}; }
  let query=supabaseClient.from('profiles').select('id,username').eq('username', clean);
  if(excludeUserId) query=query.neq('id',excludeUserId);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return { available: !data, error: data ? 'Username already taken, please choose another' : null };
}

async function ensureProfileForUser(userId, username){
  const clean = normalizeUsername(username);
  if(!userId || !clean) throw new Error('Username is required.');
  const { data, error } = await supabaseClient.from('profiles').upsert({ id: userId, username: clean }, { onConflict: 'id' }).select().maybeSingle();
  if (error) throw error;
  currentProfile = data?.username || clean;
  me.id = userId;
  me.username = currentProfile;
  return currentProfile;
}

async function syncCurrentProfile(){
  if(!currentUser){ currentProfile = null; hasCurrentProfile = false; updateAuthUI(); return null; }
  const profileUser=currentUser;
  const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', profileUser.id).maybeSingle();
  if (error && error.code !== 'PGRST116') {
    console.error('Profile sync error:', error);
  }
  if(currentUser?.id !== profileUser.id) return null;
  const profile=data || {};
  const metadata=profileUser.user_metadata || {};
  const generatedUsername=`user_${normalizeUsername((profileUser.email || '').split('@')[0]).slice(0,18) || String(profileUser.id).replace(/-/g,'').slice(0,8)}`;
  currentProfile=normalizeUsername(profile.username || metadata.username) || generatedUsername;
  hasCurrentProfile=Boolean(data);
  me.id = profileUser.id;
  me.name=profile.full_name || profile.display_name || profile.name || metadata.full_name || metadata.name || (profileUser.email || '').split('@')[0] || 'User';
  me.username = currentProfile;
  me.bio=profile.bio || metadata.bio || '';
  me.pic=profile.avatar_url || profile.profile_avatar_url || metadata.profile_avatar_url || avatar();
  me.statusNote=profile.status_note || '';
  me.isPrivate=Boolean(profile.is_private);
  currentAccountPrivate=me.isPrivate;
  const { error: saveError }=await supabaseClient.from('profiles').upsert({
    id:profileUser.id,
    username:currentProfile,
    full_name:me.name,
    bio:me.bio,
    avatar_url:me.pic && !me.pic.startsWith('data:') ? me.pic : (profile.avatar_url || null)
  },{onConflict:'id'});
  if(saveError) console.error('Profile sync upsert notice:',saveError);
  updateAuthUI();
  renderStories();
  renderFeed();
  renderReels();
  renderExplore();
  renderProfile();
  await loadFollowData(profileUser.id);
  return hasCurrentProfile;
}

async function loadFollowData(targetUserId){
 if(!targetUserId) return null;
 const targetId=String(targetUserId);
 const followerQuery=supabaseClient.from('user_follows').select('follower_id',{count:'exact',head:true}).eq('following_id',targetUserId);
 const followingQuery=supabaseClient.from('user_follows').select('following_id',{count:'exact',head:true}).eq('follower_id',targetUserId);
 const requests=[followerQuery,followingQuery];
 if(currentUser && String(currentUser.id)!==targetId){
  requests.push(supabaseClient.from('user_follows').select('follower_id').eq('follower_id',currentUser.id).eq('following_id',targetUserId).maybeSingle());
 }
 const [followersResult,followingResult,relationshipResult]=await Promise.all(requests);
 if(followersResult.error) throw followersResult.error;
 if(followingResult.error) throw followingResult.error;
 if(relationshipResult?.error && relationshipResult.error.code!=='PGRST116') throw relationshipResult.error;
 const state={
  followers:Number(followersResult.count||0),
  following:Number(followingResult.count||0),
  isFollowing:Boolean(relationshipResult?.data)
 };
 followStates.set(targetId,state);
 if(state.isFollowing) follows.add(targetId); else follows.delete(targetId);
 if(String(currentUser?.id)===targetId){
  me.followers=state.followers;
  me.following=state.following;
  renderProfile();
 }else{
  const profile=users.find(item=>String(item.id)===targetId);
  if(profile){ profile.followers=state.followers; profile.following=state.following; }
  if(String(viewing)===targetId) renderOtherProfile();
 }
 return state;
}

async function loadFollowingStates(userIds){
 if(!currentUser) return;
 const ids=[...new Set(userIds.map(String).filter(id=>id!==String(currentUser.id)))];
 if(!ids.length) return;
 ids.forEach(id=>loadingFollowStates.add(id));
 try {
  const {data,error}=await supabaseClient.from('user_follows').select('following_id').eq('follower_id',currentUser.id).in('following_id',ids);
  if(error) throw error;
  const followingIds=new Set((data||[]).map(row=>String(row.following_id)));
  ids.forEach(id=>{
   const existing=followStates.get(id)||{followers:0,following:0,isFollowing:false};
   existing.isFollowing=followingIds.has(id);
   followStates.set(id,existing);
   if(existing.isFollowing) follows.add(id); else follows.delete(id);
  });
 } finally {
  ids.forEach(id=>loadingFollowStates.delete(id));
 }
}

function setAuthStatus(message, type='info'){ const el=document.getElementById('authStatus'); if(!el) return; el.textContent=message; el.className='auth-status '+type; }

function updateAuthUI(){
 const authButton=document.getElementById('authButton');
 const logoutButton=document.getElementById('logoutButton');
 const headerLogoutButton=document.getElementById('headerLogoutButton');
 const isLoggedIn=Boolean(currentUser);
 const displayName=isLoggedIn ? (currentProfile ? '@'+currentProfile : 'Account') : 'Log In';
 if(authButton){ authButton.textContent = displayName; authButton.style.display = isLoggedIn ? 'none' : 'inline-flex'; }
 if(logoutButton){ logoutButton.style.display = isLoggedIn ? 'block' : 'none'; }
 if(headerLogoutButton){ headerLogoutButton.style.display = isLoggedIn ? 'flex' : 'none'; }
 if(!isLoggedIn && document.getElementById('authModal') && document.getElementById('authModal').classList.contains('show')) {
   document.getElementById('authSubmitBtn').textContent = authMode === 'signup' ? 'Sign Up' : 'Log In';
 }
}

function openAuthModal(mode='login', preserveStatus=false){ authMode=mode; const modal=document.getElementById('authModal'); const subtitle=document.getElementById('authSubtitle'); const submitBtn=document.getElementById('authSubmitBtn'); const modeText=document.getElementById('authModeText'); const toggleBtn=document.getElementById('authToggleBtn'); const usernameField=document.getElementById('authUsername'); const emailField=document.getElementById('authEmail');
 if(subtitle){ subtitle.textContent = authMode === 'signup' ? 'Create your VYBE account' : 'Welcome back'; }
 if(submitBtn){ submitBtn.textContent = authMode === 'signup' ? 'Sign Up' : 'Log In'; }
 if(modeText){ modeText.textContent = authMode === 'signup' ? 'Already have an account?' : 'Need an account?'; }
 if(toggleBtn){ toggleBtn.textContent = authMode === 'signup' ? 'Log In' : 'Sign Up'; }
 if(usernameField){ usernameField.style.display = authMode === 'signup' ? 'block' : 'none'; }
 if(emailField){
   emailField.placeholder = authMode === 'signup' ? 'Email address' : 'Username or Email';
   emailField.setAttribute('autocomplete', authMode === 'signup' ? 'email' : 'username');
 }
 if(!preserveStatus){ setAuthStatus(''); }
 const email=document.getElementById('authEmail'); const password=document.getElementById('authPassword');
 if(email){email.value='';} if(password){password.value='';}
 if(usernameField){usernameField.value='';}
 if(modal){ modal.style.display=''; modal.classList.remove('hidden'); modal.classList.add('show'); }
}

function toggleAuthMode(){ authMode = authMode === 'login' ? 'signup' : 'login'; openAuthModal(authMode); }

function closeAuthModal(){
 document.querySelectorAll('.modal, .auth-overlay, .login-container, .signup-container, #loginContainer, #signupContainer').forEach(modal=>{
  modal.style.display='none';
  modal.classList.remove('show');
  modal.classList.add('hidden');
 });
}

function enterApp(user){
 if(!user) return;
 if(currentUser?.id !== user.id){
  closeDMDrawer();
  closeActivityDrawer();
  closeActivityRealtime();
  closeStoryViewer();
  currentProfile = null;
  hasCurrentProfile = false;
  currentAccountPrivate=false;
  me={id:user.id,name:'',username:'',bio:'',pic:avatar(),followers:0,following:0,statusNote:'',isPrivate:false};
  archivedReels=[];
  savedReels.clear();
  savedReelItems=[];
  pendingBookmarks.clear();
  savedBookmarksLoading=false;
  bookmarkLoadToken++;
  likedReels.clear();
  likedReelItems=[];
  follows.clear();
  followStates.clear();
  pendingFollows.clear();
  dmConversations=[];
  dmProfiles.clear();
  dmMessages=[];
  closeDMActionSheet();
  closeNoteActionSheet();
  if(dmVoiceRecorder?.state==='recording') dmVoiceRecorder.stop();
  else dmVoiceStream?.getTracks().forEach(track=>track.stop());
  dmVoiceStream=null;
  storyGroups=[];
  archivedOwnStories=[];
  profileHighlights=[];
  viewedStoryIds.clear();
  recordedStoryViewIds.clear();
  storyLikeCounts.clear();
  likedStoryIds.clear();
  pendingStoryLikes.clear();
  pendingStoryReplyMetadata=null;
  activityNotifications=[];
  activityRequestToken++;
  updateNotificationBadge();
  activeChat=null;
  loadingFollowStates.clear();
  saved.clear();
 }
 currentUser = user;
 rememberLoginAccount(user);
 const app=document.querySelector('.app');
 const main=document.querySelector('.main');
 const reelsPage=document.getElementById('reels');
 if(app){ app.style.display='flex'; app.classList.remove('hidden'); }
 if(main){ main.style.display='block'; main.classList.remove('hidden'); }
 if(reelsPage) reelsPage.classList.remove('hidden');
 document.querySelectorAll('.bottom, .sidebar').forEach(nav=>nav.classList.remove('hidden'));
 closeAuthModal();
 updateAuthUI();
 go('reels');
}

async function submitAuth(){
 const emailField=document.getElementById('authEmail');
 const email = authMode === 'signup' ? emailField?.value.trim() : emailField?.value.trim();
 const password=document.getElementById('authPassword')?.value;
 const username=document.getElementById('authUsername')?.value || '';
 const cleanedUsername = normalizeUsername(username);

 if(!email || !password){
   setAuthStatus('Please enter both email and password.', 'error');
   return;
 }
 if(password.length < 6){
   setAuthStatus('Password must be at least 6 characters long.', 'error');
   return;
 }
 if(authMode === 'signup'){
   if(!cleanedUsername){
     setAuthStatus('Username is required.', 'error');
     return;
   }
   const availability = await checkUsernameAvailable(cleanedUsername).catch(err => { throw err; });
   if(!availability.available){
     setAuthStatus(availability.error, 'error');
     return;
   }
 }

 setAuthStatus('Please wait...', 'info');

 try {
  if(authMode === 'signup'){
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { username: cleanedUsername } }
    });

    if (error) {
      setAuthStatus(error.message || 'Sign up failed.', 'error');
      return;
    }

    const userId = data?.user ? data.user.id : (crypto?.randomUUID ? crypto.randomUUID() : undefined);
    if (userId) {
      const { error: profileError } = await supabaseClient.from('profiles').upsert({
        id: userId,
        username: cleanedUsername,
        email: email.trim().toLowerCase()
      }, { onConflict: 'id' });
      if (profileError) {
        setAuthStatus(profileError.message || 'Profile creation failed.', 'error');
        return;
      }
      if(data?.session?.user?.id===userId){
        currentProfile=cleanedUsername;
        hasCurrentProfile=true;
        me.id=userId;
        me.username=currentProfile;
        updateAuthUI();
      }
    }

    const signupSuccessMessage = 'Sign up successful! Please check your email to verify, or Log In directly if email confirmation is disabled.';
    if(data?.session?.user || currentUser){
      enterApp(data?.session?.user || currentUser);
      toast('Sign up successful');
    }else{
      authMode = 'login';
      openAuthModal('login', true);
      setAuthStatus(signupSuccessMessage, 'success');
    }
    return;
  }

  const identifier = emailField?.value || '';
  const input = identifier.trim();
  let loginEmail = input;
  if (!input.includes('@')) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('email')
      .ilike('username', input)
      .maybeSingle();
    console.log("Found profile email:", data?.email);

    if (error || !data?.email) {
      setAuthStatus('Username not found. Please check your username or use Email.', 'error');
      return;
    }

    loginEmail = data.email;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email: loginEmail, password });
  if (error) {
    setAuthStatus(error.message || 'Login failed.', 'error');
    return;
  }

  const signedInUser = data?.user;
  if (!signedInUser) {
    setAuthStatus('Login succeeded but no user data was returned.', 'error');
    return;
  }

  enterApp(signedInUser);
  toast('Logged in successfully');
  void syncCurrentProfile().catch(error=>console.error('Profile sync error:', error));
 } catch (error) {
  setAuthStatus(error?.message || 'Authentication failed.', 'error');
 }
}

async function logoutUser(){
 const savedPostsKey=localSavedPostsKey(currentUser?.id);
 try {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
  if(savedPostsKey){
   try{localStorage.removeItem(savedPostsKey);}
   catch(storageError){console.error('Saved posts cleanup error:',storageError);toast('Signed out, but local saved-post data could not be cleared.');}
  }
  closeSettingsSheet();
  resetSignedOutState();
  toast('Logged out successfully');
 } catch (error) {
  toast(error?.message || 'Logout failed');
 }
}

function openSettingsSheet(){
 if(!currentUser){openAuthModal('login');return;}
 const sheet=document.getElementById('settingsSheet');
 if(!sheet) return;
 showSettingsHome();
 document.getElementById('privacySettingToggle').checked=currentAccountPrivate;
 document.getElementById('privacySettingLabel').textContent=currentAccountPrivate?'Private':'Public';
 document.getElementById('highQualityToggle').checked=highQualityUploads;
 updateDailyUsageLabel();
 settingsSheetPreviousOverflow=document.body.style.overflow;
 sheet.classList.add('open');
 sheet.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
}

function closeSettingsSheet(){
 const sheet=document.getElementById('settingsSheet');
 if(!sheet) return;
 sheet.classList.remove('open');
 sheet.setAttribute('aria-hidden','true');
 document.body.style.overflow=settingsSheetPreviousOverflow;
 settingsSheetPreviousOverflow='';
}

function showSettingsHome(){
 settingsSubviewName='';
 const home=document.getElementById('settingsHome');
 const subview=document.getElementById('settingsSubview');
 const back=document.getElementById('settingsBackButton');
 if(home) home.style.display='block';
 if(subview){subview.classList.remove('active');subview.innerHTML='';}
 if(back) back.style.display='none';
 document.getElementById('settingsSheetTitle').textContent='Settings';
}

function showSettingsSubview(name){
 const subview=document.getElementById('settingsSubview');
 if(!subview) return;
 settingsSubviewName=name;
 document.getElementById('settingsHome').style.display='none';
 document.getElementById('settingsBackButton').style.display='block';
 subview.classList.add('active');
 const title=name==='blocked'?'Blocked Accounts':name==='accounts'?'Accounts':name==='saved'?'Saved':name==='archive'?'Archive':'Your Activity';
 document.getElementById('settingsSheetTitle').textContent=title;
 if(name==='blocked'){
  void renderBlockedAccounts();
 }else if(name==='saved'){
  subview.innerHTML='<div id="savedSettingsGrid" class="grid"></div>';
  renderSaved();
  if(currentUser) void loadSavedReels();
 }else if(name==='archive'){
  renderArchivedCollection();
 }else if(name==='activity'){
  subview.innerHTML=`<div class="settings-version">Today you've spent <strong>${formatUsageTime(dailyAppUsageMs)}</strong> on VYBE.</div><p class="meta">Time is tracked locally on this device while the app is visible.</p>`;
 }else if(name==='accounts'){
  renderAccountSwitcher();
 }
}

function openSavedCollection(){
 showSettingsSubview('saved');
}

function openArchiveCollection(){
 showSettingsSubview('archive');
}

async function toggleAccountPrivacy(value){
 if(!currentUser) return;
 const next=value===undefined?!currentAccountPrivate:Boolean(value);
 try{
  const {error}=await supabaseClient.from('profiles').update({is_private:next}).eq('id',currentUser.id);
  if(error) throw error;
  currentAccountPrivate=next;
  me.isPrivate=next;
  document.getElementById('privacySettingToggle').checked=next;
  document.getElementById('privacySettingLabel').textContent=next?'Private':'Public';
  toast(`Account is now ${next?'private':'public'}`);
 }catch(error){
  console.error('Account privacy update error:',error);
  document.getElementById('privacySettingToggle').checked=currentAccountPrivate;
  toast(error?.message||'Unable to update account privacy.');
 }
}

function toggleHighQualityUploads(value){
 highQualityUploads=value===undefined?!highQualityUploads:Boolean(value);
 try{
  localStorage.setItem('vybe:high-quality-uploads',String(highQualityUploads));
  document.getElementById('highQualityToggle').checked=highQualityUploads;
  toast(highQualityUploads?'High quality uploads enabled':'Data-saving upload preference enabled');
 }catch(error){
  console.error('Upload quality preference save error:',error);
  highQualityUploads=!highQualityUploads;
  document.getElementById('highQualityToggle').checked=highQualityUploads;
  toast(error?.message||'Unable to save media quality preference.');
 }
}

async function renderBlockedAccounts(){
 const subview=document.getElementById('settingsSubview');
 if(!subview) return;
 subview.innerHTML='<div class="settings-subview-list"><p class="meta">Loading blocked accounts...</p></div>';
 if(!currentUser) return;
 try{
  let {data,error}=await supabaseClient.from('blocked_users').select('*,profiles!blocked_users_blocked_user_id_fkey(id,username,full_name,avatar_url,profile_avatar_url)').eq('user_id',currentUser.id);
  if(error){
   let fallback=await supabaseClient.from('blocked_users').select('*').eq('user_id',currentUser.id);
   if(fallback.error) fallback=await supabaseClient.from('blocked_users').select('*').eq('blocker_id',currentUser.id);
   if(fallback.error) throw fallback.error;
   data=fallback.data||[];
   const ids=[...new Set(data.map(row=>String(row.blocked_user_id||row.blocked_id||'')).filter(Boolean))];
   if(ids.length){
    const profiles=await supabaseClient.from('profiles').select('id,username,full_name,avatar_url,profile_avatar_url').in('id',ids);
    if(profiles.error) throw profiles.error;
    const byId=new Map((profiles.data||[]).map(profile=>[String(profile.id),profile]));
    data=data.map(row=>({...row,profiles:byId.get(String(row.blocked_user_id||row.blocked_id))||null}));
   }
  }
  if(settingsSubviewName!=='blocked') return;
  const rows=data||[];
  subview.innerHTML=`<button class="secondary settings-action" type="button" onclick="addBlockedAccount()">Block a username</button><div class="settings-subview-list">${rows.length?rows.map(row=>{
   const profile=Array.isArray(row.profiles)?row.profiles[0]:row.profiles;
   const blockedId=String(row.blocked_user_id||row.blocked_id||profile?.id||'');
   const username=profile?.username||'user';
   return `<div class="person"><img class="avatar" src="${safe(avatarSrc(profile?.avatar_url||profile?.profile_avatar_url))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""><span>@${safe(username)}</span><button class="secondary" type="button" onclick="unblockAccount('${safe(row.id||'')}','${safe(blockedId)}','${row.blocker_id?'blocker_id':'user_id'}','${row.blocked_id?'blocked_id':'blocked_user_id'}')">Unblock</button></div>`;
  }).join(''):'<p class="meta">No blocked accounts.</p>'}</div>`;
 }catch(error){
  console.error('Blocked accounts fetch error:',error);
  subview.innerHTML='<div class="settings-subview-list"><p class="meta">Could not load blocked accounts.</p></div>';
  toast(error?.message||'Unable to load blocked accounts.');
 }
}

async function addBlockedAccount(){
 if(!currentUser){openAuthModal('login');return;}
 const username=normalizeUsername(window.prompt('Enter the username to block:')||'');
 if(!username) return;
 try{
  const {data:profile,error:profileError}=await supabaseClient.from('profiles').select('id').eq('username',username).maybeSingle();
  if(profileError) throw profileError;
  if(!profile?.id) throw new Error(`Could not find @${username}.`);
  if(String(profile.id)===String(currentUser.id)) throw new Error('You cannot block your own account.');
  let result=await supabaseClient.from('blocked_users').insert({user_id:currentUser.id,blocked_user_id:profile.id});
  if(result.error) result=await supabaseClient.from('blocked_users').insert({blocker_id:currentUser.id,blocked_id:profile.id});
  if(result.error) throw result.error;
  await renderBlockedAccounts();
 }catch(error){
  console.error('Block account error:',error);
  toast(error?.message||'Unable to block this account.');
 }
}

async function unblockAccount(rowId,blockedId,ownerColumn='user_id',blockedColumn='blocked_user_id'){
 if(!currentUser) return;
 try{
  let query=supabaseClient.from('blocked_users').delete();
  if(rowId) query=query.eq('id',rowId).eq(ownerColumn,currentUser.id);
  else query=query.eq(ownerColumn,currentUser.id).eq(blockedColumn,blockedId);
  let {data,error}=await query.select('*').maybeSingle();
  if(error&&ownerColumn==='user_id'){
   const retry=await supabaseClient.from('blocked_users').delete().eq('blocker_id',currentUser.id).eq('blocked_id',blockedId).select('*').maybeSingle();
   data=retry.data;error=retry.error;
  }
  if(error) throw error;
  if(!data) throw new Error('The block record could not be found.');
  await renderBlockedAccounts();
 }catch(error){
  console.error('Unblock account error:',error);
  toast(error?.message||'Unable to unblock this account.');
 }
}

function rememberLoginAccount(user){
 if(!user?.id) return;
 try{
  const accounts=JSON.parse(localStorage.getItem(accountListKey)||'[]');
  const next=Array.isArray(accounts)?accounts.filter(item=>String(item.id)!==String(user.id)):[];
  next.unshift({id:String(user.id),email:user.email||'',username:user.user_metadata?.username||'',lastUsedAt:Date.now()});
  localStorage.setItem(accountListKey,JSON.stringify(next.slice(0,8)));
 }catch(error){console.error('Account list save error:',error);}
}

function openAccountSwitcher(){
 if(!document.getElementById('settingsSheet')?.classList.contains('open')) openSettingsSheet();
 showSettingsSubview('accounts');
}

function renderAccountSwitcher(){
 const subview=document.getElementById('settingsSubview');
 if(!subview) return;
 let accounts=[];
 try{const parsed=JSON.parse(localStorage.getItem(accountListKey)||'[]');if(Array.isArray(parsed))accounts=parsed;}catch(error){console.error('Account list read error:',error);}
 subview.innerHTML=`<div class="settings-subview-list">${accounts.map(account=>`<button class="secondary" type="button" onclick="beginAccountSwitch(${safe(JSON.stringify(account.email||''))})">${safe(account.email||account.username||'Saved account')}${String(account.id)===String(currentUser?.id)?' · Current':''}</button>`).join('')||'<p class="meta">No saved account details.</p>'}<button class="primary" type="button" onclick="beginAccountSwitch('')">+ Add Account</button></div><p class="meta">For your security, switching accounts requires signing in again.</p>`;
}

function beginAccountSwitch(email){
 closeSettingsSheet();
 openAuthModal('login');
 const field=document.getElementById('authEmail');
 if(field) field.value=email||'';
 document.getElementById('authPassword')?.focus();
}

function formatUsageTime(milliseconds){
 const minutes=Math.floor(Math.max(0,milliseconds)/60000);
 const hours=Math.floor(minutes/60);
 return hours?`${hours}h ${minutes%60}m`:`${minutes} min`;
}

function updateDailyUsageLabel(){
 const label=document.getElementById('dailyTimeSpent');
 if(label) label.textContent=`Today: ${formatUsageTime(dailyAppUsageMs)}`;
}

window.setInterval(()=>{
 const now=Date.now();
 if(!document.hidden&&now-appVisibleSince<60000){
  dailyAppUsageMs+=now-appVisibleSince;
  try{localStorage.setItem(dailyAppUsageKey,String(dailyAppUsageMs));}
  catch(error){console.error('Daily usage save error:',error);}
  updateDailyUsageLabel();
 }
 appVisibleSince=now;
},15000);
document.addEventListener('visibilitychange',()=>{appVisibleSince=Date.now();});

async function clearCachedMedia(){
 if(!('caches' in window)){
  toast('Cached media clearing is not supported in this browser.');
  return;
 }
 try{
  const cacheNames=await caches.keys();
  let removed=0;
  for(const name of cacheNames){
   const cache=await caches.open(name);
   const requests=await cache.keys();
   for(const request of requests){
    const response=await cache.match(request);
    const contentType=response?.headers.get('content-type')||'';
    const url=new URL(request.url,location.href);
    if(/^(image|video|audio)\//i.test(contentType)||/\.(avif|bmp|gif|jpe?g|png|svg|webp|mp3|m4a|ogg|wav|mp4|m4v|mov|webm|mkv)(?:$|[?#])/i.test(url.href)){
     if(await cache.delete(request)) removed++;
    }
   }
  }
  toast(removed?`Cleared ${removed} cached media item${removed===1?'':'s'}.`:'No cached media to clear.');
 }catch(error){
  console.error('Clear cached media error:',error);
  toast(error?.message||'Unable to clear cached media.');
 }
}

function resetSignedOutState(){
 closeCommentsDrawer();
 closeDMDrawer();
 closeActivityDrawer();
 closeActivityRealtime();
 closeStoryViewer();
 currentUser=null;
 currentProfile=null;
 hasCurrentProfile=false;
 homeFeedMode='forYou';
 exploreHashtagQuery='';
 me={id:0,name:'',username:'',bio:'',pic:avatar(),followers:0,following:0,statusNote:'',isPrivate:false};
 reels=[];
 archivedReels=[];
 savedReels.clear();
 savedReelItems=[];
 pendingBookmarks.clear();
 savedBookmarksLoading=false;
 bookmarkLoadToken++;
 likedReels.clear();
 likedReelItems=[];
 pendingReelLikes.clear();
 follows.clear();
 followStates.clear();
 pendingFollows.clear();
 loadingFollowStates.clear();
 saved.clear();
 chats={};
 dmConversations=[];
 dmProfiles.clear();
 dmMessages=[];
 storyGroups=[];
 archivedOwnStories=[];
 profileHighlights=[];
 viewedStoryIds.clear();
 recordedStoryViewIds.clear();
 storyLikeCounts.clear();
 likedStoryIds.clear();
 pendingStoryLikes.clear();
 pendingStoryReplyMetadata=null;
 activityNotifications=[];
 activityRequestToken++;
 updateNotificationBadge();
 activeChat=null;
 notifications=[];
 activeChat=null;
 viewing=null;
 profileTab='posts';
 searchTerm='';
 clearTimeout(searchDebounceTimer);
 searchRequestToken++;
 searchedProfiles.clear();
 const searchInput=document.getElementById('topSearchInput');
 if(searchInput) searchInput.value='';
 posts.forEach(post=>{post.liked=false;});
 closeAuthModal();
 updateAuthUI();
 renderStories();
 renderFeed();
 renderReels();
 renderExplore();
 renderSaved();
 renderProfile();
 document.querySelectorAll('.page').forEach(page=>page.classList.remove('active'));
 document.getElementById('reels')?.classList.add('active');
 openAuthModal('login');
}

window.supabaseClient.auth.onAuthStateChange((event, session)=>{
 if(event==='INITIAL_SESSION' || !authInitialized) return;
 if(session?.user){
  enterApp(session.user);
  void syncCurrentProfile().catch(error=>console.error('Profile sync error:', error));
  void loadReels();
  void loadSavedReels();
  void loadStories();
  subscribeToActivityNotifications();
  void loadActivityNotifications();
 } else {
  resetSignedOutState();
 }
 if (event === 'SIGNED_OUT') {
  setAuthStatus('');
 }
});

function hide(id){const el=document.getElementById(id); if(el){ el.classList.remove('show'); el.classList.add('hidden'); el.style.display='none'; if(id==='postModal')el.classList.remove('saved-fullscreen'); }}
function show(id){const el=document.getElementById(id); if(el){ el.style.display=''; el.classList.remove('hidden'); el.classList.add('show'); }}

function uName(u){return u?.username || (currentUser && String(u?.id)===String(currentUser.id) ? currentProfile || me.username : 'user')}
function user(id){
 if(id===0 || (currentUser && String(id)===String(currentUser.id))) return me;
 return users.find(x=>String(x.id)===String(id)) || {id,name:'VYBE user',username:'user',pic:avatar(),bio:'',followers:0,following:0};
}
function note(s){notifications.unshift(s);renderNotifications()}
function toast(s){
 let t=document.getElementById('toast');t.textContent=s;t.style.display='block';
 clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>t.style.display='none',2200);
}
function go(id){
 if(id==='messages'){openDMDrawer();return;}
 if(id==='notifications'){openActivityDrawer();return;}
 if(id==='saved'){
  if(!currentUser){openAuthModal('login');return;}
  openSettingsSheet();
  openSavedCollection();
  return;
 }
 const blockedPages = ['reels','home','saved','notifications','profile'];
 if (blockedPages.includes(id) && !currentUser) {
   openAuthModal('login');
   return;
 }
 document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
 document.getElementById(id)?.classList.add('active');
 if(id!=='reels') pauseReelVideos();
 if(id!=='home') syncFeedVideoPlayback();
 document.querySelectorAll('.nav,.bottom button').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.nav').forEach(x=>{if(x.dataset.page===id)x.classList.add('active')});
 let map={reels:0,home:1,explore:2,profile:4};
 const activeNav=id==='searchResults'||id==='other'?'explore':id;
 if(map[activeNav]!==undefined)document.querySelectorAll('.bottom button')[map[activeNav]]?.classList.add('active');
 if(id==='reels'){ void loadReelLikes(); startVisibleReel(); }
 if(id==='home')renderFeed();
 if(id==='profile'){
  renderProfile();
  if(currentUser) void loadFollowData(currentUser.id).catch(error=>{console.error('Own profile follow count error:',error);toast(error?.message||'Unable to load follow counts.');});
 }
 if(id==='explore'){renderExplore();void loadExploreFeed();}
 if(id==='searchResults')renderSearchResults();
 if(id==='saved'){renderSaved();if(currentUser)void loadSavedReels();}
 if(id==='notifications')renderNotifications();
}
async function viewProfile(id){
 if(id===0 || (currentUser && String(id)===String(currentUser.id))){go('profile');return}
 viewing=String(id);profileTab="posts";
 renderOtherProfile();go('other');
 if(isValidUserUuid(String(id))){
  try{
   const [profRes, reelsRes] = await Promise.all([
    supabaseClient.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabaseClient.from('reels').select('*').eq('user_id', id).order('created_at', {ascending:false})
   ]);
   if(profRes.data){
    const p = profRes.data;
    const uname = p.username || String(p.id).slice(0,8);
    const fullUser = {
     id: p.id,
     name: p.full_name || p.display_name || p.name || uname,
     username: uname,
     pic: p.avatar_url || p.profile_avatar_url || avatarPlaceholder,
     bio: p.bio || '',
     created_at: p.created_at || '',
     followers: 0,
     following: 0
    };
    users = users.filter(u => String(u.id) !== String(p.id));
    users.push(fullUser);
   }
   if(reelsRes.data){
    const userReels = reelsRes.data.map(normalizeReel).filter(isPublicActiveReel);
    const existingIds = new Set(reels.map(r => String(r.id)));
    userReels.forEach(r => {
     if(!existingIds.has(String(r.id))) reels.push(r);
    });
   }
   renderOtherProfile();
  }catch(err){
   console.error('Other profile fetch error:', err);
  }
 }
 void loadFollowData(id).catch(error=>{console.error('Profile follow count error:',error);});
}
function openSearchedProfile(id){
 const match=searchedProfiles.get(String(id));
 if(!match) return;
 users=users.filter(existing=>String(existing.id)!==String(match.id));
 users.push(match);
 clearSearchSuggestions({clearInput:true});
 viewProfile(match.id);
}
function openCreate(){
 if (!currentUser) {
   openAuthModal('login');
   return;
 }
 setCreateStatus('');
 show('createModal');
}

function setCreateAspect(aspect){
 const options=['square','portrait','full'];
 if(!options.includes(aspect)) return;
 createAspectRatio=aspect;
 const preview=document.getElementById('mediaPreview');
 if(preview) preview.dataset.aspect=aspect;
 document.querySelectorAll('[data-aspect-choice]').forEach(button=>button.classList.toggle('active',button.dataset.aspectChoice===aspect));
}

function openCameraView(){
 if(!currentUser){openAuthModal('login');return;}
 if(!navigator.mediaDevices?.getUserMedia){
  toast('Camera access is not available in this browser.');
  return;
 }
 void startCameraView();
}

async function startCameraView(){
 const overlay=document.getElementById('cameraOverlay');
 const livePreview=document.getElementById('cameraLivePreview');
 if(!overlay||!livePreview) return;
 try{
  cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:true});
  livePreview.srcObject=cameraStream;
  livePreview.hidden=false;
  document.getElementById('cameraCapturePreview').hidden=true;
  document.getElementById('cameraReviewPreview').hidden=true;
  document.getElementById('cameraCaptureControls').hidden=false;
  document.getElementById('cameraConfirmActions').hidden=true;
  document.getElementById('cameraStatus').textContent='Take a photo or record a short clip.';
  cameraPreviousOverflow=document.body.style.overflow;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
 }catch(error){
  console.error('Camera access error:',error);
  toast(error?.name==='NotAllowedError'?'Allow camera and microphone access to use the camera.':error?.message||'Unable to open the camera.');
 }
}

function releaseCameraStream(){
 if(cameraRecordTimer){clearTimeout(cameraRecordTimer);cameraRecordTimer=null;}
 if(cameraRecorder&&cameraRecorder.state!=='inactive'){
  try{cameraRecorder.stop();}catch(error){console.error('Camera recorder stop error:',error);}
 }
 cameraRecorder=null;
 cameraChunks=[];
 cameraStream?.getTracks().forEach(track=>track.stop());
 cameraStream=null;
 const livePreview=document.getElementById('cameraLivePreview');
 if(livePreview) livePreview.srcObject=null;
}

function closeCameraView(){
 releaseCameraStream();
 const overlay=document.getElementById('cameraOverlay');
 overlay?.classList.remove('open');
 overlay?.setAttribute('aria-hidden','true');
 document.body.style.overflow=cameraPreviousOverflow;
 cameraPreviousOverflow='';
 cameraCaptureFile=null;
 if(cameraCaptureUrl){URL.revokeObjectURL(cameraCaptureUrl);cameraCaptureUrl=null;}
 const preview=document.getElementById('cameraCapturePreview');
 const review=document.getElementById('cameraReviewPreview');
 if(preview){preview.hidden=true;preview.removeAttribute('src');}
 if(review){review.pause();review.hidden=true;review.removeAttribute('src');}
}

function showCameraCapture(file){
 cameraCaptureFile=file;
 if(cameraCaptureUrl) URL.revokeObjectURL(cameraCaptureUrl);
 cameraCaptureUrl=URL.createObjectURL(file);
 const livePreview=document.getElementById('cameraLivePreview');
 const imagePreview=document.getElementById('cameraCapturePreview');
 const videoPreview=document.getElementById('cameraReviewPreview');
 const isVideo=isVideoFile(file);
 livePreview.hidden=true;
 imagePreview.hidden=isVideo;
 videoPreview.hidden=!isVideo;
 if(isVideo){videoPreview.src=cameraCaptureUrl;videoPreview.controls=true;void videoPreview.play().catch(error=>console.info('Captured video preview playback was blocked:',error));}
 else{imagePreview.src=cameraCaptureUrl;}
 document.getElementById('cameraCaptureControls').hidden=true;
 document.getElementById('cameraConfirmActions').hidden=false;
 document.getElementById('cameraStatus').textContent=isVideo?'Video ready. Choose where to share it.':'Photo ready. Choose where to share it.';
}

function captureCameraPhoto(){
 const video=document.getElementById('cameraLivePreview');
 if(!cameraStream||!video||!video.videoWidth||!video.videoHeight){toast('The camera is not ready yet.');return;}
 const canvas=document.createElement('canvas');
 canvas.width=video.videoWidth;
 canvas.height=video.videoHeight;
 canvas.getContext('2d')?.drawImage(video,0,0,canvas.width,canvas.height);
 canvas.toBlob(blob=>{
  if(!blob){toast('Could not capture a photo. Please try again.');return;}
  showCameraCapture(new File([blob],`vybe-photo-${Date.now()}.jpg`,{type:'image/jpeg',lastModified:Date.now()}));
 },'image/jpeg',.92);
}

function toggleCameraRecording(){
 if(cameraRecorder?.state==='recording'){
  cameraRecorder.stop();
  return;
 }
 if(!cameraStream||typeof MediaRecorder==='undefined'){
  toast('Video recording is not supported in this browser.');
  return;
 }
 const mimeType=['video/mp4;codecs=h264,aac','video/mp4','video/webm;codecs=vp8,opus','video/webm'].find(type=>MediaRecorder.isTypeSupported?.(type));
 try{
  cameraChunks=[];
  cameraRecorder=new MediaRecorder(cameraStream,mimeType?{mimeType}:undefined);
  cameraRecorder.addEventListener('dataavailable',event=>{if(event.data?.size)cameraChunks.push(event.data);});
  cameraRecorder.addEventListener('stop',()=>{
   if(cameraRecordTimer){clearTimeout(cameraRecordTimer);cameraRecordTimer=null;}
   const recordButton=document.getElementById('cameraRecordButton');
   recordButton?.classList.remove('recording');
   if(recordButton) recordButton.textContent='Record video';
   if(!document.getElementById('cameraOverlay')?.classList.contains('open')){cameraChunks=[];return;}
   const type=cameraRecorder?.mimeType||mimeType||'video/webm';
   if(!cameraChunks.length){document.getElementById('cameraStatus').textContent='No video was recorded. Try again.';return;}
   const extension=type.includes('mp4')?'mp4':'webm';
   showCameraCapture(new File([new Blob(cameraChunks,{type})],`vybe-clip-${Date.now()}.${extension}`,{type,lastModified:Date.now()}));
   cameraChunks=[];
  },{once:true});
  cameraRecorder.start();
  document.querySelector('.camera-shutter').disabled=true;
  document.getElementById('cameraRecordButton').classList.add('recording');
  document.getElementById('cameraRecordButton').textContent='Stop recording';
  document.getElementById('cameraStatus').textContent='Recording… maximum 15 seconds.';
  cameraRecordTimer=setTimeout(()=>{if(cameraRecorder?.state==='recording')cameraRecorder.stop();},15000);
 }catch(error){
  document.querySelector('.camera-shutter').disabled=false;
  console.error('Camera recording error:',error);
  toast(error?.message||'Unable to start video recording.');
 }
}

function retakeCameraCapture(){
 cameraCaptureFile=null;
 if(cameraCaptureUrl){URL.revokeObjectURL(cameraCaptureUrl);cameraCaptureUrl=null;}
 const image=document.getElementById('cameraCapturePreview');
 const video=document.getElementById('cameraReviewPreview');
 image.hidden=true;image.removeAttribute('src');
 video.pause();video.hidden=true;video.removeAttribute('src');
 document.getElementById('cameraLivePreview').hidden=false;
 document.getElementById('cameraCaptureControls').hidden=false;
 document.getElementById('cameraConfirmActions').hidden=true;
 document.querySelector('.camera-shutter').disabled=false;
 const recordButton=document.getElementById('cameraRecordButton');
 recordButton.classList.remove('recording');recordButton.textContent='Record video';
 document.getElementById('cameraStatus').textContent='Take a photo or record a short clip.';
}

function assignFileToInput(input,file){
 if(!input||!file) throw new Error('The captured media is not available.');
 const transfer=new DataTransfer();
 transfer.items.add(file);
 input.files=transfer.files;
 input.dispatchEvent(new Event('change',{bubbles:true}));
}

function useCameraCapture(target){
 if(!cameraCaptureFile){toast('Capture a photo or video first.');return;}
 const capturedFile=cameraCaptureFile;
 closeCameraView();
 try{
  if(target==='story'){
   hide('createModal');
   assignFileToInput(storyUploadInput,capturedFile);
  }else{
   show('createModal');
   assignFileToInput(mediaUploadInput,capturedFile);
  }
 }catch(error){
  console.error('Captured media handoff error:',error);
  toast(error?.message||'Unable to use the captured media.');
 }
}
function editProfile(){
 const userInput=document.getElementById('uname');
 const nameInput=document.getElementById('name');
 const bioInput=document.getElementById('bio');
 if(userInput){ userInput.value=currentProfile||me.username||''; userInput.readOnly=false; }
 if(nameInput) nameInput.value=me.name || '';
 if(bioInput) bioInput.value=me.bio || '';
 const photoInput=document.getElementById('pic');
 if(photoInput) photoInput.value='';
 show('editModal');
}

function isVideoFile(file){
 return Boolean(file && (file.type?.startsWith('video/') || /\.(mp4|webm|ogg|m4v|mov|mkv|3gp)$/i.test(file.name)));
}

function isImageFile(file){
 return Boolean(file && (file.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)$/i.test(file.name)));
}

const mediaUploadInput = document.getElementById('mediaUploadInput');
if (mediaUploadInput) {
  mediaUploadInput.addEventListener('change', function(){
    const picked = this.files && this.files[0];
    if (!picked) return;
    const video=isVideoFile(picked);
    if (!video && !isImageFile(picked)) {
      toast('Please choose an image or video.');
      this.value='';
      return;
    }
    if(mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    mediaPreviewUrl=URL.createObjectURL(picked);
    const preview=document.getElementById('mediaPreview');
    if(!preview) return;
    preview.dataset.aspect=createAspectRatio;
    preview.style.aspectRatio='auto';
    const media=document.createElement(video ? 'video' : 'img');
    media.src=mediaPreviewUrl;
    const applyNaturalDimensions=()=>{
      const width=video?media.videoWidth:media.naturalWidth;
      const height=video?media.videoHeight:media.naturalHeight;
      if(width>0&&height>0) preview.style.aspectRatio=`${width} / ${height}`;
      media.style.width='100%';
      media.style.height='auto';
      media.style.maxHeight='62vh';
      media.style.objectFit='contain';
    };
    if(video){
      media.controls=true;
      media.playsInline=true;
      media.addEventListener('loadedmetadata',applyNaturalDimensions,{once:true});
    }else{
      media.alt='Selected media preview';
      media.addEventListener('load',applyNaturalDimensions,{once:true});
    }
    preview.replaceChildren(media);
    setCreateStatus('');
    document.getElementById('caption')?.focus();
  });
}

const storyUploadInput=document.getElementById('storyUploadInput');
storyUploadInput?.addEventListener('change',function(){
 const file=this.files?.[0];
 if(!file) return;
 if(!currentUser){this.value='';openAuthModal('login');return;}
 if(storyUploading) return;
 const isMp4=file.type==='video/mp4'||/\.mp4$/i.test(file.name);
 const isStoryVideo=isMp4||file.type==='video/webm'||/\.webm$/i.test(file.name);
 const isImage=isImageFile(file);
 if(!isImage&&!isStoryVideo){
  this.value='';toast('Choose an image or MP4/WebM video for your story.');
  return;
 }
 openStoryAudience(file);
});

async function openStoryAudience(file){
 pendingStoryAudienceFile=file;
 const modal=document.getElementById('storyAudienceModal');
 const preview=document.getElementById('storyAudiencePreview');
 const list=document.getElementById('storyAudienceFollowerList');
 if(!modal||!preview||!list) return;
 if(modal.dataset.previewUrl) URL.revokeObjectURL(modal.dataset.previewUrl);
 const url=URL.createObjectURL(file);
 preview.innerHTML=isVideoFile(file)?`<video src="${safe(url)}" controls muted playsinline style="width:100%;max-height:30vh;object-fit:contain"></video>`:`<img src="${safe(url)}" alt="Story preview" style="width:100%;max-height:30vh;object-fit:contain">`;
 modal.dataset.previewUrl=url;
 document.querySelector('input[name="storyAudience"][value="public"]').checked=true;
 list.hidden=true;
 list.innerHTML='<div class="meta">Loading your followers...</div>';
 storyAudiencePreviousOverflow=document.body.style.overflow;
 show('storyAudienceModal');
 modal.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 try{
  const {data:followRows,error:followError}=await supabaseClient.from('user_follows').select('follower_id').eq('following_id',currentUser.id);
  if(followError) throw followError;
  const followerIds=[...new Set((followRows||[]).map(row=>String(row.follower_id)).filter(id=>id!==String(currentUser.id)))];
  if(!followerIds.length){list.innerHTML='<div class="meta">No followers are available to select.</div>';return;}
  const {data:profiles,error:profileError}=await supabaseClient.from('profiles').select('id,username,full_name,display_name,avatar_url,profile_avatar_url').in('id',followerIds);
  if(profileError) throw profileError;
  list.innerHTML=(profiles||[]).map(profile=>`<label><input type="checkbox" value="${safe(profile.id)}"><img src="${safe(avatarSrc(profile.avatar_url||profile.profile_avatar_url))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""><span>${safe(profile.full_name||profile.display_name||profile.username||'VYBE user')} <small>@${safe(profile.username||'user')}</small></span></label>`).join('')||'<div class="meta">No follower profiles are available to select.</div>';
 }catch(error){
  console.error('Story audience followers error:',error);
  list.innerHTML='<div class="meta">Followers could not be loaded. Please try again.</div>';
  toast(error?.message||'Unable to load story audience.');
 }
}

function toggleStoryAudienceOptions(){
 const audience=document.querySelector('input[name="storyAudience"]:checked')?.value;
 const list=document.getElementById('storyAudienceFollowerList');
 if(list) list.hidden=audience!=='close_friends';
}

function cancelStoryAudience(){
 const modal=document.getElementById('storyAudienceModal');
 const url=modal?.dataset.previewUrl;
 if(url) URL.revokeObjectURL(url);
 if(modal){hide('storyAudienceModal');modal.setAttribute('aria-hidden','true');}
 document.body.style.overflow=storyAudiencePreviousOverflow;
 storyAudiencePreviousOverflow='';
 pendingStoryAudienceFile=null;
 if(storyUploadInput) storyUploadInput.value='';
}

async function confirmStoryAudience(){
 const file=pendingStoryAudienceFile;
 if(!file||!currentUser)return;
 const audience=document.querySelector('input[name="storyAudience"]:checked')?.value||'public';
 const selectedIds=[...document.querySelectorAll('#storyAudienceFollowerList input:checked')].map(input=>input.value);
 if(audience==='close_friends'&&!selectedIds.length){toast('Select at least one follower for a private story.');return;}
 await uploadStoryFile(file,audience,selectedIds);
}

async function uploadStoryFile(file,audience='public',audienceUserIds=[]){
 if(storyUploading)return;
 const isMp4=file.type==='video/mp4'||/\.mp4$/i.test(file.name);
 storyUploading=true;
 const shareButton=document.querySelector('#storyAudienceModal .primary');
 if(shareButton)shareButton.disabled=true;
 let uploadedStoryPath=null;
 let storyInserted=false;
 try {
  const extension=(file.name.match(/\.([a-z0-9]{1,10})$/i)?.[1]||(file.type.split('/')[1]||'bin').replace(/[^a-z0-9]/gi,'')).toLowerCase();
  const uniqueId=window.crypto?.randomUUID?.()||Math.random().toString(36).slice(2,14);
  const filePath=`${currentUser.id}/stories/${Date.now()}_${uniqueId}.${extension||'bin'}`;
  const mediaUrl = await uploadToCloudinary(file);
  uploadedStoryPath = mediaUrl;
  if(!mediaUrl) throw new Error('Could not get a public URL for your story.');
  const expiresAt=new Date(Date.now()+24*60*60*1000).toISOString();
  const storyPayload={user_id:currentUser.id,media_url:mediaUrl,expires_at:expiresAt};
  if(audience==='close_friends'){
   storyPayload.audience='close_friends';
   storyPayload.audience_user_ids=audienceUserIds;
  }
  const {data:story,error:insertError}=await supabaseClient.from('stories')
   .insert(storyPayload)
   .select('*').single();
  if(insertError) throw insertError;
  storyInserted=true;
  const createdStory={
   ...(story||{}),
   id:story?.id||`${currentUser.id}-${Date.now()}`,
   user_id:currentUser.id,
   media_url:story?.media_url||mediaUrl,
   media_type:story?.media_type||file.type||(isMp4?'video/mp4':'image/unknown'),
   audience:story?.audience||audience,
   audience_user_ids:story?.audience_user_ids||audienceUserIds,
   expires_at:story?.expires_at||expiresAt,
   created_at:story?.created_at||new Date().toISOString()
  };
  const existingIndex=storyGroups.findIndex(group=>group.userId===String(currentUser.id));
  archivedOwnStories=[createdStory,...archivedOwnStories.filter(item=>String(item.id)!==String(createdStory.id))];
  if(existingIndex>=0) storyGroups[existingIndex].stories.unshift(createdStory);
  else storyGroups.push({userId:String(currentUser.id),profile:{id:currentUser.id,name:me.name||currentProfile||'You',username:currentProfile||me.username||'user',pic:me.pic},stories:[createdStory]});
  renderStories();
  cancelStoryAudience();
  toast('Your story was shared');
  openOwnStory();
 } catch(error) {
  console.error('Story upload error:',error);
  if(uploadedStoryPath&&!storyInserted){
    try{
     const {error:cleanupError}=await supabaseClient.storage.from('stories').remove([uploadedStoryPath]);
     if(cleanupError) console.error('Failed to clean up incomplete story upload:',cleanupError);
    }catch(cleanupError){console.error('Failed to clean up incomplete story upload:',cleanupError);}
  }
  toast(error?.message||'Unable to upload your story.');
 } finally {
  storyUploading=false;
  if(shareButton)shareButton.disabled=false;
  if(storyUploadInput) storyUploadInput.value='';
 }
}

function setCreateStatus(message, type='info'){
 const status=document.getElementById('createStatus');
 if(status){ status.textContent=message; status.className='auth-status'+(type ? ' '+type : ''); }
}

function cancelCreate(){
 if(creatingPost){toast('Your post is still uploading.');return;}
 const input=document.getElementById('mediaUploadInput');
 if(input) input.value='';
 const caption=document.getElementById('caption');
 if(caption) caption.value='';
 const preview=document.getElementById('mediaPreview');
 if(preview){preview.dataset.aspect='square';preview.style.aspectRatio='auto';preview.innerHTML='<div class="media-preview-empty"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="m21 15-5-5L5 21"></path></svg><span>Select a photo or video to preview it here</span></div>';}
 setCreateAspect('square');
 if(mediaPreviewUrl){ URL.revokeObjectURL(mediaPreviewUrl); mediaPreviewUrl=null; }
 setCreateStatus('');
 const shareButton=document.getElementById('sharePostButton');
 if(shareButton) shareButton.disabled=false;
 document.querySelectorAll('#cancelPostButton, #cancelPostCloseButton').forEach(button=>button.disabled=false);
 const spinner=document.getElementById('uploadSpinner');
 if(spinner) spinner.classList.add('hidden');
 const uploadProgress=document.getElementById('uploadProgress');
 if(uploadProgress) uploadProgress.hidden=true;
 const progressFill=document.getElementById('uploadProgressFill');
 if(progressFill) progressFill.style.width='0%';
 const progressPercent=document.getElementById('uploadProgressPercent');
 if(progressPercent) progressPercent.textContent='0%';
 const label=document.getElementById('sharePostLabel');
 if(label) label.textContent='Share / Post';
 hide('createModal');
}

// STORIES
function renderStories(){
 const storyWrap=document.getElementById('stories');
 if(!storyWrap) return;
 const ownStory=storyGroups.find(group=>group.userId===String(currentUser?.id)&&!group.isHighlightPlayback);
 const ownUnviewed=Boolean(ownStory?.stories.some(story=>!viewedStoryIds.has(String(story.id))));
 const groups=storyGroups.filter(group=>group.userId!==String(currentUser?.id)&&!group.isHighlightPlayback);
 storyWrap.innerHTML=`
  <div class="story ${ownStory?'has-story':''} ${ownUnviewed?'has-unviewed':''}">
   <div class="story-avatar-button" role="button" tabindex="0" onclick="${ownStory?'openOwnStory()':'pickStoryUpload()'}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();${ownStory?'openOwnStory()':'pickStoryUpload()'}}" aria-label="${ownStory?'View your story':'Add to your story'}">
    <span class="story-avatar-wrap">
     <img src="${safe(avatarSrc(me.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt="">
     <button class="story-plus" type="button" aria-label="Add another story" onclick="event.stopPropagation();pickStoryUpload()">+</button>
    </span>
   </div>
   <small>Your Story</small>
  </div>
  ${groups.map(group=>{
   const groupIndex=storyGroups.indexOf(group);
   const unviewed=group.stories.some(story=>!viewedStoryIds.has(String(story.id)));
   return `<div class="story ${unviewed?'has-unviewed':''}">
    <button class="story-avatar-button" type="button" onclick="openStoryViewer(${groupIndex})" aria-label="View @${safe(group.profile.username)}'s story">
     <span class="story-avatar-wrap"><img src="${safe(avatarSrc(group.profile.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""></span>
    </button>
    <small>${safe(group.profile.username||group.profile.name||'user')}</small>
   </div>`;
  }).join('')}`;
}

function openOwnStory(){
 const ownIndex=storyGroups.findIndex(group=>group.userId===String(currentUser?.id));
 if(ownIndex<0){pickStoryUpload();return;}
 openStoryViewer(ownIndex);
}

function pickStoryUpload(){
 if(!currentUser){openAuthModal('login');return;}
 storyUploadInput?.click();
}

function storyMediaUrl(story){
 return story.media_url||story.video_url||story.image_url||story.media_path||'';
}

function storyIsVideo(story,url){
 return String(story.media_type||story.mime_type||'').startsWith('video/')||Boolean(story.video_url)||isVideoFile({type:'',name:String(url).split('?')[0]});
}

function storyTimeAgo(value){
 const timestamp=value?new Date(value).getTime():Date.now();
 if(!Number.isFinite(timestamp)) return 'now';
 const minutes=Math.max(0,Math.floor((Date.now()-timestamp)/60000));
 if(minutes<1) return 'now';
 if(minutes<60) return `${minutes}m`;
 const hours=Math.floor(minutes/60);
 if(hours<24) return `${hours}h`;
 return `${Math.floor(hours/24)}d`;
}

async function loadStories(){
 if(!currentUser){storyGroups=[];archivedOwnStories=[];profileHighlights=[];renderStories();renderProfile();return false;}
 const userId=String(currentUser.id);
 try {
  const [storiesResult,followingResult]=await Promise.all([
   supabaseClient.from('stories').select('*').order('created_at',{ascending:false}),
   supabaseClient.from('user_follows').select('following_id').eq('follower_id',userId)
  ]);
  if(storiesResult.error) throw storiesResult.error;
  archivedOwnStories=(storiesResult.data||[])
   .filter(story=>String(story.user_id)===userId&&Boolean(storyMediaUrl(story)))
   .map(story=>({...story,media_url:storyMediaUrl(story)}));
  try{
   const rawHighlights=localStorage.getItem(storyHighlightsStorageKey(userId));
   const parsed=rawHighlights?JSON.parse(rawHighlights):[];
   profileHighlights=Array.isArray(parsed)?parsed.filter(item=>item&&typeof item.title==='string'&&Array.isArray(item.storyIds)).map(item=>({id:String(item.id||''),title:item.title.slice(0,24),storyIds:item.storyIds.map(String)})):[];
  }catch(error){
   console.error('Profile highlights data parse error:',error);
   profileHighlights=[];
   toast('Saved highlights could not be read.');
  }
  const followingIds=new Set((followingResult.data||[]).map(row=>String(row.following_id)));
  if(followingResult.error) console.error('Story following list error:',followingResult.error);
  const cutoff=Date.now()-24*60*60*1000;
  const active=(storiesResult.data||[]).filter(story=>{
   const mediaUrl=storyMediaUrl(story);
   const createdAt=new Date(story.created_at||0).getTime();
   const expiresAt=story.expires_at?new Date(story.expires_at).getTime():null;
   const audience=String(story.audience||'public');
   const audienceUsers=Array.isArray(story.audience_user_ids)?story.audience_user_ids.map(String):[];
   const canView=audience!=='close_friends'||String(story.user_id)===userId||audienceUsers.includes(userId);
   return canView&&Boolean(story.user_id&&mediaUrl)&&(!Number.isFinite(createdAt)||createdAt>=cutoff)&&(!expiresAt||expiresAt>Date.now());
  });
  const userIds=[...new Set(active.map(story=>String(story.user_id)))];
  const profileById=new Map();
  if(userIds.length){
   const {data:profiles,error:profileError}=await supabaseClient.from('profiles').select('*').in('id',userIds);
   if(profileError) throw profileError;
   (profiles||[]).forEach(profile=>profileById.set(String(profile.id),profile));
  }
  const grouped=new Map();
  active.forEach((story,index)=>{
   const authorId=String(story.user_id);
   const profile=profileById.get(authorId)||(authorId===userId?me:users.find(person=>String(person.id)===authorId))||{};
   if(!grouped.has(authorId)) grouped.set(authorId,{
    userId:authorId,
    profile:{
     id:authorId,
     name:profile.full_name||profile.display_name||profile.name||profile.username||'VYBE user',
     username:profile.username|| (authorId===userId?(currentProfile||me.username):'user'),
     pic:profile.avatar_url||profile.profile_avatar_url||profile.pic||avatarPlaceholder
    },
    stories:[]
   });
   const normalized={...story,id:story.id||`${authorId}-${story.created_at||index}`,media_url:storyMediaUrl(story)};
   grouped.get(authorId).stories.push(normalized);
  });
  storyGroups=[...grouped.values()].sort((a,b)=>{
   if(a.userId===userId&&b.userId!==userId) return -1;
   if(b.userId===userId&&a.userId!==userId) return 1;
   const aFollowed=followingIds.has(a.userId),bFollowed=followingIds.has(b.userId);
   if(aFollowed!==bFollowed) return aFollowed?-1:1;
   return new Date(b.stories[0]?.created_at||0)-new Date(a.stories[0]?.created_at||0);
  });
  renderStories();
  renderProfile();
  return true;
 } catch(error) {
  console.error('Stories fetch error:',error);
  storyGroups=[];
  archivedOwnStories=[];
  renderStories();
  toast(error?.message||'Unable to load stories.');
  return false;
 }
}

function openStoryViewer(groupIndex,itemIndex=0){
 if(!storyGroups[groupIndex]?.stories.length) return;
 storyViewerGroupIndex=groupIndex;
 storyViewerItemIndex=itemIndex;
 const viewer=document.getElementById('storyViewer');
 if(!viewer) return;
 storyViewerPreviousOverflow=document.body.style.overflow;
 viewer.classList.add('open');
 viewer.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 renderActiveStory();
}

function renderActiveStory(){
 const group=storyGroups[storyViewerGroupIndex];
 const story=group?.stories[storyViewerItemIndex];
 if(!group||!story){closeStoryViewer();return;}
 clearTimeout(storyAdvanceTimer);
 const url=storyMediaUrl(story);
 const media=document.getElementById('storyMedia');
 const authorAvatar=document.getElementById('storyViewerAvatar');
 const username=document.getElementById('storyViewerUsername');
 const time=document.getElementById('storyViewerTime');
 const progress=document.getElementById('storyProgressList');
 const isOwner=String(group.userId)===String(currentUser?.id);
 if(!url){nextStory();return;}
 if(media){
  media.querySelector('video')?.pause();
  if(storyIsVideo(story,url)){
   const video=document.createElement('video');
   video.src=url;
   video.autoplay=true;
   video.muted=true;
   video.playsInline=true;
   video.addEventListener('loadedmetadata',()=>{
    if(story===storyGroups[storyViewerGroupIndex]?.stories[storyViewerItemIndex]){
     const durationMs=Number.isFinite(video.duration)?Math.max(1000,video.duration*1000):5000;
     startStoryProgress(durationMs);
    }
   },{once:true});
   video.addEventListener('ended',nextStory,{once:true});
   media.replaceChildren(video);
   video.play().catch(error=>console.error('Story video playback error:',error));
  }else{
   const image=document.createElement('img');
   image.src=url;
   image.alt='Story';
   media.replaceChildren(image);
  }
 }
 if(authorAvatar){authorAvatar.src=avatarSrc(group.profile.pic);authorAvatar.onerror=()=>{authorAvatar.onerror=null;authorAvatar.src=avatarPlaceholder;};}
 if(username) username.textContent=`@${group.profile.username||'user'}`;
 if(time) time.textContent=storyTimeAgo(story.created_at);
 if(progress) progress.innerHTML=group.stories.map((item,index)=>`<span class="story-progress-track"><i class="story-progress-fill ${index<storyViewerItemIndex?'done':index===storyViewerItemIndex?'active':''}"></i></span>`).join('');
 const deleteButton=document.getElementById('storyDeleteButton');
 const seenButton=document.getElementById('storySeenButton');
 const socialActions=document.getElementById('storySocialActions');
 if(deleteButton) deleteButton.hidden=!isOwner;
 if(seenButton) seenButton.hidden=!isOwner;
 if(socialActions) socialActions.hidden=isOwner;
 const seenCount=document.getElementById('storySeenCount');
 if(seenCount&&isOwner) seenCount.textContent='Seen by 0';
 toggleStorySeenDrawer(false);
 viewedStoryIds.add(String(story.id));
 renderStories();
 startStoryProgress(5000);
 if(isOwner) void loadStoryViewers(story);
 else{
  setStoryLikeUI(story.id);
  void recordStoryView(story);
  void loadStoryLikes(story);
 }
}

function startStoryProgress(durationMs){
 clearTimeout(storyAdvanceTimer);
 const fill=document.querySelectorAll('#storyProgressList .story-progress-fill')[storyViewerItemIndex];
 if(fill){
  fill.style.animation='none';
  void fill.offsetWidth;
  fill.style.animation=`story-progress ${durationMs}ms linear forwards`;
 }
 storyAdvanceTimer=setTimeout(nextStory,durationMs);
}

async function recordStoryView(story){
 const storyId=String(story?.id||'');
 const viewerId=String(currentUser?.id||'');
 if(!storyId||!viewerId||String(story.user_id)===viewerId||recordedStoryViewIds.has(storyId)) return;
 try{
  const {data:existing,error:lookupError}=await supabaseClient.from('story_views').select('story_id').eq('story_id',story.id).eq('viewer_id',currentUser.id).limit(1).maybeSingle();
  if(lookupError) throw lookupError;
  if(existing){recordedStoryViewIds.add(storyId);return;}
  const {error}=await supabaseClient.from('story_views').insert({story_id:story.id,viewer_id:currentUser.id});
  if(error) throw error;
  recordedStoryViewIds.add(storyId);
 }catch(error){
  if(error?.code==='23505') recordedStoryViewIds.add(storyId);
  else{console.error('Story view tracking error:',error);toast(error?.message||'Unable to record story view.');}
 }
}

async function loadStoryViewers(story){
 const list=document.getElementById('storySeenList');
 const count=document.getElementById('storySeenCount');
 if(!list||!count) return;
 list.innerHTML='<div class="story-seen-empty">Loading viewers...</div>';
 try{
  const {data,error}=await supabaseClient.from('story_views').select('viewer_id').eq('story_id',story.id);
  if(error) throw error;
  const viewerIds=[...new Set((data||[]).map(row=>String(row.viewer_id)).filter(Boolean))];
  count.textContent=`Seen by ${viewerIds.length}`;
  if(!viewerIds.length){list.innerHTML='<div class="story-seen-empty">No views yet</div>';return;}
  const {data:profiles,error:profileError}=await supabaseClient.from('profiles').select('*').in('id',viewerIds);
  if(profileError) throw profileError;
  const profileMap=new Map((profiles||[]).map(profile=>[String(profile.id),profile]));
  list.innerHTML=viewerIds.map(id=>{
   const profile=profileMap.get(id)||{};
   const name=profile.full_name||profile.display_name||profile.name||profile.username||'VYBE user';
   const username=profile.username||'user';
   const avatar=profile.avatar_url||profile.profile_avatar_url||avatarPlaceholder;
   return `<div class="story-seen-person"><img src="${safe(avatarSrc(avatar))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""><span>${safe(name)} <span style="color:#aaa">@${safe(username)}</span></span></div>`;
  }).join('');
 }catch(error){
  console.error('Story viewers fetch error:',error);
  list.innerHTML='<div class="story-seen-empty">Could not load viewers.</div>';
  toast(error?.message||'Unable to load story viewers.');
 }
}

function toggleStorySeenDrawer(force){
 const drawer=document.getElementById('storySeenDrawer');
 if(!drawer) return;
 const open=typeof force==='boolean'?force:!drawer.classList.contains('open');
 drawer.classList.toggle('open',open);
 drawer.setAttribute('aria-hidden',String(!open));
}

async function deleteActiveStory(){
 const group=storyGroups[storyViewerGroupIndex];
 const story=group?.stories[storyViewerItemIndex];
 if(!currentUser||!story||String(group.userId)!==String(currentUser.id)) return;
 if(!window.confirm('Delete this story?')) return;
 try{
  const {error}=await supabaseClient.from('stories').delete().eq('id',story.id).eq('user_id',currentUser.id);
  if(error) throw error;
  closeStoryViewer();
  await loadStories();
  toast('Story deleted');
 }catch(error){
  console.error('Story delete error:',error);
  toast(error?.message||'Unable to delete story.');
 }
}

function setStoryLikeUI(storyId){
 const button=document.getElementById('storyLikeButton');
 const icon=document.getElementById('storyLikeIcon');
 const count=document.getElementById('storyLikeCount');
 const key=String(storyId);
 if(button){button.classList.toggle('liked',likedStoryIds.has(key));button.setAttribute('aria-pressed',String(likedStoryIds.has(key)));}
 if(icon) icon.textContent=likedStoryIds.has(key)?'♥':'♡';
 if(count) count.textContent=String(storyLikeCounts.get(key)||0);
}

async function loadStoryLikes(story){
 const key=String(story?.id||'');
 if(!key) return;
 try{
  const {data,error}=await supabaseClient.from('story_likes').select('user_id').eq('story_id',story.id);
  if(error) throw error;
  const rows=data||[];
  storyLikeCounts.set(key,rows.length);
  if(rows.some(row=>String(row.user_id)===String(currentUser?.id))) likedStoryIds.add(key);
  else likedStoryIds.delete(key);
  if(String(storyGroups[storyViewerGroupIndex]?.stories[storyViewerItemIndex]?.id)===key) setStoryLikeUI(key);
 }catch(error){
  console.error('Story likes fetch error:',error);
  toast(error?.message||'Unable to load story likes.');
 }
}

function showStoryLikeAnimation(){
 const stage=document.querySelector('#storyViewer .story-stage');
 if(!stage) return;
 stage.querySelector('.story-floating-heart')?.remove();
 const heart=document.createElement('div');
 heart.className='story-floating-heart';
 heart.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>';
 stage.appendChild(heart);
 setTimeout(()=>heart.remove(),750);
}

async function toggleStoryLike(){
 const story=storyGroups[storyViewerGroupIndex]?.stories[storyViewerItemIndex];
 if(!currentUser){openAuthModal('login');return;}
 if(!story||String(story.user_id)===String(currentUser.id)) return;
 const key=String(story.id);
 if(pendingStoryLikes.has(key)) return;
 const wasLiked=likedStoryIds.has(key);
 pendingStoryLikes.add(key);
 if(wasLiked){likedStoryIds.delete(key);storyLikeCounts.set(key,Math.max(0,(storyLikeCounts.get(key)||0)-1));}
 else{likedStoryIds.add(key);storyLikeCounts.set(key,(storyLikeCounts.get(key)||0)+1);showStoryLikeAnimation();}
 setStoryLikeUI(key);
 try{
  const result=wasLiked
   ?await supabaseClient.from('story_likes').delete().eq('story_id',story.id).eq('user_id',currentUser.id)
   :await supabaseClient.from('story_likes').insert({story_id:story.id,user_id:currentUser.id});
  if(result.error) throw result.error;
 }catch(error){
  if(wasLiked){likedStoryIds.add(key);storyLikeCounts.set(key,(storyLikeCounts.get(key)||0)+1);}
  else{likedStoryIds.delete(key);storyLikeCounts.set(key,Math.max(0,(storyLikeCounts.get(key)||0)-1));}
  setStoryLikeUI(key);
  console.error('Story like update error:',error);
  toast(error?.message||'Unable to update story like.');
 }finally{
  pendingStoryLikes.delete(key);
 }
}

async function sendStoryMessage(text){
 const group=storyGroups[storyViewerGroupIndex];
 const story=group?.stories[storyViewerItemIndex];
 const message=String(text||'').trim();
 if(!currentUser){openAuthModal('login');return;}
 if(!group||!story||!message||String(group.userId)===String(currentUser.id)) return;
 pendingStoryReplyMetadata={id:story.id,url:storyMediaUrl(story)};
 closeStoryViewer();
 await openChat(group.userId);
 const input=document.getElementById('messageText');
 if(!input||String(activeChat)!==String(group.userId)){
  pendingStoryReplyMetadata=null;
  toast('Could not open the story creator’s conversation.');
  return;
 }
 input.value=message;
 await sendMessage();
}

function sendStoryReply(event){
 event?.preventDefault();
 const input=document.getElementById('storyReplyInput');
 const text=input?.value.trim();
 if(!text) return;
 if(input) input.value='';
 void sendStoryMessage(text);
}

function sendStoryReaction(emoji){
 void sendStoryMessage(emoji);
}

function nextStory(){
 const group=storyGroups[storyViewerGroupIndex];
 if(group&&storyViewerItemIndex<group.stories.length-1){
  storyViewerItemIndex++;
  renderActiveStory();
  return;
 }
 if(group?.isHighlightPlayback){closeStoryViewer();return;}
 if(storyViewerGroupIndex<storyGroups.length-1){
  storyViewerGroupIndex++;
  storyViewerItemIndex=0;
  renderActiveStory();
  return;
 }
 closeStoryViewer();
}

function previousStory(){
 if(storyGroups[storyViewerGroupIndex]?.isHighlightPlayback&&storyViewerItemIndex===0) return;
 if(storyViewerItemIndex>0){
  storyViewerItemIndex--;
  renderActiveStory();
  return;
 }
 if(storyViewerGroupIndex>0){
  storyViewerGroupIndex--;
  storyViewerItemIndex=Math.max(0,storyGroups[storyViewerGroupIndex].stories.length-1);
  renderActiveStory();
 }
}

function closeStoryViewer(){
 clearTimeout(storyAdvanceTimer);
 storyAdvanceTimer=null;
 const viewer=document.getElementById('storyViewer');
 const closingGroup=storyGroups[storyViewerGroupIndex];
 if(closingGroup?.isHighlightPlayback) storyGroups=storyGroups.filter(group=>group!==closingGroup);
 if(viewer){viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');}
 const media=document.getElementById('storyMedia');
 if(media){media.querySelector('video')?.pause();media.replaceChildren();}
 toggleStorySeenDrawer(false);
 const deleteButton=document.getElementById('storyDeleteButton');
 if(deleteButton) deleteButton.hidden=true;
 storyViewerGroupIndex=-1;
 storyViewerItemIndex=0;
 document.body.style.overflow=storyViewerPreviousOverflow;
 storyViewerPreviousOverflow='';
 renderStories();
}

document.addEventListener('keydown',event=>{
 if(!document.getElementById('storyViewer')?.classList.contains('open')) return;
 if(event.key==='Escape') closeStoryViewer();
 if(event.key==='ArrowRight') nextStory();
 if(event.key==='ArrowLeft') previousStory();
});

function renderFeed(){
 const feed=document.getElementById('feed');
 if(!feed) return;
 feedPlaybackObserver?.disconnect();
 feedPlaybackObserver=null;
 document.querySelectorAll('#feed video').forEach(video=>{video.pause();video.muted=true;});
 activeFeedVideo=null;
 if(feedRefreshing){
  feed.innerHTML=Array.from({length:3},()=>`<article class="skeleton-card" aria-hidden="true"><div class="skeleton-post-head"><span class="skeleton-block skeleton-avatar"></span><span class="skeleton-user-lines"><i class="skeleton-block skeleton-line"></i><i class="skeleton-block skeleton-line" style="width:72%"></i></span></div><div class="skeleton-block skeleton-media"></div><div class="skeleton-block skeleton-footer"></div></article>`).join('');
  return;
 }
 document.getElementById('forYouTab')?.classList.toggle('active',homeFeedMode==='forYou');
 document.getElementById('followingTab')?.classList.toggle('active',homeFeedMode==='following');
 document.getElementById('forYouTab')?.setAttribute('aria-selected',String(homeFeedMode==='forYou'));
 document.getElementById('followingTab')?.setAttribute('aria-selected',String(homeFeedMode==='following'));
 const list=[
  ...posts.map(post=>({...post,kind:'post',created_at:post.created_at||''})),
  ...reels.filter(isPublicActiveReel).map(reel=>({...reel,kind:'reel'}))
 ].filter(item=>homeFeedMode==='forYou'||follows.has(String(item.user)))
  .sort((a,b)=>(new Date(b.created_at||0).getTime()||0)-(new Date(a.created_at||0).getTime()||0));
 if(!list.length){
   feed.innerHTML=homeFeedMode==='following'
    ? '<div class="empty">No posts yet. Follow more creators to see their updates here.</div>'
    : '<div class="empty">No posts match your search.</div>';
   return;
 }
 feed.innerHTML=list.map(item=>{
   const isReel=item.kind==='reel';
   const author=user(item.user);
   const authorName=isReel?(item.username||reelAuthorName(item)||author.username):author.username;
   const authorDisplay=isReel?(item.username||reelAuthorName(item)||author.name):author.name;
   const mediaSrc=item.src||'';
   const liked=isReel?likedReels.has(String(item.id)):item.liked;
   const postSaved=isReel?savedReels.has(String(item.id)):(saved.has(String(item.id))||savedReels.has(String(item.id)));
   const savedClass=postSaved?'saved':'';
   const comments=(item.comments||[]).slice(0,2).map(c=>`<div class="meta">${safe(user(c.user).name)}: ${renderTaggedText(c.text)}</div>`).join('');
   const media=item.video
    ? `<video class="postmedia feed-video" data-feed-video playsinline preload="metadata" muted src="${safe(mediaSrc)}" onclick="toggleFeedVideoSound(this)" aria-label="Feed video; tap to toggle sound"></video><span class="feed-video-duration" data-video-duration hidden>0:00</span>`
    : `<img class="postmedia" src="${safe(mediaSrc)}" alt="${isReel?'reel':'post'}">`;
   return `<article class="post glass" data-feed-id="${isReel?'reel':'post'}:${safe(item.id)}">
     <div class="posthead">
       <img class="avatar" src="${safe(avatarSrc(author.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" onclick="viewProfile('${safe(item.user)}')">
       <div>
         <div class="username" onclick="viewProfile('${safe(item.user)}')">${safe(authorDisplay)}</div>
         <div class="meta">@${safe(authorName)}</div>
       </div>
       <button class="more" onclick="${isReel?`openReel('${safe(item.id)}')`:`openPost(${item.id})`}">⋯</button>
     </div>
     <div class="post-media-stage" data-like-media data-like-kind="${isReel?'reel':'post'}" data-like-id="${safe(item.id)}">${media}</div>
     <div class="actions">
       <button class="action ${isReel?(liked?'active':''):(liked?'liked':'')}" ${isReel?`data-reel-like="${safe(item.id)}"`:`data-post-like="${safe(item.id)}"`} aria-label="${liked?'Unlike':'Like'} ${isReel?'reel':'post'}" aria-pressed="${Boolean(liked)}" onclick="${isReel?`toggleReelLike('${safe(item.id)}')`:`toggleLike(${item.id})`}">♥</button>
       <span class="post-comment-action"><button class="action" onclick="openCommentsDrawer('${safe(item.id)}')">💬</button><small class="comment-feed-count" ${isReel?`data-reel-comment-count="${safe(item.id)}"`:`data-post-comment-count="${safe(item.id)}"`}>${Number(isReel?item.commentCount:(item.comments||[]).length).toLocaleString()}</small></span>
       <button class="action" onclick="${isReel?`shareReel('${safe(item.id)}')`:`sharePost(${item.id})`}">↗</button>
       <button class="action save ${savedClass}" type="button" ${isReel?`data-bookmark-reel="${safe(item.id)}"`:`data-bookmark-post="${safe(item.id)}"`} aria-label="${postSaved?'Remove bookmark':'Save'}" aria-pressed="${postSaved}" onclick="${isReel?`toggleSaveReel('${safe(item.id)}')`:`toggleSave('${safe(item.id)}')`}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.75h12v17l-6-4-6 4v-17Z"/></svg></button>
     </div>
     <div class="likes"><span ${isReel?`data-reel-like-count="${safe(item.id)}"`:`data-post-like-count="${safe(item.id)}"`}>${Number(isReel?item.likes:item.likes).toLocaleString()}</span> likes</div>
     <div class="caption"><b>${safe(authorName)}</b> ${renderTaggedText(item.caption)}</div>
     <div class="commentlist">${comments || '<div class="meta">No comments yet.</div>'}</div>
     ${isReel?'':`<div class="commentrow"><input id="comment-${item.id}" placeholder="Add a comment..." onkeydown="if(event.key==='Enter') addComment(${item.id})"><button class="smallbtn" onclick="addComment(${item.id})">Post</button></div>`}
   </article>`;
 }).join('');
 feed.querySelectorAll('[data-feed-video]').forEach(video=>{
  const badge=video.parentElement?.querySelector('[data-video-duration]');
  const updateDuration=()=>{
   if(!badge||!Number.isFinite(video.duration)) return;
   const seconds=Math.floor(video.duration);
   badge.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
   badge.hidden=false;
  };
  video.addEventListener('loadedmetadata',updateDuration,{once:true});
  if(video.readyState>=1) updateDuration();
 });
 observeFeedVideoPlayback();
}

function syncFeedVideoPlayback(){
 const feed=document.getElementById('feed');
 if(!feed||!document.getElementById('home')?.classList.contains('active')){
  document.querySelectorAll('#feed video').forEach(video=>{video.pause();video.muted=true;video.volume=0;});
  activeFeedVideo=null;
  return;
 }
 let bestVideo=null;
 let bestRatio=0;
 feed.querySelectorAll('[data-feed-video]').forEach(video=>{
  const rect=video.getBoundingClientRect();
  const width=Math.max(0,Math.min(rect.right,window.innerWidth)-Math.max(rect.left,0));
  const height=Math.max(0,Math.min(rect.bottom,window.innerHeight)-Math.max(rect.top,0));
  const ratio=width*height/Math.max(1,rect.width*rect.height);
  if(ratio>bestRatio){bestRatio=ratio;bestVideo=video;}
 });
 if(bestRatio<.7) bestVideo=null;
 feed.querySelectorAll('[data-feed-video]').forEach(video=>{
  if(video!==bestVideo){
   video.pause();
   video.muted=true;
   video.volume=0;
  }
 });
 if(!bestVideo){activeFeedVideo=null;return;}
 activeFeedVideo=bestVideo;
 bestVideo.muted=bestVideo.dataset.audioEnabled!=='true';
 bestVideo.volume=bestVideo.muted?0:1.0;
 bestVideo.play().catch(error=>{
  if(!bestVideo.muted){
   bestVideo.muted=true;
   bestVideo.volume=0;
   bestVideo.play().catch(playError=>console.info('Feed video autoplay was blocked:',playError));
  }else console.info('Feed video autoplay was blocked:',error);
 });
}

function observeFeedVideoPlayback(){
 const feed=document.getElementById('feed');
 if(!feed) return;
 if('IntersectionObserver' in window){
  feedPlaybackObserver=new IntersectionObserver(()=>syncFeedVideoPlayback(),{threshold:[0,.7,.8,1]});
  feed.querySelectorAll('[data-feed-video]').forEach(video=>feedPlaybackObserver.observe(video));
 }
 syncFeedVideoPlayback();
}

function toggleFeedVideoSound(video){
 if(video!==activeFeedVideo) return;
 const enable=video.dataset.audioEnabled!=='true';
 video.dataset.audioEnabled=String(enable);
 video.muted=!enable;
 video.volume=enable?1.0:0;
 if(video.paused) video.play().catch(error=>console.info('Feed video playback was blocked:',error));
}

async function setHomeFeedMode(mode){
 if(mode!=='forYou'&&mode!=='following') return;
 homeFeedMode=mode;
 renderFeed();
 if(mode==='following'&&currentUser){
  try{
   const {data,error}=await supabaseClient.from('user_follows').select('following_id').eq('follower_id',currentUser.id);
   if(error) throw error;
   follows=new Set((data||[]).map(row=>String(row.following_id)));
   renderFeed();
  }catch(error){
   console.error('Following feed load error:',error);
   toast(error?.message||'Unable to load the Following feed.');
  }
 }
}

async function refreshHomeFeed(){
 if(feedRefreshing) return;
 const indicator=document.getElementById('feedRefreshIndicator');
 const label=document.getElementById('feedRefreshText');
 feedRefreshing=true;
 indicator?.classList.add('visible','refreshing');
 if(label) label.textContent='Refreshing feed...';
 renderFeed();
 try{
  const [reelsLoaded,storiesLoaded]=await Promise.all([loadReels(),loadStories()]);
  toast(reelsLoaded===false||storiesLoaded===false?'Feed refreshed with some content unavailable.':'Feed refreshed');
 }catch(error){
  console.error('Home feed refresh error:',error);
  toast(error?.message||'Unable to refresh the feed.');
 }finally{
  feedRefreshing=false;
  indicator?.classList.remove('refreshing');
  if(label) label.textContent='Pull to refresh';
  renderFeed();
  window.setTimeout(()=>indicator?.classList.remove('visible'),250);
 }
}

document.getElementById('home')?.addEventListener('touchstart',event=>{
 if(!document.getElementById('home')?.classList.contains('active')||window.scrollY>0) return;
 feedPullStartY=event.touches[0]?.clientY??null;
 feedPullDistance=0;
},{passive:true});
document.getElementById('home')?.addEventListener('touchmove',event=>{
 if(feedPullStartY===null||feedRefreshing||window.scrollY>0) return;
 const distance=event.touches[0]?.clientY-feedPullStartY;
 if(distance<=0) return;
 feedPullDistance=Math.min(110,distance);
 const indicator=document.getElementById('feedRefreshIndicator');
 if(indicator){indicator.classList.add('visible');indicator.style.height=`${Math.max(38,Math.min(70,feedPullDistance*.7))}px`;}
 const label=document.getElementById('feedRefreshText');
 if(label) label.textContent=feedPullDistance>=72?'Release to refresh':'Pull to refresh';
 if(feedPullDistance>8) event.preventDefault();
},{passive:false});
document.getElementById('home')?.addEventListener('touchend',()=>{
 const shouldRefresh=feedPullDistance>=72;
 feedPullStartY=null;
 feedPullDistance=0;
 const indicator=document.getElementById('feedRefreshIndicator');
 if(indicator) indicator.style.height='';
 if(shouldRefresh) void refreshHomeFeed();
 else indicator?.classList.remove('visible');
},{passive:true});
document.getElementById('home')?.addEventListener('touchcancel',()=>{
 feedPullStartY=null;
 feedPullDistance=0;
 const indicator=document.getElementById('feedRefreshIndicator');
 if(indicator){indicator.style.height='';indicator.classList.remove('visible');}
},{passive:true});

function renderExplore(){
 const exploreGrid=document.getElementById('exploreGrid');
 if(!exploreGrid) return;
 window.allExploreMedia=reels.filter(isPublicActiveReel);
 let publicItems=[...window.allExploreMedia];
 if(exploreHashtagQuery){
  const needle=`#${exploreHashtagQuery}`.toLowerCase();
  publicItems=publicItems.filter(reel=>String(reel.caption||'').toLowerCase().includes(needle));
 }
 if(exploreFilter==='trending'){
  publicItems.sort(exploreTrendSort);
 }else if(exploreFilter==='clips'){
  publicItems=publicItems.filter(isExploreVideo);
 }else if(exploreFilter==='photos'){
  publicItems=publicItems.filter(reel=>!isExploreVideo(reel));
 }else if(exploreFilter==='recent'){
  publicItems.sort((a,b)=>exploreCreatedAt(b)-exploreCreatedAt(a));
 }
 document.querySelectorAll('[data-explore-filter]').forEach(button=>{
  const active=button.dataset.exploreFilter===exploreFilter;
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
 });
 exploreGrid.innerHTML=publicItems.length ? publicItems.map((reel,index)=>{
  const video=isExploreVideo(reel);
  return `
   <div class="tile" role="button" tabindex="0" aria-label="View ${video?'video':'photo'} by @${safe(reelAuthorName(reel))}" onclick="openReel('${safe(reel.id)}')" onkeydown="if(event.target===event.currentTarget&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openReel('${safe(reel.id)}')}">
    ${isOwnReel(reel)?`<button class="reel-manage" aria-label="Manage your post" onclick="event.stopPropagation();openReelMenu('${safe(reel.id)}')">⋯</button>`:''}
    ${video?`<video src="${safe(reel.src)}" muted playsinline preload="metadata"></video>`:`<img src="${safe(reel.src)}" alt="Public post">`}
    ${video?'<span class="explore-video-badge" aria-label="Video"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5a1 1 0 0 1 1.5-.86l8 4.62a2 2 0 0 1 0 3.46l-8 4.62A1 1 0 0 1 4 13.48Z"/></svg></span>':''}
    <span>@${safe(reelAuthorName(reel))}</span>
   </div>`;
 }).join('') : '<div class="empty">No public posts or reels match this filter.</div>';
 exploreGrid.classList.remove('filter-fade-in');
 void exploreGrid.offsetWidth;
 exploreGrid.classList.add('filter-fade-in');
}

function isExploreVideo(reel){
 const mediaType=String(reel.media_type||'').toLowerCase();
 const url=String(reel.src||reel.media_url||reel.video_url||'').split(/[?#]/)[0];
 return mediaType==='video'||mediaType.startsWith('video/')||Boolean(reel.video)||/\.(mp4|webm|ogg|m4v|mov|mkv|3gp)$/i.test(url);
}

function exploreTrendSort(a,b){
 const likesDifference=(Number(b.likes_count??b.likes??b.like_count??0)||0)-(Number(a.likes_count??a.likes??a.like_count??0)||0);
 if(likesDifference) return likesDifference;
 return (Number(b.views_count??b.view_count??b.views??0)||0)-(Number(a.views_count??a.view_count??a.views??0)||0);
}

function exploreCreatedAt(reel){
 const value=new Date(reel.created_at||0).getTime();
 return Number.isFinite(value)?value:0;
}

function setExploreFilter(filter){
 const supported=['all','trending','clips','photos','recent'];
 if(!supported.includes(filter)) return;
 exploreFilter=filter;
 renderExplore();
}

async function loadExploreFeed(){
 const exploreGrid=document.getElementById('exploreGrid');
 if(!exploreGrid) return;
 exploreGrid.innerHTML='<div class="empty">Loading public posts...</div>';
 try {
  const {data,error}=await supabaseClient.from('reels').select('*').eq('is_archived',false).order('created_at',{ascending:false});
  if(error) throw error;
  const loaded=(data||[]).map(normalizeReel).filter(isPublicActiveReel);
  const loadedIds=new Set(loaded.map(item=>String(item.id)));
  reels=[...loaded,...reels.filter(item=>!loadedIds.has(String(item.id))&&isPublicActiveReel(item))];
  window.allExploreMedia=reels.filter(isPublicActiveReel);
  renderExplore();
 } catch(error) {
  console.error('Explore feed fetch error:',error);
  exploreGrid.innerHTML='<div class="empty">Unable to load public posts. Please try again.</div>';
  toast(error?.message || 'Unable to load Explore.');
 }
}

function renderSearchResults(message){
 const resultList=document.getElementById('searchResultList');
 if(!resultList) return;
 if(message){
  resultList.innerHTML=`<div class="empty">${safe(message)}</div>`;
  return;
 }
 const matches=[...searchedProfiles.values()];
 if(!matches.length){
  resultList.innerHTML='<div class="empty">No users found.</div>';
  return;
 }
 resultList.innerHTML=matches.map(profile=>{
  const isOwn=String(currentUser?.id)===String(profile.id);
  const state=followStates.get(String(profile.id));
  const isFollowing=Boolean(state?.isFollowing || follows.has(String(profile.id)));
  const isLoading=loadingFollowStates.has(String(profile.id));
  return `<div class="search-result">
   <button class="search-result-identity" type="button" data-profile-id="${safe(profile.id)}" style="display:flex;align-items:center;gap:13px;flex:1;min-width:0;border:0;background:transparent;color:inherit;text-align:left">
    <img src="${safe(avatarSrc(profile.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt="">
    <span class="search-result-details"><span class="search-result-name">${safe(profile.name)}</span><span class="search-result-username">@${safe(profile.username)}</span></span>
   </button>
   ${isOwn?'':`<button class="${isFollowing?'secondary following':'primary'} follow-button search-result-follow" type="button" data-follow-user="${safe(profile.id)}" ${isLoading||pendingFollows.has(String(profile.id))?'disabled':''}>${isLoading||pendingFollows.has(String(profile.id))?'...':isFollowing?'Following':'Follow'}</button>`}
  </div>`;
 }).join('');
 resultList.querySelectorAll('.search-result-identity').forEach(button=>button.addEventListener('click',()=>openSearchedProfile(button.dataset.profileId)));
 resultList.querySelectorAll('[data-follow-user]').forEach(button=>button.addEventListener('click',()=>toggleFollow(button.dataset.followUser)));
}

function renderSaved(){
 const savedGrid=document.getElementById('savedGrid');
 const savedPosts=posts.filter(p=>saved.has(String(p.id))||saved.has(p.id));
 const items=[
   ...savedPosts.map(post=>`<div class="tile" role="button" tabindex="0" onclick="openSavedPost(${post.id})"><img src="${safe(post.src)}" alt="Saved post"></div>`),
   ...savedReelItems.map(reel=>`<div class="tile" role="button" tabindex="0" onclick="openSavedReel('${safe(reel.id)}')">${reel.video?`<video src="${safe(reel.src)}" muted playsinline></video>`:`<img src="${safe(reel.src)}" alt="Saved reel">`}</div>`)
 ];
 const content=savedBookmarksLoading&&!items.length
  ? '<div class="empty">Loading saved items...</div>'
  : items.length ? items.join('') : '<div class="empty">No saved posts or reels yet.</div>';
 if(savedGrid) savedGrid.innerHTML=content;
 const settingsGrid=document.getElementById('savedSettingsGrid');
 if(settingsGrid) settingsGrid.innerHTML=content;
}

function renderArchivedCollection(){
 const subview=document.getElementById('settingsSubview');
 if(!subview) return;
 const ownItems=archivedReels.filter(isOwnReel);
 subview.innerHTML=`<div class="grid">${ownItems.length?ownItems.map(reel=>`<div class="tile" role="button" tabindex="0" onclick="openReel('${safe(reel.id)}')"><button class="profile-tile-menu" type="button" aria-label="Manage archived post" onclick="event.stopPropagation();openReelMenu('${safe(reel.id)}')">⋯</button>${reel.video?`<video src="${safe(reel.src)}" muted playsinline></video>`:`<img src="${safe(reel.src)}" alt="Archived reel">`}</div>`).join(''):'<div class="empty">No archived items.</div>'}</div>`;
}

function openSavedPost(id){
 openPost(id);
 document.getElementById('postModal')?.classList.add('saved-fullscreen');
}

function openSavedReel(id){
 const reel=[...savedReelItems,...reels,...archivedReels].find(item=>String(item.id)===String(id));
 if(reel?.video){void playReelInPlayer(id);return;}
 openReel(id);
 document.getElementById('postModal')?.classList.add('saved-fullscreen');
}

function storyHighlightsStorageKey(userId){
 return `vybe:story-highlights:${String(userId)}`;
}

function getOwnHighlightStories(){
 const stories=[...archivedOwnStories,...(storyGroups.find(group=>group.userId===String(currentUser?.id))?.stories||[])];
 const unique=new Map();
 stories.forEach(story=>{if(story?.id&&storyMediaUrl(story))unique.set(String(story.id),story);});
 return [...unique.values()].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
}

function renderProfileHighlights(){
 const ownStories=getOwnHighlightStories();
 const byId=new Map(ownStories.map(story=>[String(story.id),story]));
 const highlights=profileHighlights.map(item=>({...item,stories:item.storyIds.map(id=>byId.get(String(id))).filter(Boolean)})).filter(item=>item.stories.length);
 return `<div class="profile-highlights" aria-label="Story highlights">
  <button class="profile-highlight add" type="button" onclick="openAddHighlight()"><span class="profile-highlight-avatar">+</span><span class="profile-highlight-title">New</span></button>
  ${highlights.map(highlight=>`<button class="profile-highlight" type="button" onclick="openStoryHighlight('${safe(highlight.id)}')"><span class="profile-highlight-avatar"><img src="${safe(storyMediaUrl(highlight.stories[0]))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""></span><span class="profile-highlight-title">${safe(highlight.title)}</span></button>`).join('')}
 </div>`;
}

function openAddHighlight(){
 if(!currentUser){openAuthModal('login');return;}
 const modal=document.getElementById('highlightModal');
 const options=document.getElementById('highlightStoryOptions');
 if(!modal||!options) return;
 const stories=getOwnHighlightStories();
 options.innerHTML=stories.length?stories.map(story=>{
  const url=storyMediaUrl(story);
  const media=storyIsVideo(story,url)?`<video src="${safe(url)}" muted playsinline preload="metadata"></video>`:`<img src="${safe(url)}" alt="">`;
  return `<label class="highlight-story-option">${media}<input type="checkbox" value="${safe(story.id)}" aria-label="Select story from ${safe(storyTimeAgo(story.created_at))}"></label>`;
 }).join(''):'<div class="highlight-story-empty">No active or archived stories are available to add.</div>';
 document.getElementById('highlightNameInput').value='';
 highlightPreviousOverflow=document.body.style.overflow;
 modal.classList.add('open');
 modal.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
}

function closeHighlightModal(){
 const modal=document.getElementById('highlightModal');
 modal?.classList.remove('open');
 modal?.setAttribute('aria-hidden','true');
 document.body.style.overflow=highlightPreviousOverflow;
 highlightPreviousOverflow='';
}

function saveStoryHighlight(){
 if(!currentUser){openAuthModal('login');return;}
 const title=document.getElementById('highlightNameInput')?.value.trim();
 const storyIds=[...document.querySelectorAll('#highlightStoryOptions input:checked')].map(input=>String(input.value));
 if(!title){toast('Add a title for this highlight.');return;}
 if(!storyIds.length){toast('Select at least one story.');return;}
 const highlight={id:window.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,title:title.slice(0,24),storyIds};
 profileHighlights=[...profileHighlights,highlight];
 try{
  localStorage.setItem(storyHighlightsStorageKey(currentUser.id),JSON.stringify(profileHighlights.map(({id,title,storyIds})=>({id,title,storyIds}))));
 }catch(error){
  profileHighlights=profileHighlights.filter(item=>item.id!==highlight.id);
  console.error('Profile highlight save error:',error);
  toast(error?.message||'Unable to save this highlight.');
  return;
 }
 closeHighlightModal();
 renderProfile();
 toast('Story highlight added');
}

function openStoryHighlight(highlightId){
 const highlight=profileHighlights.find(item=>String(item.id)===String(highlightId));
 if(!highlight) return;
 const storyById=new Map(getOwnHighlightStories().map(story=>[String(story.id),story]));
 const stories=highlight.storyIds.map(id=>storyById.get(String(id))).filter(Boolean);
 if(!stories.length){toast('This highlight has no available stories.');return;}
 const group={
  userId:String(currentUser.id),
  profile:{id:currentUser.id,name:me.name||currentProfile||'You',username:currentProfile||me.username||'user',pic:me.pic},
  stories,
  isHighlightPlayback:true,
  highlightTitle:highlight.title
 };
 storyGroups.push(group);
 openStoryViewer(storyGroups.length-1);
}

function renderProfile(){
 const profileView=document.getElementById('profileView');
 if(!profileView) return;
 if(!['posts','reels'].includes(profileTab)) profileTab='posts';
 const renderTiles=(items)=>items.map(item=>`<div class="profile-tile" onclick="${item.video?`playReelInPlayer('${safe(item.id)}')`:item.kind==='reel'?`openReel('${safe(item.id)}')`:`openPost(${item.id})`}">${item.kind==='reel'&&isOwnReel(item)?`<button class="profile-tile-menu" aria-label="Manage your post" onclick="event.stopPropagation();openReelMenu('${safe(item.id)}')">⋯</button>`:''}${item.video?`<video src="${safe(item.src)}" muted playsinline></video>`:`<img src="${safe(item.src)}" alt="Your post">`}</div>`).join('');
 const ownedReels=reels.filter(reel=>isOwnReel(reel));
 const userPosts=[...posts.filter(post=>post.user===0),...ownedReels];
 const tabItems={
   posts:userPosts,
   reels:ownedReels.filter(reel=>reel.video),
  likes:likedReelItems
 }[profileTab] || userPosts;
 const profileItemsContent=tabItems.length?renderTiles(tabItems):'<div class="profile-empty">Nothing to show yet.</div>';
 profileView.innerHTML=`
 <div class="profile-header glass">
  <button class="profile-info-button" type="button" aria-label="Account Info" title="Account Info" onclick="openAccountInfoModal(currentUser?.id)">i</button>
  <button class="profile-settings-button" type="button" aria-label="Settings" onclick="openSettingsSheet()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a7.8 7.8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a7.8 7.8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a7.4 7.4 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a7.8 7.8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a7.8 7.8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7.4 7.4 0 0 1-.1 2Z"/></svg></button>
  <div class="profile-top">
   <img class="profilepic" src="${safe(avatarSrc(me.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'">
   <div class="profile-details">
    <button class="profile-username profile-username-switch" type="button" onclick="openAccountSwitcher()">${safe(me.name)} <span style="color:#aaa;font-size:12px">@${safe(currentProfile || me.username)}</span></button>
    <div class="profile-bio">${safe(me.bio)}</div>
    <div class="profile-stats">
      <button><b>${userPosts.length}</b><span>Posts</span></button>
      <button onclick="showPeopleList('Followers', currentUser.id)"><b>${me.followers}</b><span>Followers</span></button>
      <button onclick="showPeopleList('Following', currentUser.id)"><b>${me.following}</b><span>Following</span></button>
    </div>
   </div>
  </div>
  <button class="secondary edit-profile-button" onclick="editProfile()">Custom Profile</button>
  ${renderProfileHighlights()}
  <div class="profile-tabs">
    <button class="${profileTab==='posts'?'active':''}" onclick="setProfileTab('posts')">POSTS</button>
    <button class="${profileTab==='reels'?'active':''}" onclick="setProfileTab('reels')">REELS</button>
  </div>
  <div class="profile-grid">${profileItemsContent}</div>
 </div>`;
}

function renderOtherProfile(){
 const otherView=document.getElementById('otherView');
 if(!otherView || !viewing) return;
 const userData=user(viewing);
 const relevantPosts=posts.filter(post=>String(post.user)===String(viewing));
 const relevantReels=reels.filter(reel=>String(reel.user)===String(viewing)&&isPublicActiveReel(reel));
 const relevant=[...relevantPosts,...relevantReels];
 const followState=followStates.get(String(userData.id)) || {followers:Number(userData.followers||0),following:Number(userData.following||0),isFollowing:follows.has(String(userData.id))};
 const isOwnProfile=String(currentUser?.id)===String(userData.id);
 const profileTiles=[
  ...relevantPosts.map(post=>`<div class="profile-tile" onclick="openPost(${post.id})">${post.video?`<video src="${safe(post.src)}"></video>`:`<img src="${safe(post.src)}">`}</div>`),
  ...relevantReels.map(reel=>`<div class="profile-tile" onclick="${reel.video?`playReelInPlayer('${safe(reel.id)}')`:`openReel('${safe(reel.id)}')`}">${reel.video?`<video src="${safe(reel.src)}" muted playsinline></video>`:`<img src="${safe(reel.src)}">`}</div>`)
 ];
 otherView.innerHTML=`
 <div class="profile-header glass">
  <button class="profile-info-button" type="button" aria-label="Account Info" title="Account Info" onclick="openAccountInfoModal('${safe(userData.id)}')">i</button>
  <div class="profile-top">
   <img class="profilepic" src="${safe(avatarSrc(userData.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'">
   <div class="profile-details">
    <div class="profile-username">${safe(userData.name)} <span style="color:#aaa;font-size:12px">@${safe(uName(userData))}</span></div>
    <div class="profile-buttons">
      ${isOwnProfile?'<button class="secondary edit-profile-button" onclick="editProfile()">Custom Profile</button>':`<button class="${followState.isFollowing?'secondary following':'primary'} follow-button" ${pendingFollows.has(String(userData.id))?'disabled':''} onclick="toggleFollow('${safe(userData.id)}')">${followState.isFollowing?'Following':'Follow'}</button><button class="secondary" onclick="openChat('${safe(userData.id)}')">Message</button>`}
    </div>
    <div class="profile-bio">${safe(userData.bio)}</div>
    <div class="profile-stats">
      <button><b>${relevant.length}</b><span>Posts</span></button>
      <button onclick="showPeopleList('Followers', '${safe(userData.id)}')"><b>${Number(followState.followers||0)}</b><span>Followers</span></button>
      <button onclick="showPeopleList('Following', '${safe(userData.id)}')"><b>${Number(followState.following||0)}</b><span>Following</span></button>
    </div>
   </div>
  </div>
  <div class="profile-tabs">
    <button class="active">POSTS</button>
  </div>
  <div class="profile-grid">${profileTiles.length ? profileTiles.join('') : '<div class="profile-empty">No posts yet.</div>'}</div>
 </div>`;
}

function setProfileTab(tab){
 if(!['posts','reels'].includes(tab)) return;
 profileTab=tab; renderProfile();
}

function renderChats(){
 if(document.getElementById('dmDrawer')?.classList.contains('open') && !activeChat) renderDMInbox();
}

function dmProfile(id){
 const key=String(id);
 if(key===String(currentUser?.id)) return {id:currentUser.id,name:me.name||currentProfile||'You',username:currentProfile||me.username||'user',pic:me.pic};
 return dmProfiles.get(key)||users.find(item=>String(item.id)===key)||{id,name:'VYBE user',username:'user',pic:avatarPlaceholder};
}

function isValidUserUuid(value){
 return typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}

async function resolveDMRecipient(target){
 const providedId=String(target??'').trim();
 let known=dmProfiles.get(providedId)||users.find(item=>String(item.id)===providedId)||searchedProfiles.get(providedId);
 if(isValidUserUuid(providedId)){
  if(known && isValidUserUuid(String(known.id))) return {...known,id:String(known.id)};
  const {data,error}=await supabaseClient.from('profiles').select('*').eq('id',providedId).maybeSingle();
  if(error) throw error;
  if(!data?.id || !isValidUserUuid(String(data.id))) throw new Error('The selected profile does not have a valid user ID.');
  const profile={id:String(data.id),name:data.full_name||data.display_name||data.name||data.username||'VYBE user',username:data.username||'user',pic:data.avatar_url||data.profile_avatar_url||avatarPlaceholder};
  dmProfiles.set(profile.id,profile);
  return profile;
 }
 const username=normalizeUsername(known?.username||providedId.replace(/^@/,''));
 if(!username) throw new Error('A username or valid user ID is required to start a conversation.');
 const {data,error}=await supabaseClient.from('profiles').select('*').eq('username',username).maybeSingle();
 if(error) throw error;
 if(!data?.id || !isValidUserUuid(String(data.id))) throw new Error(`Could not find a valid account for @${username}.`);
 const profile={id:String(data.id),name:data.full_name||data.display_name||data.name||data.username||username,username:data.username||username,pic:data.avatar_url||data.profile_avatar_url||avatarPlaceholder};
 dmProfiles.set(profile.id,profile);
 return profile;
}

function dmMessageText(message){
 return String(message.message_text || message.content || message.text || '')
  .replace(/\n?\[\[story-preview:[^:\]]+:[^\]]+\]\]$/,'')
  .replace(/\n?\[\[reel-card:[^:\]]+:[^\]]+\]\]$/,'')
  .replace(/\n?\[\[voice-note:[^\]]+\]\]$/,'');
}

function dmStoryPreview(message){
 const raw=String(message.message_text||message.content||message.text||'');
 const match=raw.match(/\n?\[\[story-preview:([^:\]]+):([^\]]+)\]\]$/);
 if(!match) return null;
 try{return {id:decodeURIComponent(match[1]),url:decodeURIComponent(match[2])};}
 catch(error){console.error('Story reply metadata parse error:',error);return null;}
}

function dmReelCard(message){
 const match=String(message.message_text||message.content||message.text||'').match(/\[\[reel-card:([^:\]]+):([^\]]+)\]\]$/);
 if(!match) return null;
 try{return {url:decodeURIComponent(match[1]),caption:decodeURIComponent(match[2])};}
 catch(error){console.error('Shared reel metadata parse error:',error);return null;}
}

function dmVoiceNote(message){
 const match=String(message.message_text||message.content||message.text||'').match(/\[\[voice-note:([^\]]+)\]\]$/);
 if(!match) return '';
 try{return decodeURIComponent(match[1]);}
 catch(error){console.error('Voice note metadata parse error:',error);return '';}
}

function dmPartnerId(message,userId=currentUser?.id){
 const sender=String(message.sender_id||message.from_user_id||'');
 const receiver=String(message.receiver_id||message.to_user_id||'');
 const current=String(userId||'');
 if(sender===current) return receiver;
 if(receiver===current) return sender;
 return null;
}

function renderDMInbox(){
 const inbox=document.getElementById('dmInbox');
 if(!inbox) return;
 const notes=renderNotesTray();
 const conversations=dmConversations.length?dmConversations.map(conversation=>{
  const person=dmProfile(conversation.userId);
  const preview=conversation.lastMessage ? `${String(conversation.lastMessage.sender_id||conversation.lastMessage.from_user_id)===String(currentUser.id)?'You: ':''}${dmMessageText(conversation.lastMessage)}` : 'Start a conversation';
  return `<button class="dm-person" type="button" data-chat-user="${safe(conversation.userId)}">
   <img class="dm-person-avatar" src="${safe(avatarSrc(person.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt="">
   <span class="dm-person-copy"><span class="dm-person-name">${safe(person.name||person.username||'VYBE user')} <span class="meta">@${safe(person.username||'user')}</span></span><span class="dm-person-preview">${safe(preview)}</span></span>
  </button>`;
 }).join(''):'<div class="dm-empty">No conversations yet. Message someone from their profile to get started.</div>';
 inbox.innerHTML=notes+conversations;
 inbox.querySelectorAll('[data-chat-user]').forEach(button=>{
  const cancelLongPress=()=>{clearTimeout(dmLongPressTimer);dmLongPressTimer=null;};
  button.addEventListener('pointerdown',()=>{
   dmLongPressTimer=setTimeout(()=>{
    button.dataset.longPressed='true';
    openDMActionSheet(button.dataset.chatUser);
    dmLongPressTimer=null;
   },550);
  });
  button.addEventListener('pointerup',cancelLongPress);
  button.addEventListener('pointercancel',cancelLongPress);
  button.addEventListener('pointerleave',cancelLongPress);
  button.addEventListener('contextmenu',event=>{
   event.preventDefault();
   button.dataset.longPressed='true';
   cancelLongPress();
   openDMActionSheet(button.dataset.chatUser);
  });
  button.addEventListener('click',()=>{
   if(button.dataset.longPressed==='true'){delete button.dataset.longPressed;return;}
   void openChat(button.dataset.chatUser);
  });
 });
 inbox.querySelectorAll('[data-note-user]').forEach(button=>button.addEventListener('click',()=>button.dataset.noteUser==='self'?openNoteActionSheet():openChat(button.dataset.noteUser)));
}

function renderNotesTray(){
 const ownNote=me.statusNote||'Share a thought...';
 const current=`<button class="notes-item" type="button" data-note-user="self"><span class="notes-bubble">${safe(ownNote)}</span><img class="notes-avatar" src="${safe(avatarSrc(me.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""><span>Your note</span></button>`;
 const followers=dmConversations.map(({userId})=>({userId,profile:dmProfile(userId)})).filter(({profile})=>profile.statusNote);
 return `<div class="notes-tray" aria-label="Notes">${current}${followers.map(({userId,profile})=>`<button class="notes-item" type="button" data-note-user="${safe(userId)}"><span class="notes-bubble">${safe(profile.statusNote)}</span><img class="notes-avatar" src="${safe(avatarSrc(profile.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""><span>@${safe(profile.username)}</span></button>`).join('')}</div>`;
}

async function editStatusNote(){
 const next=(window.prompt('Share a thought (up to 60 characters):',me.statusNote||'')||'').trim().slice(0,60);
 if(!next)return;
 try{
 const {error}=await supabaseClient.from('profiles').update({status_note:next}).eq('id',currentUser.id);
 if(error)throw error;
 me.statusNote=next;
 renderDMInbox();
 toast('Note updated');
 }catch(error){console.error('Status note update error:',error);toast(error?.message||'Unable to update your note.');}
}

function openNoteActionSheet(){
 const sheet=document.getElementById('noteActionSheet');
 if(!sheet) return;
 sheet.classList.add('open');
 sheet.setAttribute('aria-hidden','false');
}

function closeNoteActionSheet(){
 const sheet=document.getElementById('noteActionSheet');
 sheet?.classList.remove('open');
 sheet?.setAttribute('aria-hidden','true');
}

async function deleteStatusNote(){
 if(!currentUser) return;
 try{
  const {error}=await supabaseClient.from('profiles').update({status_note:null}).eq('id',currentUser.id);
  if(error) throw error;
  me.statusNote='';
  closeNoteActionSheet();
  renderDMInbox();
  toast('Note deleted');
 }catch(error){
  console.error('Status note deletion error:',error);
  toast(error?.message||'Unable to delete your note.');
 }
}

function renderDMThread(){
 const thread=document.getElementById('dmThread');
 if(!thread || !currentUser || !activeChat) return;
 thread.innerHTML=dmMessages.map(message=>{
  const mine=String(message.sender_id||message.from_user_id)===String(currentUser.id);
  const timestamp=message.created_at?new Date(message.created_at):null;
  const time=timestamp&&!Number.isNaN(timestamp.getTime())?timestamp.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):'';
  const preview=dmStoryPreview(message);
  const reelCard=dmReelCard(message);
  const voiceUrl=dmVoiceNote(message);
  let previewUrl='';
  try{const parsed=preview?.url?new URL(preview.url,location.href):null;if(parsed&&['http:','https:'].includes(parsed.protocol))previewUrl=parsed.href;}catch(error){console.error('Story preview URL error:',error);}
  let reelUrl='';
  try{const parsed=reelCard?.url?new URL(reelCard.url,location.href):null;if(parsed&&['http:','https:'].includes(parsed.protocol))reelUrl=parsed.href;}catch(error){console.error('Shared reel URL error:',error);}
  let safeVoiceUrl='';
  try{const parsed=voiceUrl?new URL(voiceUrl,location.href):null;if(parsed&&['http:','https:'].includes(parsed.protocol))safeVoiceUrl=parsed.href;}catch(error){console.error('Voice note URL error:',error);}
  const previewMedia=previewUrl?(isVideoFile({type:'',name:previewUrl})?`<video src="${safe(previewUrl)}" muted playsinline preload="metadata"></video>`:`<img src="${safe(previewUrl)}" alt="Story preview">`):'';
  const reelPreview=reelUrl?`<a class="dm-reel-card" href="${safe(reelUrl)}" target="_blank" rel="noopener noreferrer"><strong>▶ Shared a reel</strong><span>${safe(reelCard.caption||'Watch this reel on VYBE')}</span></a>`:'';
  const voicePreview=safeVoiceUrl?`<audio controls preload="metadata" src="${safe(safeVoiceUrl)}" aria-label="Voice note"></audio>`:'';
  return `<div class="dm-bubble ${mine?'mine':''}">${safe(dmMessageText(message))}${previewMedia?`<div class="dm-story-preview">${previewMedia}<span>Replied to your story</span></div>`:''}${reelPreview}${voicePreview}${time?`<time class="dm-time">${safe(time)}</time>`:''}</div>`;
 }).join('') || '<div class="dm-empty">Say hello to start the conversation.</div>';
 thread.scrollTop=thread.scrollHeight;
}

function setDMView(view){
 const inbox=document.getElementById('dmInbox');
 const thread=document.getElementById('dmThread');
 const composer=document.getElementById('dmComposer');
 const back=document.getElementById('dmBackButton');
 const avatar=document.getElementById('dmHeaderAvatar');
 const title=document.getElementById('dmTitle');
 const subtitle=document.getElementById('dmSubtitle');
 const inConversation=view==='thread';
 if(inbox) inbox.style.display=inConversation?'none':'block';
 if(thread) thread.style.display=inConversation?'flex':'none';
 if(composer) composer.style.display=inConversation?'flex':'none';
 if(back) back.style.display=inConversation?'block':'none';
 if(avatar) avatar.style.display=inConversation?'block':'none';
 if(inConversation && activeChat){
  const person=dmProfile(activeChat);
  if(avatar){avatar.src=avatarSrc(person.pic);avatar.onerror=()=>{avatar.src=avatarPlaceholder;};}
  if(title) title.textContent=person.name||person.username||'Conversation';
  if(subtitle) subtitle.textContent=`@${person.username||'user'}`;
 }else{
  if(title) title.textContent='Messages';
  if(subtitle) subtitle.textContent='Your conversations';
 }
}

async function loadDMInbox(){
 if(!currentUser) return;
 const userId=currentUser.id;
 const request=++dmRequestToken;
 const inbox=document.getElementById('dmInbox');
 if(inbox) inbox.innerHTML='<div class="dm-loading">Loading conversations...</div>';
 try {
  const [followingResult,messagesResult]=await Promise.all([
   supabaseClient.from('user_follows').select('following_id').eq('follower_id',userId),
   supabaseClient.from('direct_messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at',{ascending:false}).limit(100)
  ]);
  if(followingResult.error) throw followingResult.error;
  if(messagesResult.error) throw messagesResult.error;
  if(request!==dmRequestToken||String(currentUser?.id)!==String(userId)) return;
  const latestByUser=new Map();
  (messagesResult.data||[]).forEach(message=>{
   const partner=dmPartnerId(message,userId);
   if(partner && !latestByUser.has(partner)) latestByUser.set(partner,message);
  });
  const userIds=[...new Set([...(followingResult.data||[]).map(row=>String(row.following_id)),...latestByUser.keys()])].filter(id=>id!==String(userId)&&isValidUserUuid(id));
  if(userIds.length){
   const {data:profiles,error:profileError}=await supabaseClient.from('profiles').select('*').in('id',userIds);
   if(profileError) throw profileError;
   (profiles||[]).forEach(profile=>dmProfiles.set(String(profile.id),{
    id:profile.id,
    name:profile.full_name||profile.display_name||profile.name||profile.username||'VYBE user',
    username:profile.username||'user',
    pic:profile.avatar_url||profile.profile_avatar_url||avatarPlaceholder,
    statusNote:profile.status_note||''
   }));
  }
  const ids=new Set(userIds);
  dmConversations=[...ids].map(id=>({userId:id,lastMessage:latestByUser.get(id)||null}))
   .sort((a,b)=>new Date(b.lastMessage?.created_at||0)-new Date(a.lastMessage?.created_at||0));
  renderDMInbox();
 } catch(error) {
  if(request!==dmRequestToken) return;
  console.error('Direct message inbox error:',error);
  if(inbox) inbox.innerHTML='<div class="dm-error">Could not load conversations. Please try again.</div>';
  toast(error?.message||'Unable to load conversations.');
 }
}

async function loadDMProfile(userId){
 const key=String(userId);
 if(!isValidUserUuid(key)) throw new Error('Cannot load a conversation for an invalid user ID.');
 if(dmProfiles.has(key)) return dmProfiles.get(key);
 const {data,error}=await supabaseClient.from('profiles').select('*').eq('id',userId).maybeSingle();
 if(error) throw error;
 if(!data?.id || !isValidUserUuid(String(data.id))) throw new Error('Could not resolve a valid user ID for this conversation.');
 const profile={
  id:String(data.id),
  name:data?.full_name||data?.display_name||data?.name||data?.username||'VYBE user',
  username:data?.username||'user',
  pic:data?.avatar_url||data?.profile_avatar_url||avatarPlaceholder
 };
 dmProfiles.set(key,profile);
 return profile;
}

async function loadDMConversation(targetUserId){
 if(!currentUser) return;
 const userId=currentUser.id;
 const targetId=String(targetUserId);
 const request=++dmRequestToken;
 const thread=document.getElementById('dmThread');
 if(thread) thread.innerHTML='<div class="dm-loading">Loading messages...</div>';
 try {
  await loadDMProfile(targetUserId);
  const {data,error}=await supabaseClient.from('direct_messages').select('*')
   .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${userId})`)
   .order('created_at',{ascending:true});
  if(error) throw error;
  if(request!==dmRequestToken||String(activeChat)!==targetId||String(currentUser?.id)!==String(userId)) return;
  const messagesById=new Map((data||[]).map(message=>[String(message.id),message]));
  dmMessages.forEach(message=>{if(message.id) messagesById.set(String(message.id),message);});
  dmMessages=[...messagesById.values()].sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
  setDMView('thread');
  renderDMThread();
 } catch(error) {
  if(request!==dmRequestToken||String(activeChat)!==targetId) return;
  console.error('Direct message history error:',error);
  if(thread) thread.innerHTML='<div class="dm-error">Could not load this conversation.</div>';
  toast(error?.message||'Unable to load messages.');
 }
}

function handleDMRealtimeMessage(message){
 if(!currentUser || !message) return;
 const partner=dmPartnerId(message);
 if(!partner) return;
 const existing=dmConversations.find(item=>String(item.userId)===partner);
 if(existing) existing.lastMessage=message;
 else dmConversations.unshift({userId:partner,lastMessage:message});
 renderDMInbox();
 if(!dmProfiles.has(partner)){
  void loadDMProfile(partner).then(renderDMInbox).catch(error=>{
   console.error('Direct message sender profile error:',error);
  });
 }
 if(String(activeChat)===partner&&!dmMessages.some(item=>String(item.id)===String(message.id))){
  dmMessages.push(message);
  dmMessages.sort((a,b)=>new Date(a.created_at||0)-new Date(b.created_at||0));
  renderDMThread();
 }
}

function subscribeToDirectMessages(){
 if(dmChannel || !currentUser) return;
 const userId=String(currentUser.id);
 dmChannel=supabaseClient.channel(`direct-messages-${userId}-${Date.now()}`)
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages'},payload=>{
   const message=payload.new;
   const sender=String(message.sender_id||message.from_user_id||'');
   const receiver=String(message.receiver_id||message.to_user_id||'');
   if(sender===userId||receiver===userId) handleDMRealtimeMessage(message);
  })
  .subscribe(status=>{
   if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){
    console.error('Direct message realtime subscription status:',status);
    toast('Live messages are temporarily unavailable.');
   }
  });
}

function openDMActionSheet(userId){
 dmActionTargetUserId=String(userId||'');
 const sheet=document.getElementById('dmActionSheet');
 if(!sheet) return;
 sheet.classList.add('open');
 sheet.setAttribute('aria-hidden','false');
}

function closeDMActionSheet(){
 const sheet=document.getElementById('dmActionSheet');
 sheet?.classList.remove('open');
 sheet?.setAttribute('aria-hidden','true');
 dmActionTargetUserId=null;
}

async function confirmDeleteConversation(){
 const targetId=dmActionTargetUserId;
 if(!currentUser||!isValidUserUuid(targetId)) return;
 closeDMActionSheet();
 try{
  const {error}=await supabaseClient.from('direct_messages').delete()
   .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${currentUser.id})`);
  if(error) throw error;
  dmConversations=dmConversations.filter(item=>String(item.userId)!==targetId);
  if(String(activeChat)===targetId){
   activeChat=null;
   dmMessages=[];
   setDMView('inbox');
  }
  renderDMInbox();
  toast('Conversation deleted');
 }catch(error){
  console.error('Conversation deletion error:',error);
  toast(error?.message||'Unable to delete this conversation.');
 }
}

function toggleDMEmojiPicker(){
 const picker=document.getElementById('dmEmojiPicker');
 if(picker) picker.hidden=!picker.hidden;
}

function insertDMEmoji(emoji){
 const input=document.getElementById('messageText');
 if(!input) return;
 const start=input.selectionStart??input.value.length;
 const end=input.selectionEnd??start;
 input.setRangeText(emoji,start,end,'end');
 input.focus();
}

async function toggleVoiceNoteRecording(){
 if(dmVoiceRecorder?.state==='recording'){
  dmVoiceRecorder.stop();
  return;
 }
 if(!currentUser||!activeChat){toast('Open a conversation before recording a voice note.');return;}
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
  toast('Voice recording is not supported in this browser.');
  return;
 }
 const receiverId=String(activeChat);
 const button=document.getElementById('dmVoiceButton');
 try{
  dmVoiceStream=await navigator.mediaDevices.getUserMedia({audio:true});
  dmVoiceChunks=[];
  dmVoiceRecorder=new MediaRecorder(dmVoiceStream);
  dmVoiceRecorder.addEventListener('dataavailable',event=>{if(event.data?.size) dmVoiceChunks.push(event.data);});
  dmVoiceRecorder.addEventListener('stop',()=>{
   const blob=new Blob(dmVoiceChunks,{type:dmVoiceRecorder?.mimeType||'audio/webm'});
   const stream=dmVoiceStream;
   dmVoiceStream=null;
   stream?.getTracks().forEach(track=>track.stop());
   dmVoiceRecorder=null;
   dmVoiceChunks=[];
   if(button){button.classList.remove('recording');button.setAttribute('aria-label','Record voice note');}
   if(blob.size) void sendVoiceNoteBlob(blob,receiverId);
  },{once:true});
  dmVoiceRecorder.start();
  if(button){button.classList.add('recording');button.setAttribute('aria-label','Stop recording voice note');}
 }catch(error){
  dmVoiceStream?.getTracks().forEach(track=>track.stop());
  dmVoiceStream=null;
  dmVoiceRecorder=null;
  console.error('Voice note recording error:',error);
  toast(error?.message||'Unable to start voice recording.');
 }
}

async function sendVoiceNoteBlob(blob,receiverId){
 if(!currentUser||!isValidUserUuid(receiverId)) return;
 try{
  const extension=blob.type.includes('ogg')?'ogg':blob.type.includes('mp4')?'m4a':'webm';
  const path=`${currentUser.id}/voice-notes/${Date.now()}.${extension}`;
  const voicePublicUrl = await uploadToCloudinary(new File([blob], `voice-${Date.now()}.${extension}`, { type: blob.type || 'audio/webm' }));
  const {data:message,error:messageError}=await supabaseClient.from('direct_messages').insert({
   sender_id:currentUser.id,
   receiver_id:receiverId,
   message_text:`[[voice-note:${encodeURIComponent(voicePublicUrl)}]]`
  }).select('*').single();
  if(messageError) throw messageError;
  if(!message) throw new Error('The voice note message was not returned.');
  if(String(activeChat)===receiverId&&!dmMessages.some(item=>String(item.id)===String(message.id))){
   dmMessages.push(message);
   renderDMThread();
  }
  handleDMRealtimeMessage(message);
 }catch(error){
  console.error('Voice note send error:',error);
  toast(error?.message||'Unable to send voice note.');
 }
}

function openDMDrawer(targetUserId=null){
 if(!currentUser){openAuthModal('login');return;}
 const drawer=document.getElementById('dmDrawer');
 if(!drawer) return;
 drawer.classList.add('open');
 drawer.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 subscribeToDirectMessages();
 if(targetUserId!==null&&targetUserId!==undefined) void openChat(targetUserId);
 else showDMInbox();
}

async function showDMInbox(){
 activeChat=null;
 dmRequestToken++;
 setDMView('inbox');
 await loadDMInbox();
}

function closeDMDrawer(){
 const drawer=document.getElementById('dmDrawer');
 if(!drawer) return;
 drawer.classList.remove('open');
 drawer.setAttribute('aria-hidden','true');
 document.body.style.overflow='';
 activeChat=null;
 dmRequestToken++;
 dmMessages=[];
 if(dmChannel){
  const channel=dmChannel;
  dmChannel=null;
  void supabaseClient.removeChannel(channel).catch(error=>console.error('Direct message channel cleanup error:',error));
 }
}

async function openChat(id){
 if(!currentUser){openAuthModal('login');return;}
 if(String(id)===String(currentUser.id)) return;
 let recipient;
 try {
  recipient=await resolveDMRecipient(id);
 } catch(error) {
  console.error('Direct message recipient validation error:',error);
  window.alert(error?.message||'Cannot open this conversation because the recipient user ID is invalid.');
  return;
 }
 if(String(recipient.id)===String(currentUser.id)) return;
 const drawer=document.getElementById('dmDrawer');
 if(!drawer) return;
 drawer.classList.add('open');
 drawer.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 subscribeToDirectMessages();
 dmMessages=[];
 activeChat=String(recipient.id);
 dmProfiles.set(activeChat,recipient);
 setDMView('thread');
 await loadDMConversation(activeChat);
 const messageInput=document.getElementById('messageText');
 const emojiPicker=document.getElementById('dmEmojiPicker');
 if(emojiPicker) emojiPicker.hidden=true;
 messageInput?.focus();
}

async function sendMessage(event){
 event?.preventDefault();
 if(!currentUser||dmSending) return;
 const input=document.getElementById('messageText');
 const button=document.getElementById('dmSendButton');
 const text=input?.value.trim();
 const senderId=String(currentUser.id||'').trim();
 const receiverId=String(activeChat||'').trim();
 if(!isValidUserUuid(senderId)||String(senderId)!==String(currentUser.id)){
  const error=new Error('The sender user ID is invalid. Please sign in again.');
  console.error('Direct message payload validation error:',error,{senderId,receiverId});
  window.alert(error.message);
  return;
 }
 if(!isValidUserUuid(receiverId)){
  const error=new Error('The recipient user ID is missing or invalid. Reopen this chat from the user profile and try again.');
  console.error('Direct message payload validation error:',error,{senderId,receiverId});
  window.alert(error.message);
  return;
 }
 if(!text) return;
 const storyMetadata=pendingStoryReplyMetadata;
 const messageText=storyMetadata?`${text.trim()}\n[[story-preview:${encodeURIComponent(String(storyMetadata.id))}:${encodeURIComponent(String(storyMetadata.url))}]]`:text.trim();
 const messagePayload={sender_id:senderId,receiver_id:receiverId,message_text:messageText};
 dmSending=true;
 if(button) button.disabled=true;
 try {
  const {data,error}=await supabaseClient.from('direct_messages').insert(messagePayload).select('*').single();
  if(error) throw error;
  if(!data) throw new Error('The sent message was not returned.');
  if(storyMetadata===pendingStoryReplyMetadata) pendingStoryReplyMetadata=null;
  if(String(activeChat)===String(receiverId)){
   if(!dmMessages.some(message=>String(message.id)===String(data.id))) dmMessages.push(data);
   renderDMThread();
   input.value='';
   const emojiPicker=document.getElementById('dmEmojiPicker');
   if(emojiPicker) emojiPicker.hidden=true;
  }
  handleDMRealtimeMessage(data);
 } catch(error) {
  console.error('Direct message send error:',error);
  toast(error?.message||'Unable to send message.');
 } finally {
  if(storyMetadata===pendingStoryReplyMetadata) pendingStoryReplyMetadata=null;
  dmSending=false;
  if(button) button.disabled=false;
  input?.focus();
 }
}

function renderNotifications(){
 const list=document.getElementById('notificationList');
 if(!list) return;
 list.innerHTML = notifications.length ? notifications.map(n=>`<div class="person"><div>${safe(n)}</div></div>`).join('') : '<div class="empty">No recent activity.</div>';
}

function updateNotificationBadge(){
 const dot=document.getElementById('notificationDot');
 if(dot) dot.hidden=!activityNotifications.some(item=>!item.is_read);
}

function activityActor(notification){
 const profile=notification.sender_profile||notification.profiles;
 const actor=Array.isArray(profile)?profile[0]:profile;
 return {
  id:String(notification.sender_id||notification.actor_id||''),
  username:actor?.username||notification.sender_username||'user',
  name:actor?.full_name||actor?.display_name||actor?.name||actor?.username||'Someone',
  avatar:actor?.avatar_url||actor?.profile_avatar_url||avatarPlaceholder
 };
}

function activityText(notification){
 const type=String(notification.type||'').toLowerCase();
 if(type==='like'||type==='reel_like') return 'liked your reel ♥';
 if(type==='post_like') return 'liked your post ♥';
 if(type==='comment'){
  const snippet=String(notification.comment_text||notification.content||'').trim();
  return `commented on your post: ${snippet?`"${snippet.slice(0,70)}${snippet.length>70?'…':''}"`:''}`;
 }
 if(type==='reply'){
  const snippet=String(notification.comment_text||notification.content||'').trim();
  return `replied to your comment${snippet?`: "${snippet.slice(0,60)}"`:''}`;
 }
 if(type==='comment_like') return 'liked your comment ♥';
 if(type==='follow') return 'started following you';
 return notification.message||'interacted with your post';
}

function renderActivityNotifications(){
 const list=document.getElementById('activityList');
 const markReadButton=document.getElementById('activityMarkRead');
 if(markReadButton) markReadButton.disabled=!activityNotifications.some(item=>!item.is_read);
 if(!list) return;
 if(!activityNotifications.length){
  list.innerHTML='<div class="activity-empty">You’re all caught up.</div>';
  updateNotificationBadge();
  return;
 }
 list.innerHTML=activityNotifications.map((notification,index)=>{
  const actor=activityActor(notification);
  const reelId=notification.reel_id||notification.post_id||'';
  const reel=reels.find(item=>String(item.id)===String(reelId))||archivedReels.find(item=>String(item.id)===String(reelId));
  const thumbnail=notification.thumbnail_url||reel?.src||'';
  const type=String(notification.type||'').toLowerCase();
  const isFollowing=follows.has(actor.id)||Boolean(followStates.get(actor.id)?.isFollowing);
  return `<article class="activity-item ${notification.is_read?'':'unread'}" data-activity-index="${index}">
   <img class="activity-avatar" src="${safe(avatarSrc(actor.avatar))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt="">
   <span class="activity-copy"><b>${safe(actor.username)}</b> ${safe(activityText(notification))}<time class="activity-time">${safe(formatCommentTime(notification.created_at))}</time></span>
   ${type==='follow'?`<button class="${isFollowing?'secondary following':'primary'} activity-follow" type="button" data-activity-follow="${safe(actor.id)}" ${pendingFollows.has(actor.id)?'disabled':''}>${pendingFollows.has(actor.id)?'...':isFollowing?'Following':'Follow back'}</button>`:['like','reel_like','post_like','comment','reply','comment_like'].includes(type)?`<button class="activity-thumb-button" type="button" data-activity-reel="${safe(reelId)}" aria-label="View post"><img class="activity-thumb" src="${safe(thumbnail||avatarPlaceholder)}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""></button>`:''}
  </article>`;
 }).join('');
 list.querySelectorAll('[data-activity-follow]').forEach(button=>button.addEventListener('click',event=>{
  event.stopPropagation();
  void toggleFollow(button.dataset.activityFollow);
 }));
 list.querySelectorAll('[data-activity-reel]').forEach(button=>button.addEventListener('click',()=>{
  openActivityPost(button.dataset.activityReel);
 }));
 list.querySelectorAll('.activity-item').forEach(item=>item.addEventListener('click',event=>{
  if(event.target.closest('button')) return;
  const notification=activityNotifications[Number(item.dataset.activityIndex)];
  const actor=activityActor(notification);
  if(actor.id) viewProfile(actor.id);
  closeActivityDrawer();
 }));
 updateNotificationBadge();
}

async function loadActivityNotifications(){
 if(!currentUser) return;
 const userId=String(currentUser.id);
 const request=++activityRequestToken;
 const list=document.getElementById('activityList');
 if(list && !activityNotifications.length) list.innerHTML='<div class="activity-empty">Loading activity...</div>';
 try {
  const {data,error}=await supabaseClient.from('user_notifications').select('*').eq('receiver_id',userId).order('created_at',{ascending:false}).limit(75);
  if(error) throw error;
  if(request!==activityRequestToken||String(currentUser?.id)!==userId) return;
  const rows=data||[];
  const senderIds=[...new Set(rows.map(item=>String(item.sender_id||'')).filter(Boolean))];
  const reelIds=[...new Set(rows.map(item=>String(item.post_id||'')).filter(Boolean))];
  const commentRows=rows.filter(item=>['comment','reply'].includes(String(item.type||'').toLowerCase()));
  const commentPostIds=[...new Set(commentRows.map(item=>String(item.post_id||'')).filter(Boolean))];
  const [profilesResult,reelsResult,commentsResult]=await Promise.all([
   senderIds.length?supabaseClient.from('profiles').select('*').in('id',senderIds):Promise.resolve({data:[],error:null}),
   reelIds.length?supabaseClient.from('reels').select('*').in('id',reelIds):Promise.resolve({data:[],error:null}),
   commentPostIds.length&&senderIds.length?supabaseClient.from('post_comments').select('*').in('reel_id',commentPostIds).in('user_id',senderIds).order('created_at',{ascending:false}).limit(150):Promise.resolve({data:[],error:null})
  ]);
  if(profilesResult.error) throw profilesResult.error;
  if(reelsResult.error) console.error('Activity post preview fetch error:',reelsResult.error);
  if(commentsResult.error) console.error('Activity comment preview fetch error:',commentsResult.error);
  if(currentUser?.id===userId&&senderIds.length){
   try { await loadFollowingStates(senderIds); }
   catch(error){console.error('Activity follow state fetch error:',error);}
  }
  const profilesById=new Map((profilesResult.data||[]).map(profile=>[String(profile.id),profile]));
  const reelsById=new Map((reelsResult.data||[]).map(reel=>[String(reel.id),normalizeReel(reel,0)]));
  activityNotifications=rows.map(item=>{
   const senderId=String(item.sender_id||'');
   const reelId=String(item.post_id||'');
   const profile=profilesById.get(senderId);
   const reel=reelsById.get(reelId);
   const comment=['comment','reply'].includes(String(item.type||'').toLowerCase())
    ?(commentsResult.data||[]).filter(row=>String(row.user_id)===senderId&&String(row.reel_id)===reelId)
      .sort((a,b)=>Math.abs(new Date(a.created_at||0)-new Date(item.created_at||0))-Math.abs(new Date(b.created_at||0)-new Date(item.created_at||0)))[0]
    :null;
   return {...item,reel_id:item.post_id,sender_profile:profile||null,reel_preview:reel||null,comment_text:item.comment_text||comment?.comment_text||'',thumbnail_url:item.thumbnail_url||reel?.src||null,is_read:Boolean(item.is_read)};
  });
  renderActivityNotifications();
  if(document.getElementById('activityDrawer')?.classList.contains('open')) await markActivityNotificationsRead();
 } catch(error) {
  if(request!==activityRequestToken) return;
  console.error('Activity notifications fetch error:',error);
  if(list) list.innerHTML='<div class="activity-empty">Unable to load notifications. Please try again.</div>';
  toast(error?.message||'Unable to load notifications.');
 }
}

async function markActivityNotificationsRead(){
 if(!currentUser) return;
 const unreadIds=activityNotifications.filter(item=>!item.is_read).map(item=>item.id).filter(Boolean);
 if(!unreadIds.length) return;
 activityNotifications=activityNotifications.map(item=>({...item,is_read:true}));
 renderActivityNotifications();
 try {
  const {error}=await supabaseClient.from('user_notifications').update({is_read:true}).eq('receiver_id',currentUser.id).in('id',unreadIds);
  if(error) throw error;
 } catch(error) {
  activityNotifications=activityNotifications.map(item=>unreadIds.includes(item.id)?{...item,is_read:false}:item);
  renderActivityNotifications();
  console.error('Mark notifications read error:',error);
  toast(error?.message||'Unable to mark notifications as read.');
 }
}

async function createActivityNotification(recipientId,type,{reelId,commentText,silent=true}={}){
 if(!currentUser||!recipientId||!isValidUserUuid(String(recipientId))||String(recipientId)===String(currentUser.id)) return;
 const payload={receiver_id:recipientId,sender_id:currentUser.id,type,is_read:false};
 if(reelId!==undefined&&reelId!==null) payload.post_id=reelId;
 try {
  let {data,error}=await supabaseClient.from('user_notifications').insert(payload).select('*').single();
  if(error && payload.post_id !== undefined){
   // Retry without post_id if post_id column type (uuid vs int) differs
   const retry = await supabaseClient.from('user_notifications').insert({receiver_id:recipientId,sender_id:currentUser.id,type,is_read:false}).select('*').single();
   data = retry.data; error = retry.error;
  }
  if(error) throw error;
  if(data&&String(currentUser?.id)!==String(recipientId)){
   const existing=new Set(activityNotifications.map(item=>String(item.id)));
   if(data.id&&!existing.has(String(data.id))){
    const sender={id:currentUser.id,username:currentProfile||me.username,full_name:me.name,avatar_url:me.pic};
    activityNotifications.unshift({...data,reel_id:data.post_id,comment_text:commentText||'',sender_profile:sender,is_read:Boolean(data.is_read)});
    renderActivityNotifications();
   }
  }
 } catch(error) {
  if(!silent){
   console.error(`${type} notification insert error:`,error);
   toast(error?.message||'Your action succeeded, but its notification could not be sent.');
  }
 }
}

function toggleActivityDrawer(){
 if(document.getElementById('activityDrawer')?.classList.contains('open')) closeActivityDrawer();
 else openActivityDrawer();
}

function openActivityDrawer(){
 if(!currentUser){openAuthModal('login');return;}
 const drawer=document.getElementById('activityDrawer');
 if(!drawer) return;
 activityPreviousOverflow=document.body.style.overflow;
 drawer.classList.add('open');
 drawer.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 subscribeToActivityNotifications();
 void loadActivityNotifications();
}

function closeActivityDrawer(){
 const drawer=document.getElementById('activityDrawer');
 if(!drawer) return;
 drawer.classList.remove('open');
 drawer.setAttribute('aria-hidden','true');
 document.body.style.overflow=activityPreviousOverflow;
 activityPreviousOverflow='';
}

function openActivityPost(reelId){
 const notification=activityNotifications.find(item=>String(item.post_id||'')===String(reelId));
 const cachedReel=reels.find(item=>String(item.id)===String(reelId))||archivedReels.find(item=>String(item.id)===String(reelId))||likedReelItems.find(item=>String(item.id)===String(reelId));
 closeActivityDrawer();
 if(cachedReel){openReel(cachedReel.id);return;}
 const reel=notification?.reel_preview;
 const mediaUrl=reel?.src||notification?.thumbnail_url;
 if(!mediaUrl) return;
 const postDetail=document.getElementById('postDetail');
 if(!postDetail) return;
 const isVideo=reel?.video||/\.(mp4|webm|ogg|m4v|mov|mkv|3gp)(\?|$)/i.test(mediaUrl);
 const media=isVideo?`<video class="postmedia" controls autoplay playsinline src="${safe(mediaUrl)}"></video>`:`<img class="postmedia" src="${safe(mediaUrl)}" alt="Post">`;
 postDetail.innerHTML=`<div class="post glass">${media}<div class="caption">${safe(reel?.caption||notification?.caption||'')}</div></div>`;
 show('postModal');
 const video=postDetail.querySelector('video');
 if(video) void video.play().catch(error=>console.info('Post video autoplay was blocked:',error));
}

function subscribeToActivityNotifications(){
 if(activityChannel||!currentUser) return;
 const userId=String(currentUser.id);
 activityChannel=supabaseClient.channel(`user-notifications-${userId}-${Date.now()}`)
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'user_notifications',filter:`receiver_id=eq.${userId}`},payload=>{
   const incoming=payload.new;
   if(!incoming) return;
   const exists=activityNotifications.some(item=>String(item.id)===String(incoming.id));
   if(!exists) activityNotifications.unshift({...incoming,is_read:Boolean(incoming.is_read)});
   void loadActivityNotifications();
   updateNotificationBadge();
  })
  .subscribe(status=>{
   if(status==='CHANNEL_ERROR'||status==='TIMED_OUT') console.error('Activity realtime subscription status:',status);
  });
}

function closeActivityRealtime(){
 if(!activityChannel) return;
 const channel=activityChannel;
 activityChannel=null;
 void supabaseClient.removeChannel(channel).catch(error=>console.error('Activity channel cleanup error:',error));
}

function normalizeReel(reel, index) {
  const src = reel.media_url || reel.video_url || reel.src || reel.url || reel.video || '';
  const id = reel.id ?? reel.reel_id ?? index + 1;
  const userId = reel.user_id ?? reel.user ?? '';
  const isArchived=Boolean(reel.is_archived || String(reel.status||'').toLowerCase()==='archived');
  return {
    kind: 'reel',
    id,
    user: userId,
    username: reel.username || '',
    src,
    media_type: reel.media_type || reel.mime_type || '',
    created_at: reel.created_at || '',
    likes_count: Number(reel.likes_count ?? reel.like_count ?? reel.likes ?? 0),
    views_count: Number(reel.views_count ?? reel.view_count ?? reel.views ?? 0),
    status: isArchived ? 'archived' : (reel.status || ''),
    isArchived,
    visibility: reel.visibility || reel.privacy || '',
    isPublic: reel.is_public,
    caption: reel.caption || reel.title || 'Discover something beautiful',
    audioTitle: reel.audio_title || reel.audio_name || reel.music_title || '',
    likes: Number(reel.likes ?? reel.likes_count ?? reel.like_count ?? 0),
    commentCount: Number(reel.comment_count ?? reel.comments_count ?? (Array.isArray(reel.comments) ? reel.comments.length : 0)),
    liked: Boolean(reel.liked),
    video: Boolean(reel.video || String(reel.media_type||reel.mime_type||'').trim().toLowerCase()==='video' || /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(String(src)))
  };
}

function isOwnReel(reel){
 return Boolean(currentUser && String(reel.user)===String(currentUser.id));
}

function isPublicActiveReel(reel){
 const status=String(reel.status||'').toLowerCase();
 const visibility=String(reel.visibility||'').toLowerCase();
 return !reel.isArchived && status!=='archived' && (!status || ['active','published','public'].includes(status))
   && (!visibility || visibility==='public') && reel.isPublic!==false;
}

function reelAuthorName(reel){
 if(isOwnReel(reel)) return currentProfile || me.username;
 return reel.username || user(reel.user).username;
}

function isStrictReelVideo(reel){
 const mediaType=String(reel.media_type||'').trim().toLowerCase();
 const url=String(reel.src||'').split(/[?#]/)[0];
 return mediaType==='video'||/\.(mp4|webm|mov)$/i.test(url);
}

async function loadReels(){
  let loadSucceeded=false;
  reelsLoading=true;
  if(!reels.length) renderReels();
  try {
    const { data, error } = await supabaseClient.from('reels').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    loadSucceeded=true;
    const loadedReels=(data || []).map(normalizeReel);
    const loadedIds=new Set(loadedReels.map(reel=>String(reel.id)));
    const creatorIds=[...new Set(loadedReels.map(reel=>String(reel.user)).filter(id=>id&&id!==String(currentUser?.id)))];
    if(creatorIds.length){
      try{
        const {data:creatorProfiles,error:creatorError}=await supabaseClient.from('profiles').select('id, username, full_name, avatar_url, bio').in('id',creatorIds);
        if(creatorError) throw creatorError;
        (creatorProfiles||[]).forEach(profile=>{
          const username=profile.username||String(profile.id).slice(0,8);
          users=users.filter(existing=>String(existing.id)!==String(profile.id));
          users.push({id:profile.id,name:profile.full_name||profile.display_name||username,username,pic:profile.avatar_url||avatarPlaceholder,bio:profile.bio||'',followers:0,following:0});
        });
      }catch(profileError){
        console.error('Reel creator profile lookup error:',profileError);
        toast(profileError?.message||'Creator profile details could not be loaded.');
      }
    }
    reels=[
      ...loadedReels.filter(reel=>isPublicActiveReel(reel)),
      ...reels.filter(reel=>!loadedIds.has(String(reel.id)) && isPublicActiveReel(reel))
    ];
    archivedReels=[
      ...loadedReels.filter(reel=>reel.isArchived && isOwnReel(reel)),
      ...archivedReels.filter(reel=>!loadedIds.has(String(reel.id)) && isOwnReel(reel))
    ];
    await loadReelLikes();
  } catch (err) {
    console.error('Supabase reels fetch error:', err);
    toast(err?.message||'Unable to refresh reels.');
  } finally {
    reelsLoading=false;
  }
  renderReels();
  renderExplore();
  renderProfile();
  renderSaved();
  renderFeed();
  startVisibleReel();
  return loadSucceeded;
}

async function loadReelLikes(){
 if(!currentUser){
  likedReels.clear();
  likedReelItems=[];
  reels.forEach(reel=>{reel.liked=false;});
  renderReels();
  renderProfile();
  return;
 }
 const userId=currentUser.id;
 try {
  const { data, error }=await supabaseClient.from('reel_likes').select('reel_id').eq('user_id',userId);
  if(error) throw error;
  if(currentUser?.id!==userId) return;
  likedReels=new Set((data||[]).map(row=>String(row.reel_id)));
  reels.forEach(reel=>{reel.liked=likedReels.has(String(reel.id));});
  const knownReels=new Map([...reels,...archivedReels].map(reel=>[String(reel.id),reel]));
  const missingIds=[...likedReels].filter(reelId=>!knownReels.has(reelId));
  let fetchedReels=[];
  if(missingIds.length){
   const {data:likedData,error:likedError}=await supabaseClient.from('reels').select('*').in('id',missingIds);
   if(likedError) throw likedError;
   fetchedReels=(likedData||[]).map(normalizeReel);
  }
  const fetchedById=new Map(fetchedReels.map(reel=>[String(reel.id),reel]));
  likedReelItems=[...likedReels].map(reelId=>{
   const reel=knownReels.get(reelId)||fetchedById.get(reelId);
   if(!reel) return null;
   reel.liked=true;
   return reel;
  }).filter(Boolean);
  renderReels();
  renderProfile();
 } catch(error) {
  console.error('Reel likes fetch error:',error);
  toast(error?.message||'Unable to load reel likes.');
 }
}

function renderReels(){
 const reelList=document.getElementById('reelList');
 if(!reelList) return;
 if(reelsLoading&&!reels.length){
  reelList.innerHTML=Array.from({length:2},()=>`<div class="reel-skeleton-card" aria-hidden="true"><div class="skeleton-block skeleton-media"></div><div class="reel-skeleton-info"><i class="skeleton-block reel-skeleton-line"></i><i class="skeleton-block reel-skeleton-line" style="width:44%"></i></div></div>`).join('');
  return;
 }
 const visibleReels=reels.filter(isStrictReelVideo);
 muted=!Boolean(window.isGlobalAudioUnmuted);
 window.isReelsMuted=muted;
 if(!visibleReels.length){
   reelPlaybackObserver?.disconnect();
   reelPlaybackObserver=null;
   pauseReelVideos();
   reelList.innerHTML='<div class="empty">No reels available yet.</div>';
   return;
 }
 reelList.innerHTML=visibleReels.map((reel,index)=>{
   const author=user(reel.user);
   const authorUsername=reelAuthorName(reel);
   const audioLabel=reel.audioTitle || `Original Audio • ${authorUsername}`;
   const creatorAvatar=avatarSrc(author.pic);
   const media=reel.video
    ? `<video id="reel-video-${index}" ${window.isReelsMuted?'muted':''} loop playsinline src="${safe(reel.src)}"></video>`
    : `<img src="${safe(reel.src)}" alt="Reel">`;
   const liked=likedReels.has(String(reel.id));
   return `
  <div class="reel" data-reel-card="${safe(reel.id)}">
    ${isOwnReel(reel)?`<button class="reel-manage" aria-label="Manage your post" onclick="openReelMenu('${safe(reel.id)}')">⋯</button>`:''}
    ${reel.video?`<button class="sound-btn" aria-label="${muted?'Unmute':'Mute'} reel" onclick="toggleMute(${index},this.closest('.reel'))">${muted?'🔇':'🔊'}</button>`:''}
   <div class="reel-media" data-reel-media data-like-media data-like-kind="reel" data-like-id="${safe(reel.id)}" data-reel-id="${safe(reel.id)}">${media}<span class="reel-sound-indicator" aria-hidden="true"></span>${reel.video?`<div class="reel-progress-track" data-reel-progress role="slider" tabindex="0" aria-label="Video progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="reel-progress-fill"></span></div>`:''}<span class="reel-long-press-indicator" aria-hidden="true">Paused</span></div>
   <div class="reel-shade"></div>
   <div class="reel-info">
     <div class="reel-user"><img src="${safe(avatarSrc(author.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'"><button onclick="viewProfile('${safe(reel.user)}')">@${safe(authorUsername)}</button></div>
     <p>${renderTaggedText(reel.caption)}</p>
     <button class="reel-audio-tag" type="button" aria-label="Toggle reel sound: ${safe(audioLabel)}" onclick="toggleReelsMute(this.closest('.reel'))">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      <span class="reel-audio-title" aria-hidden="true"><span class="reel-audio-track">♫ ${safe(audioLabel)}　•　♫ ${safe(audioLabel)}</span></span>
     </button>
   </div>
   <div class="reel-side">
     <button class="reel-like-button ${liked?'active':''}" aria-label="${liked?'Unlike reel':'Like reel'}" aria-pressed="${liked}" data-reel-like="${safe(reel.id)}" onclick="toggleReelLike('${safe(reel.id)}')">♥</button>
     <small data-reel-like-count="${safe(reel.id)}">${Number(reel.likes || 0).toLocaleString()}</small>
     <button class="action reel-bookmark-button ${savedReels.has(String(reel.id))?'saved':''}" type="button" data-bookmark-reel="${safe(reel.id)}" aria-label="${savedReels.has(String(reel.id))?'Remove bookmark':'Save reel'}" aria-pressed="${savedReels.has(String(reel.id))}" onclick="toggleSaveReel('${safe(reel.id)}')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.75h12v17l-6-4-6 4v-17Z"/></svg></button>
     <small>${savedReels.has(String(reel.id))?'Saved':'Save'}</small>
     <button aria-label="View comments" onclick="openCommentsDrawer('${safe(reel.id)}')">💬</button>
     <small class="reel-comment-count" data-reel-comment-count="${safe(reel.id)}">${Number(reel.commentCount||0).toLocaleString()}</small>
     <button class="reel-share-button" aria-label="Share reel" onclick="shareReel('${safe(reel.id)}')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4Z"/></svg></button>
   </div>
   <div class="reel-vinyl-wrap" aria-hidden="true"><div class="reel-vinyl-disc"><img src="${safe(creatorAvatar)}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""></div></div>
  </div>`;
 }).join('');
 reelList.querySelectorAll('video').forEach(video=>{
  const applyOrientation=()=>video.classList.toggle('reel-video-portrait',video.videoHeight>video.videoWidth);
  if(video.readyState>=1) applyOrientation();
  else video.addEventListener('loadedmetadata',applyOrientation,{once:true});
  video.addEventListener('timeupdate',()=>updateReelProgress(video));
  video.addEventListener('loadedmetadata',()=>updateReelProgress(video));
  video.addEventListener('durationchange',()=>updateReelProgress(video));
  video.addEventListener('playing',()=>setReelDiscPlaying(video,true));
  ['pause','ended','waiting','stalled','emptied'].forEach(eventName=>video.addEventListener(eventName,()=>setReelDiscPlaying(video,false)));
 });
 reelList.querySelectorAll('[data-reel-progress]').forEach(track=>{
  track.addEventListener('pointerdown',event=>{
   event.preventDefault();
   track.setPointerCapture?.(event.pointerId);
   seekReelAtPointer(track,event.clientX);
  });
  track.addEventListener('pointermove',event=>{
   if(event.buttons||event.pressure) seekReelAtPointer(track,event.clientX);
  });
  track.addEventListener('keydown',event=>{
   const video=track.closest('.reel-media')?.querySelector('video');
   if(!video||!Number.isFinite(video.duration)) return;
   const delta=event.key==='ArrowRight'?5:event.key==='ArrowLeft'?-5:0;
   if(!delta) return;
   event.preventDefault();
   video.currentTime=Math.max(0,Math.min(video.duration,video.currentTime+delta));
   updateReelProgress(video);
  });
 });
 observeReelPlayback();
}

function updateReelProgress(video){
 const duration=Number(video?.duration);
 const current=Number(video?.currentTime)||0;
 const percent=Number.isFinite(duration)&&duration>0?Math.max(0,Math.min(100,current/duration*100)):0;
 const track=video?.closest('.reel-media')?.querySelector('[data-reel-progress]');
 const fill=track?.querySelector('.reel-progress-fill');
 if(fill) fill.style.width=`${percent}%`;
 if(track) track.setAttribute('aria-valuenow',String(Math.round(percent)));
}

function seekReelAtPointer(track,clientX){
 const video=track.closest('.reel-media')?.querySelector('video');
 if(!video||!Number.isFinite(video.duration)||video.duration<=0) return;
 const rect=track.getBoundingClientRect();
 const ratio=Math.max(0,Math.min(1,(clientX-rect.left)/Math.max(1,rect.width)));
 video.currentTime=ratio*video.duration;
 updateReelProgress(video);
}

function formatCommentTime(value){
 const timestamp=value ? new Date(value).getTime() : Date.now();
 if(!Number.isFinite(timestamp)) return 'Just now';
 const seconds=Math.max(0,Math.floor((Date.now()-timestamp)/1000));
 if(seconds<60) return 'Just now';
 const minutes=Math.floor(seconds/60);
 if(minutes<60) return `${minutes}m ago`;
 const hours=Math.floor(minutes/60);
 if(hours<24) return `${hours}h ago`;
 const days=Math.floor(hours/24);
 if(days<7) return `${days}d ago`;
 return new Date(timestamp).toLocaleDateString();
}

function commentAuthor(comment){
 const profile=Array.isArray(comment.profiles)?comment.profiles[0]:comment.profiles;
 const username=profile?.username || comment.username || (currentUser && String(comment.user_id)===String(currentUser.id) ? currentProfile : '') || 'user';
 const name=profile?.full_name || profile?.display_name || comment.full_name || username;
 const pic=profile?.avatar_url || profile?.profile_avatar_url || (currentUser && String(comment.user_id)===String(currentUser.id) ? me.pic : '') || avatarPlaceholder;
 return {username,name,pic};
}

function renderComments(comments){
 const list=document.getElementById('commentsList');
 if(!list) return;
 if(!comments.length){
  list.innerHTML='<div class="comments-empty">No comments yet. Start the conversation!</div>';
  return;
 }
 const byParent=new Map();
 comments.forEach(comment=>{
  const parentId=String(comment.parent_id||'');
  if(!byParent.has(parentId)) byParent.set(parentId,[]);
  byParent.get(parentId).push(comment);
 });
 const renderComment=(comment,depth=0)=>{
  const author=commentAuthor(comment);
  const id=String(comment.id||'');
  const liked=commentLikes.has(id);
  const count=commentLikeCounts.get(id)||0;
  const row=`<article class="comment-item ${depth?'reply':''}" data-comment-id="${safe(id)}" style="${depth>1?`margin-left:${Math.min(depth,5)*42}px`:''}"><img class="comment-avatar" src="${safe(avatarSrc(author.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""><div class="comment-content"><span class="comment-author">${safe(author.username)}</span>${renderTaggedText(comment.comment_text || comment.text || '')}<time class="comment-time">${safe(formatCommentTime(comment.created_at))}</time><div class="comment-actions"><button class="comment-like ${liked?'liked':''}" type="button" aria-label="${liked?'Unlike':'Like'} comment" aria-pressed="${liked}" onclick="toggleCommentLike('${safe(id)}')">♥ <span>${Number(count).toLocaleString()}</span></button><button type="button" data-reply-comment-id="${safe(id)}" data-reply-username="${safe(author.username)}">Reply</button></div></div></article>`;
  const replies=(byParent.get(id)||[]).map(reply=>renderComment(reply,depth+1)).join('');
  return row+replies;
 };
 const roots=comments.filter(comment=>!comment.parent_id||!comments.some(candidate=>String(candidate.id)===String(comment.parent_id)));
 list.innerHTML=roots.map(comment=>renderComment(comment)).join('');
 list.querySelectorAll('[data-reply-comment-id]').forEach(button=>button.addEventListener('click',event=>{
  event.preventDefault();
  event.stopPropagation();
  const row=button.closest('[data-comment-id]');
  const parentCommentId=String(button.dataset.replyCommentId||row?.dataset.commentId||'').trim();
  replyToComment(parentCommentId,button.dataset.replyUsername);
 }));
}

async function loadCommentLikeState(comments){
 commentLikes=new Set();
 commentLikeCounts=new Map();
 const ids=comments.map(comment=>String(comment.id)).filter(Boolean);
 if(!ids.length||!currentUser) return;
 const {data,error}=await supabaseClient.from('comment_likes').select('comment_id,user_id').in('comment_id',ids);
 if(error) throw error;
 (data||[]).forEach(row=>{
  const id=String(row.comment_id);
  commentLikeCounts.set(id,(commentLikeCounts.get(id)||0)+1);
  if(String(row.user_id)===String(currentUser.id)) commentLikes.add(id);
 });
}

function replyToComment(commentId,username){
 const candidate=String(commentId??'').trim();
 const isReplying=candidate.length>0;
 const parent=isReplying?activeComments.find(comment=>comment.id!==null&&comment.id!==undefined&&String(comment.id)===candidate):null;
 const label=String(username||'').trim()||(parent?commentAuthor(parent).username:'user');
 activeCommentParentId=isReplying?candidate:null;
 const input=document.getElementById('commentsInput');
 const replyLabel=document.getElementById('commentReplyingTo');
 if(input){
  input.value=isReplying?`@${label} `:'';
  input.placeholder=isReplying?`Replying to @${label}...`:`Add a comment as @${currentProfile || me.username || 'user'}...`;
  input.focus();
 }
 if(replyLabel){replyLabel.hidden=!isReplying;replyLabel.textContent=isReplying?`Replying to @${label}`:'';}
}

async function toggleCommentLike(commentId){
 if(!currentUser){openAuthModal('login');return;}
 const id=String(commentId);
 if(!id||pendingCommentLikes.has(id)) return;
 const wasLiked=commentLikes.has(id);
 const shouldLike=!wasLiked;
 const targetComment=activeComments.find(item=>String(item.id)===id);
 const previousCount=commentLikeCounts.get(id)||0;
 pendingCommentLikes.add(id);
 if(shouldLike) commentLikes.add(id); else commentLikes.delete(id);
 commentLikeCounts.set(id,Math.max(0,previousCount+(shouldLike?1:-1)));
 const update=()=>{
  const row=[...document.querySelectorAll('[data-comment-id]')].find(item=>item.dataset.commentId===id);
  const button=row?.querySelector('.comment-like');
  if(button){
   button.classList.toggle('liked',commentLikes.has(id));
   button.setAttribute('aria-pressed',String(commentLikes.has(id)));
   button.setAttribute('aria-label',commentLikes.has(id)?'Unlike comment':'Like comment');
   const count=button.querySelector('span');
   if(count) count.textContent=Number(commentLikeCounts.get(id)||0).toLocaleString();
  }
 };
 update();
 try{
  if(shouldLike){
   const {error}=await supabaseClient.from('comment_likes').insert({comment_id:id,user_id:currentUser.id});
   if(error) throw error;
  }else{
   const {data,error}=await supabaseClient.from('comment_likes').delete().eq('comment_id',id).eq('user_id',currentUser.id).select('comment_id').maybeSingle();
   if(error) throw error;
   if(!data) throw new Error('The comment like could not be found.');
  }
  if(shouldLike){
   if(targetComment) await createActivityNotification(targetComment.user_id,'comment_like',{reelId:targetComment.reel_id});
  }
 }catch(error){
  if(wasLiked) commentLikes.add(id); else commentLikes.delete(id);
  commentLikeCounts.set(id,previousCount);
  update();
  console.error('Comment like update error:',error);
  toast(error?.message||'Unable to update comment like.');
 }finally{
  pendingCommentLikes.delete(id);
 }
}

function updateCommentCounts(reelId,count){
 const reel=reels.find(item=>String(item.id)===String(reelId)) || archivedReels.find(item=>String(item.id)===String(reelId));
 if(reel) reel.commentCount=count;
 document.querySelectorAll('[data-reel-comment-count]').forEach(el=>{if(el.dataset.reelCommentCount===String(reelId)) el.textContent=Number(count).toLocaleString();});
 document.querySelectorAll('[data-post-comment-count]').forEach(el=>{if(el.dataset.postCommentCount===String(reelId)) el.textContent=Number(count).toLocaleString();});
}

async function openCommentsDrawer(reelId){
 if(!currentUser){ openAuthModal('login'); return; }
 activeCommentReelId=String(reelId);
 activeCommentParentId=null;
 activeComments=[];
 const token=++commentLoadToken;
 const drawer=document.getElementById('commentsDrawer');
 const list=document.getElementById('commentsList');
 const input=document.getElementById('commentsInput');
 const avatarPreview=document.getElementById('commentsAvatar');
 if(!drawer || !list || !input || !avatarPreview) return;
 const reel=reels.find(item=>String(item.id)===activeCommentReelId);
 const localPost=posts.find(item=>String(item.id)===activeCommentReelId);
 const initialCount=reel?.commentCount ?? localPost?.comments?.length ?? 0;
 document.getElementById('commentsTotal').textContent=`(${Number(initialCount).toLocaleString()})`;
 input.placeholder=`Add a comment as @${currentProfile || me.username || 'user'}...`;
 input.value='';
 const replyLabel=document.getElementById('commentReplyingTo');
 if(replyLabel){replyLabel.hidden=true;replyLabel.textContent='';}
 avatarPreview.src=avatarSrc(me.pic);
 list.innerHTML='<div class="comments-loading">Loading comments...</div>';
 drawer.classList.add('open');
 drawer.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 try {
  let {data,error}=await supabaseClient.from('post_comments')
   .select('*, profiles(*)')
   .eq('reel_id',reelId)
   .order('created_at',{ascending:true});
  if(error && (error.code==='PGRST200' || error.code==='PGRST201' || /relationship.*profiles|profiles.*relationship/i.test(error.message||''))){
   const commentsResult=await supabaseClient.from('post_comments').select('*').eq('reel_id',reelId).order('created_at',{ascending:true});
   if(commentsResult.error) throw commentsResult.error;
   data=commentsResult.data||[];
   const userIds=[...new Set(data.map(comment=>comment.user_id).filter(Boolean).map(String))];
   if(userIds.length){
    const profilesResult=await supabaseClient.from('profiles').select('*').in('id',userIds);
    if(profilesResult.error) throw profilesResult.error;
    const profilesById=new Map((profilesResult.data||[]).map(profile=>[String(profile.id),profile]));
    data=data.map(comment=>({...comment,profiles:profilesById.get(String(comment.user_id))||null}));
   }
  }else if(error) throw error;
  if(token!==commentLoadToken || activeCommentReelId!==String(reelId)) return;
  const comments=data||[];
  activeComments=comments;
  try{
   await loadCommentLikeState(comments);
  }catch(likeError){
   console.error('Comment likes fetch error:',likeError);
   toast(likeError?.message||'Comment likes could not be loaded.');
  }
  if(token!==commentLoadToken || activeCommentReelId!==String(reelId)) return;
  renderComments(comments);
  document.getElementById('commentsTotal').textContent=`(${comments.length.toLocaleString()})`;
  updateCommentCounts(reelId,comments.length);
 } catch(error) {
  if(token!==commentLoadToken || activeCommentReelId!==String(reelId)) return;
  console.error('Comments fetch error:',error);
  list.innerHTML='<div class="comments-error">Could not load comments. Please try again.</div>';
  toast(error?.message || 'Unable to load comments.');
 }
}

function closeCommentsDrawer(){
 const drawer=document.getElementById('commentsDrawer');
 if(!drawer) return;
 drawer.classList.remove('open');
 drawer.setAttribute('aria-hidden','true');
 activeCommentReelId=null;
 activeCommentParentId=null;
 activeComments=[];
 commentLoadToken++;
 document.body.style.overflow='';
}

async function submitReelComment(event){
 event?.preventDefault();
 const input=document.getElementById('commentsInput');
 const button=document.getElementById('commentsPostButton');
 const text=input?.value.trim();
 if(!text || activeCommentReelId===null || commentsSubmitting) return;
 if(!currentUser){ openAuthModal('login'); return; }
 const targetReelId=String(activeCommentReelId);
 const parentCandidate=String(activeCommentParentId??'').trim();
 const targetParentComment=parentCandidate
  ? activeComments.find(comment=>comment.id!==null&&comment.id!==undefined&&String(comment.id)===parentCandidate)
  : null;
 const parentId=parentCandidate||null;
 commentsSubmitting=true;
 if(button) button.disabled=true;
 try {
  const {data,error}=await supabaseClient.from('post_comments').insert({
   reel_id:targetReelId,
   user_id:currentUser.id,
   comment_text:text,
   ...(parentId!==null?{parent_id:parentId}:{})
  }).select('*').single();
  if(error) throw error;
  if(!data) throw new Error('The comment was not returned after saving.');
  triggerInteractionFeedback();
  const commentedReel=reels.find(reel=>String(reel.id)===targetReelId)||archivedReels.find(reel=>String(reel.id)===targetReelId);
  if(targetParentComment) await createActivityNotification(targetParentComment.user_id,'reply',{reelId:targetReelId,commentText:text});
  else if(commentedReel) await createActivityNotification(commentedReel.user,'comment',{reelId:commentedReel.id,commentText:text});
  if(activeCommentReelId===targetReelId&&activeCommentReelId===String(data.reel_id ?? targetReelId)){
   const list=document.getElementById('commentsList');
   const empty=list?.querySelector('.comments-empty, .comments-error');
   if(empty) empty.remove();
   const row={...data,user_id:data.user_id||currentUser.id,comment_text:data.comment_text||text,created_at:data.created_at||new Date().toISOString(),parent_id:data.parent_id??parentId??null,username:currentProfile,full_name:me.name};
   activeComments.push(row);
   renderComments(activeComments);
   if(list) list.scrollTop=list.scrollHeight;
   input.value='';
   activeCommentParentId=null;
   input.placeholder=`Add a comment as @${currentProfile || me.username || 'user'}...`;
   const replyLabel=document.getElementById('commentReplyingTo');
   if(replyLabel){replyLabel.hidden=true;replyLabel.textContent='';}
   const total=document.getElementById('commentsTotal');
   const count=(Number(total?.textContent?.replace(/[^\d]/g,''))||0)+1;
   if(total) total.textContent=`(${count.toLocaleString()})`;
   updateCommentCounts(activeCommentReelId,count);
  }
 } catch(error) {
  console.error('Comment insert error:',error);
  toast(error?.message || 'Unable to post your comment.');
 } finally {
  commentsSubmitting=false;
  if(button) button.disabled=false;
 }
}

let commentsDragStartY=null;
document.getElementById('commentsHandle')?.addEventListener('pointerdown',event=>{
 commentsDragStartY=event.clientY;
 event.currentTarget.setPointerCapture?.(event.pointerId);
});
document.getElementById('commentsHandle')?.addEventListener('pointerup',event=>{
 if(commentsDragStartY!==null && event.clientY-commentsDragStartY>80) closeCommentsDrawer();
 commentsDragStartY=null;
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape' && document.getElementById('commentsDrawer')?.classList.contains('open')) closeCommentsDrawer();
 if(event.key==='Escape' && document.getElementById('dmDrawer')?.classList.contains('open')) closeDMDrawer();
 if(event.key==='Escape' && document.getElementById('dmActionSheet')?.classList.contains('open')) closeDMActionSheet();
 if(event.key==='Escape' && document.getElementById('noteActionSheet')?.classList.contains('open')) closeNoteActionSheet();
 if(event.key==='Escape' && document.getElementById('reelShareDrawer')?.classList.contains('open')) closeReelShareDrawer();
 if(event.key==='Escape' && document.getElementById('activityDrawer')?.classList.contains('open')) closeActivityDrawer();
 if(event.key==='Escape' && document.getElementById('settingsSheet')?.classList.contains('open')) closeSettingsSheet();
});

let reelPlaybackObserver=null;
let activeReelVideo=null;

function pauseReelVideos(){
 document.querySelectorAll('#reelList video').forEach(video=>{
  video.pause();
  video.muted=true;
  video.volume=0;
  setReelDiscPlaying(video,false);
  try { video.currentTime=0; } catch(error) { console.info('Reel playback reset deferred:',error); }
 });
 activeReelVideo=null;
}

function setReelDiscPlaying(video,playing){
 const disc=video?.closest('.reel')?.querySelector('.reel-vinyl-disc');
 if(!disc) return;
 disc.classList.toggle('is-playing',Boolean(playing&&video===activeReelVideo&&!video.paused&&!video.ended));
}

function syncActiveReelVideo(){
 const reelList=document.getElementById('reelList');
 const reelsPage=document.getElementById('reels');
 if(!reelList||!reelsPage?.classList.contains('active')){
  pauseReelVideos();
  return;
 }
 const bounds=reelList.getBoundingClientRect();
 let bestVideo=null;
 let bestRatio=0;
 reelList.querySelectorAll('.reel').forEach(card=>{
  const rect=card.getBoundingClientRect();
  const overlapWidth=Math.max(0,Math.min(rect.right,bounds.right)-Math.max(rect.left,bounds.left));
  const overlapHeight=Math.max(0,Math.min(rect.bottom,bounds.bottom)-Math.max(rect.top,bounds.top));
  const ratio=(overlapWidth*overlapHeight)/Math.max(1,rect.width*rect.height);
  if(ratio>bestRatio){bestRatio=ratio;bestVideo=card.querySelector('video');}
 });
 if(bestRatio<.7) bestVideo=null;
 reelList.querySelectorAll('video').forEach(video=>{
  if(video!==bestVideo){
   video.pause();
   video.muted=true;
   video.volume=0;
   setReelDiscPlaying(video,false);
   try { video.currentTime=0; } catch(error) { console.info('Reel playback reset deferred:',error); }
  }
 });
 if(!bestVideo){activeReelVideo=null;return;}
 activeReelVideo=bestVideo;
 muted=!Boolean(window.isGlobalAudioUnmuted);
 window.isReelsMuted=muted;
 bestVideo.muted=muted;
 bestVideo.volume=muted?0:1.0;
 bestVideo.play().catch(error=>{
  // Browser autoplay policy fallback: play muted first, then unmute on next tap
  bestVideo.muted=true;
  bestVideo.volume=0;
  bestVideo.play().catch(()=>{});
 });
}

function observeReelPlayback(){
 const reelList=document.getElementById('reelList');
 if(!reelList) return;
 reelPlaybackObserver?.disconnect();
 reelPlaybackObserver=null;
 if('IntersectionObserver' in window){
  reelPlaybackObserver=new IntersectionObserver(()=>syncActiveReelVideo(),{root:reelList,threshold:[0,.7,.8,1]});
  reelList.querySelectorAll('.reel').forEach(card=>reelPlaybackObserver.observe(card));
 }
 syncActiveReelVideo();
}

function startVisibleReel(){
 syncActiveReelVideo();
}

function showReelSoundIndicator(reelCard){
 const indicator=reelCard?.querySelector('.reel-sound-indicator');
 if(!indicator) return;
 indicator.innerHTML=muted
  ? '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m22 9-6 6m0-6 6 6"/></svg>'
  : '<svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13"/></svg>';
 indicator.classList.remove('visible');
 void indicator.offsetWidth;
 indicator.classList.add('visible');
}

function toggleReelsMute(reelCard){
 muted=!muted;
 window.isGlobalAudioUnmuted=!muted;
 window.isReelsMuted=muted;
 document.querySelectorAll('#reelList video').forEach(video=>{video.muted=muted;video.volume=muted?0:1.0;});
 document.querySelectorAll('#reelList .sound-btn').forEach(button=>{
  button.textContent=muted?'🔇':'🔊';
  button.setAttribute('aria-label',muted?'Unmute':'Mute');
 });
 showReelSoundIndicator(reelCard);
 if(activeReelVideo){
  activeReelVideo.muted=muted;
  activeReelVideo.volume=muted?0:1.0;
  if(!muted) activeReelVideo.play().catch(error=>console.info('Unmuted reel playback was blocked:',error));
 }
}

function toggleMute(index,reelCard){
 toggleReelsMute(reelCard||document.getElementById(`reel-video-${index}`)?.closest('.reel'));
}

function updateReelLikeUI(reel){
 const reelId=String(reel.id);
 const liked=likedReels.has(reelId);
 document.querySelectorAll('[data-reel-like]').forEach(button=>{
  if(button.dataset.reelLike!==reelId) return;
  button.classList.toggle('active',liked);
  button.setAttribute('aria-pressed',String(liked));
  button.setAttribute('aria-label',liked?'Unlike reel':'Like reel');
 });
 document.querySelectorAll('[data-reel-like-count]').forEach(counter=>{
  if(counter.dataset.reelLikeCount===reelId) counter.textContent=Number(reel.likes||0).toLocaleString();
 });
}

async function toggleReelLike(id){
 if(!currentUser){ openAuthModal('login'); return; }
 const reel=reels.find(item=>String(item.id)===String(id));
 if(!reel || pendingReelLikes.has(String(id))) return;
 const userId=currentUser.id;
 const reelId=String(reel.id);
 const wasLiked=likedReels.has(reelId);
 const shouldLike=!wasLiked;
 const previousCount=Number(reel.likes_count??reel.likes??0);
 if(shouldLike) triggerInteractionFeedback();
 let likeMutationCommitted=false;
 pendingReelLikes.add(reelId);
 if(shouldLike) likedReels.add(reelId); else likedReels.delete(reelId);
 reel.liked=shouldLike;
 reel.likes=Math.max(0,previousCount+(shouldLike?1:-1));
 reel.likes_count=reel.likes;
 likedReelItems=likedReelItems.filter(item=>String(item.id)!==reelId);
 if(shouldLike) likedReelItems.unshift(reel);
 updateReelLikeUI(reel);
 if(profileTab==='likes' && document.getElementById('profile')?.classList.contains('active')) renderProfile();

 try {
  if(shouldLike){
   const {error}=await supabaseClient.from('reel_likes').insert({user_id:userId,reel_id:reel.id});
   if(error) throw error;
   likeMutationCommitted=true;
  }else{
   const {data,error}=await supabaseClient.from('reel_likes').delete().eq('user_id',userId).eq('reel_id',reel.id).select('reel_id').maybeSingle();
   if(error) throw error;
   if(!data) throw new Error('The reel like was not found.');
   likeMutationCommitted=true;
  }

  const {count,error:countError}=await supabaseClient.from('reel_likes').select('reel_id',{count:'exact',head:true}).eq('reel_id',reel.id);
  if(countError) console.info('Reel like count lookup skipped:',countError.message);
  if(Number.isFinite(count)){
   reel.likes=Math.max(0,count);
   reel.likes_count=reel.likes;
  }
  updateReelLikeUI(reel);
  const {error:mirrorError}=await supabaseClient.from('reels').update({likes_count:reel.likes}).eq('id',reel.id);
  if(mirrorError) console.info('Reel like count mirror skipped:',mirrorError.message);
  if(shouldLike){
   try { await createActivityNotification(reel.user,'reel_like',{reelId:reel.id}); }
   catch(notificationError){ console.info('Reel like notification skipped:',notificationError?.message); }
  }
  if(currentUser?.id===userId && profileTab==='likes' && document.getElementById('profile')?.classList.contains('active')) renderProfile();
 } catch(error) {
  if(likeMutationCommitted && shouldLike){
   likedReels.delete(reelId);
   try {
    const {error:rollbackError}=await supabaseClient.from('reel_likes').delete().eq('user_id',userId).eq('reel_id',reel.id);
    if(rollbackError) throw rollbackError;
   } catch(rollbackError) {
    console.error('Reel like rollback error:',rollbackError);
   }
  }else if(likeMutationCommitted){
   likedReels.add(reelId);
   try {
    const {error:rollbackError}=await supabaseClient.from('reel_likes').insert({user_id:userId,reel_id:reel.id});
    if(rollbackError) throw rollbackError;
   } catch(rollbackError) {
    console.error('Reel unlike rollback error:',rollbackError);
   }
  }
  if(!likeMutationCommitted){
   if(wasLiked) likedReels.add(reelId); else likedReels.delete(reelId);
   reel.liked=wasLiked;
   reel.likes=previousCount;
   reel.likes_count=previousCount;
   likedReelItems=likedReelItems.filter(item=>String(item.id)!==reelId);
   if(wasLiked) likedReelItems.unshift(reel);
   updateReelLikeUI(reel);
   if(profileTab==='likes' && document.getElementById('profile')?.classList.contains('active')) renderProfile();
  }
  console.info('Reel like sync deferred:',error?.message||error);
 } finally {
  pendingReelLikes.delete(reelId);
 }
}

function spawnLikeHeart(media){
 const heart=document.createElement('span');
 const isReel=media.dataset.likeKind==='reel';
 heart.className=`double-tap-heart${isReel?' reel-heart':''}`;
 heart.setAttribute('aria-hidden','true');
 heart.innerHTML=`<svg viewBox="0 0 100 100" focusable="false"><path d="M50 86 15 53C-8 29 9 5 30 9c9 2 15 8 20 16 5-8 11-14 20-16 21-4 38 20 15 44L50 86Z" fill="${isReel?'#fff':'#ff3040'}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>`;
 media.appendChild(heart);
 const removeHeart=()=>heart.remove();
 heart.addEventListener('animationend',removeHeart,{once:true});
 window.setTimeout(removeHeart,700);
}

function handleMediaDoubleTap(media){
 const id=media?.dataset.likeId;
 if(!id) return;
 spawnLikeHeart(media);
 if(media.dataset.likeKind==='reel'){
  if(!likedReels.has(String(id))) void toggleReelLike(id);
 }else{
  const post=posts.find(item=>String(item.id)===String(id));
  if(post&&!post.liked) toggleLike(post.id);
 }
}

const mediaTouchTaps=new WeakMap();
const mediaDoubleTapHandled=new WeakMap();
const mediaSingleTapTimers=new WeakMap();
const reelLongPressTimers=new WeakMap();
let activeReelLongPress=null;
let lastReelTouchAt=0;
document.addEventListener('dblclick',event=>{
 const media=event.target.closest('[data-like-media]');
 if(!media||event.target.closest('[data-reel-progress],button,input,textarea,select')) return;
 event.preventDefault();
 const now=Date.now();
 clearTimeout(mediaSingleTapTimers.get(media));
 if(now-(mediaDoubleTapHandled.get(media)||0)<500) return;
 mediaDoubleTapHandled.set(media,now);
 handleMediaDoubleTap(media);
});
document.addEventListener('click',event=>{
 const media=event.target.closest('[data-like-kind="reel"][data-like-media]');
 if(!media||event.target.closest('[data-reel-progress],button,input,textarea,select')) return;
 if(media.dataset.suppressNextTap==='true'){delete media.dataset.suppressNextTap;return;}
 if(event.pointerType==='touch'||Date.now()-lastReelTouchAt<700) return;
 if(event.detail>1){clearTimeout(mediaSingleTapTimers.get(media));return;}
 clearTimeout(mediaSingleTapTimers.get(media));
 mediaSingleTapTimers.set(media,setTimeout(()=>toggleReelsMute(media.closest('.reel')),320));
});
document.addEventListener('touchstart',event=>{
 const media=event.target.closest('[data-like-media]');
 if(!media||event.target.closest('[data-reel-progress],button,input,textarea,select')) return;
 lastReelTouchAt=Date.now();
 const touch=event.changedTouches[0];
 if(!touch) return;
 const now=Date.now();
 const previous=mediaTouchTaps.get(media);
 if(previous&&now-previous.time<320&&Math.hypot(touch.clientX-previous.x,touch.clientY-previous.y)<36){
 mediaTouchTaps.delete(media);
 clearTimeout(mediaSingleTapTimers.get(media));
 event.preventDefault();
 mediaDoubleTapHandled.set(media,now);
 handleMediaDoubleTap(media);
 }else{
 const tap={time:now,x:touch.clientX,y:touch.clientY};
 mediaTouchTaps.set(media,tap);
 if(media.dataset.likeKind==='reel'){
  clearTimeout(mediaSingleTapTimers.get(media));
  mediaSingleTapTimers.set(media,setTimeout(()=>{
   if(mediaTouchTaps.get(media)===tap){
    mediaTouchTaps.delete(media);
    toggleReelsMute(media.closest('.reel'));
   }
  },500));
 }
 }
},{passive:false});

document.addEventListener('pointerdown',event=>{
 const media=event.target.closest('[data-like-kind="reel"][data-like-media]');
 const video=media?.querySelector('video');
 if(!media||!video||event.target.closest('[data-reel-progress],button,input,textarea,select')) return;
 activeReelLongPress={media,video,pointerId:event.pointerId,wasPlaying:!video.paused,x:event.clientX,y:event.clientY};
 reelLongPressTimers.set(media,setTimeout(()=>{
  if(activeReelLongPress?.media!==media||!activeReelLongPress.wasPlaying) return;
  video.pause();
  setReelDiscPlaying(video,false);
  media.closest('.reel')?.classList.add('long-pressed');
  media.dataset.suppressNextTap='true';
  clearTimeout(mediaSingleTapTimers.get(media));
  mediaTouchTaps.delete(media);
 },400));
});

document.addEventListener('pointermove',event=>{
 if(!activeReelLongPress||event.pointerId!==activeReelLongPress.pointerId) return;
 if(Math.hypot(event.clientX-activeReelLongPress.x,event.clientY-activeReelLongPress.y)>14){
  clearTimeout(reelLongPressTimers.get(activeReelLongPress.media));
  activeReelLongPress=null;
 }
});

function finishReelLongPress(event){
 const press=activeReelLongPress;
 if(!press||event.pointerId!==press.pointerId) return;
 clearTimeout(reelLongPressTimers.get(press.media));
 const card=press.media.closest('.reel');
 const wasLongPressed=card?.classList.contains('long-pressed');
 card?.classList.remove('long-pressed');
 activeReelLongPress=null;
 if(wasLongPressed&&press.wasPlaying&&press.video.isConnected){
  void press.video.play().catch(error=>console.info('Reel resume after long-press was blocked:',error));
 }
}

document.addEventListener('pointerup',finishReelLongPress);
document.addEventListener('pointercancel',finishReelLongPress);

function localSavedPostsKey(userId=currentUser?.id){
 return userId?`vybe:saved-posts:${userId}`:null;
}

function restoreLocalSavedPosts(userId){
 const key=localSavedPostsKey(userId);
 if(!key) return;
 try{
  const parsed=JSON.parse(localStorage.getItem(key)||'[]');
  saved=new Set(Array.isArray(parsed)?parsed.map(String):[]);
 }catch(error){
  console.error('Local saved posts restore error:',error);
  toast('Unable to restore locally saved posts.');
 }
}

function persistLocalSavedPosts(){
 const key=localSavedPostsKey();
 if(!key) return false;
 try{
  localStorage.setItem(key,JSON.stringify([...saved].map(String)));
  return true;
 }catch(error){
  console.error('Local saved posts persistence error:',error);
  toast(error?.message||'Unable to save this demo post locally.');
  return false;
 }
}

function updateBookmarkButtons(){
 document.querySelectorAll('[data-bookmark-post]').forEach(button=>{
  const key=String(button.dataset.bookmarkPost);
  const isSaved=saved.has(key)||savedReels.has(key);
  button.classList.toggle('saved',isSaved);
  button.setAttribute('aria-pressed',String(isSaved));
  button.setAttribute('aria-label',isSaved?'Remove bookmark':'Save post');
 });
 document.querySelectorAll('[data-bookmark-reel]').forEach(button=>{
  const key=String(button.dataset.bookmarkReel);
  const isSaved=savedReels.has(key);
  button.classList.toggle('saved',isSaved);
  button.setAttribute('aria-pressed',String(isSaved));
  button.setAttribute('aria-label',isSaved?'Remove bookmark':'Save reel');
  if(button.nextElementSibling) button.nextElementSibling.textContent=isSaved?'Saved':'Save';
 });
}

async function loadSavedReels(){
 if(!currentUser){
  savedReels.clear();
  savedReelItems=[];
  savedBookmarksLoading=false;
  renderSaved();
  renderProfile();
  updateBookmarkButtons();
  return;
 }
 const userId=currentUser.id;
 const token=++bookmarkLoadToken;
 restoreLocalSavedPosts(userId);
 savedBookmarksLoading=true;
 renderSaved();
 try{
  const {data,error}=await supabaseClient.from('bookmarks').select('reel_id,reels(*)').eq('user_id',userId);
  if(error) throw error;
  if(token!==bookmarkLoadToken||String(currentUser?.id)!==String(userId)) return;
  const rows=data||[];
  const bookmarkedIds=new Set(rows.map(row=>String(row.reel_id)).filter(Boolean));
  const joinedReels=rows.map(row=>{
   const joined=Array.isArray(row.reels)?row.reels[0]:row.reels;
   return joined?normalizeReel(joined,0):null;
  }).filter(Boolean);
  const joinedIds=new Set(joinedReels.map(reel=>String(reel.id)));
  const missingIds=[...bookmarkedIds].filter(id=>!joinedIds.has(id));
  let fetchedReels=[];
  if(missingIds.length){
   const {data:fetched,error:fetchError}=await supabaseClient.from('reels').select('*').in('id',missingIds);
   if(fetchError) throw fetchError;
   fetchedReels=(fetched||[]).map(reel=>normalizeReel(reel,0));
  }
  if(token!==bookmarkLoadToken||String(currentUser?.id)!==String(userId)) return;
  savedReels=bookmarkedIds;
  savedReelItems=[...joinedReels,...fetchedReels.filter(reel=>!joinedIds.has(String(reel.id)))];
  updateBookmarkButtons();
 }catch(error){
  if(token!==bookmarkLoadToken) return;
  console.error('Bookmarks fetch error:',error);
  toast(error?.message||'Unable to load saved items.');
 }finally{
  if(token===bookmarkLoadToken){
   savedBookmarksLoading=false;
   renderSaved();
   renderProfile();
  }
 }
}

async function toggleSaveReel(id){
 if(!currentUser){openAuthModal('login');return;}
 const reel=reels.find(item=>String(item.id)===String(id))
  ||archivedReels.find(item=>String(item.id)===String(id))
  ||savedReelItems.find(item=>String(item.id)===String(id));
 if(!reel) return;
 const key=String(reel.id);
 if(pendingBookmarks.has(key)) return;
 const wasSaved=savedReels.has(key);
 triggerInteractionFeedback();
 pendingBookmarks.add(key);
 if(wasSaved){
  savedReels.delete(key);
  savedReelItems=savedReelItems.filter(item=>String(item.id)!==key);
 }else{
  savedReels.add(key);
  if(!savedReelItems.some(item=>String(item.id)===key)) savedReelItems.unshift(reel);
 }
 updateBookmarkButtons();
 renderSaved();
 try{
  if(wasSaved){
   const {error}=await supabaseClient.from('bookmarks').delete().eq('user_id',currentUser.id).eq('reel_id',reel.id);
   if(error) throw error;
  }else{
   const {error}=await supabaseClient.from('bookmarks').insert({user_id:currentUser.id,reel_id:reel.id});
   if(error) throw error;
  }
  toast(wasSaved?'Removed from saved':'Saved to collection');
 }catch(error){
  if(wasSaved){
   savedReels.add(key);
   savedReelItems.unshift(reel);
  }else{
   savedReels.delete(key);
   savedReelItems=savedReelItems.filter(item=>String(item.id)!==key);
  }
  console.error('Bookmark update error:',error);
  toast(error?.message||'Unable to update bookmark.');
 }finally{
  pendingBookmarks.delete(key);
  updateBookmarkButtons();
  renderSaved();
 }
}

function openReelMenu(id){
 const reel=reels.find(item=>String(item.id)===String(id)) || archivedReels.find(item=>String(item.id)===String(id)) || likedReelItems.find(item=>String(item.id)===String(id));
 if(!reel || !isOwnReel(reel)) return;
 const title=document.getElementById('listTitle');
 const content=document.getElementById('listContent');
 if(!title||!content) return;
 title.textContent='Manage post';
 content.innerHTML=`
  ${reel.isArchived?`<button class="secondary" style="width:100%;margin:8px 0" onclick="unarchiveReel('${safe(reel.id)}')">Unarchive / Show on Profile</button>`:`<button class="secondary" style="width:100%;margin:8px 0" onclick="archiveReel('${safe(reel.id)}')">Archive</button>`}
  <button class="secondary" style="width:100%;margin:8px 0" onclick="deleteReel('${safe(reel.id)}')">Delete</button>`;
 show('listModal');
}

function isMissingArchivedColumn(error){
 return error?.code==='42703' || error?.code==='PGRST204' || /is_archived.*(column|schema cache)|column.*is_archived/i.test(error?.message||'');
}

async function saveReelArchiveState(reel, archived){
 const status=archived?'archived':'active';
 let result=await supabaseClient.from('reels').update({status,is_archived:archived}).eq('id',reel.id).eq('user_id',currentUser.id).select('*').maybeSingle();
 if(result.error && isMissingArchivedColumn(result.error)){
  result=await supabaseClient.from('reels').update({status}).eq('id',reel.id).eq('user_id',currentUser.id).select('*').maybeSingle();
 }
 if(result.error) throw result.error;
 if(!result.data) throw new Error(`The post could not be ${archived?'archived':'unarchived'}.`);
 return normalizeReel({...reel,...result.data,status,is_archived:archived},0);
}

async function archiveReel(id){
 const reel=reels.find(item=>String(item.id)===String(id));
 if(!reel || !isOwnReel(reel)) return;
 try {
  const archived=await saveReelArchiveState(reel,true);
  reels=reels.filter(item=>String(item.id)!==String(reel.id));
  archivedReels=[archived,...archivedReels.filter(item=>String(item.id)!==String(reel.id))];
  hide('listModal');
  renderReels(); renderExplore(); renderProfile(); renderSaved();
  toast('Post archived');
 } catch(error) {
  console.error('Reel archive error:', error);
  toast(error?.message || 'Unable to archive this post.');
 }
}

async function unarchiveReel(id){
 const reel=archivedReels.find(item=>String(item.id)===String(id));
 if(!reel || !isOwnReel(reel)) return;
 try {
  const restored=await saveReelArchiveState(reel,false);
  archivedReels=archivedReels.filter(item=>String(item.id)!==String(reel.id));
  reels=[restored,...reels.filter(item=>String(item.id)!==String(reel.id))];
  hide('listModal');
  renderReels(); renderExplore(); renderProfile(); renderSaved();
  toast('Post restored to your profile');
 } catch(error) {
  console.error('Reel unarchive error:',error);
  toast(error?.message || 'Unable to unarchive this post.');
 }
}

async function deleteReel(id){
 const reel=reels.find(item=>String(item.id)===String(id)) || archivedReels.find(item=>String(item.id)===String(id));
 if(!reel || !isOwnReel(reel) || !window.confirm('Delete this post permanently?')) return;
 try {
  const { data, error }=await supabaseClient.from('reels').delete().eq('id',reel.id).eq('user_id',currentUser.id).select('id').maybeSingle();
  if(error) throw error;
  if(!data) throw new Error('The post could not be deleted.');
  reels=reels.filter(item=>String(item.id)!==String(reel.id));
  archivedReels=archivedReels.filter(item=>String(item.id)!==String(reel.id));
  savedReels.delete(String(reel.id));
  savedReelItems=savedReelItems.filter(item=>String(item.id)!==String(reel.id));
  hide('listModal');
  renderReels(); renderExplore(); renderProfile(); renderSaved();
  toast('Post deleted');
 } catch(error) {
  console.error('Reel deletion error:', error);
  toast(error?.message || 'Unable to delete this post.');
 }
}

async function toggleLike(postId){
 if(!currentUser){openAuthModal('login');return;}
 const post=posts.find(item=>String(item.id)===String(postId));
 if(!post||pendingPostLikes.has(String(post.id))) return;
 const previousLiked=Boolean(post.liked);
 const previousCount=Number(post.likes_count??post.likes??0);
 const shouldLike=!previousLiked;
 pendingPostLikes.add(String(post.id));
 post.liked=shouldLike;
 post.likes=Math.max(0,previousCount+(shouldLike?1:-1));
 post.likes_count=post.likes;
 if(shouldLike) triggerInteractionFeedback();
 document.querySelectorAll('[data-post-like]').forEach(button=>{
  if(button.dataset.postLike!==String(post.id)) return;
  button.classList.toggle('liked',shouldLike);
  button.setAttribute('aria-pressed',String(shouldLike));
  button.setAttribute('aria-label',shouldLike?'Unlike post':'Like post');
 });
 document.querySelectorAll('[data-post-like-count]').forEach(counter=>{
  if(counter.dataset.postLikeCount===String(post.id)) counter.textContent=Number(post.likes).toLocaleString();
 });
 renderExplore();
 renderProfile();
 try{
  if(shouldLike&&currentUser){
   await createActivityNotification(post.user,'post_like',{reelId:post.id});
  }
 }catch(error){
  post.liked=previousLiked;
  post.likes=previousCount;
  post.likes_count=previousCount;
  document.querySelectorAll('[data-post-like]').forEach(button=>{
   if(button.dataset.postLike!==String(post.id)) return;
   button.classList.toggle('liked',previousLiked);
   button.setAttribute('aria-pressed',String(previousLiked));
   button.setAttribute('aria-label',previousLiked?'Unlike post':'Like post');
  });
  document.querySelectorAll('[data-post-like-count]').forEach(counter=>{
   if(counter.dataset.postLikeCount===String(post.id)) counter.textContent=previousCount.toLocaleString();
  });
  console.error('Post like update error:',error);
  toast(error?.message||'Unable to update post like.');
 }finally{
  pendingPostLikes.delete(String(post.id));
 }
}

async function toggleSave(postId){
 if(!currentUser){openAuthModal('login');return;}
 const key=String(postId);
 let reel=reels.find(item=>String(item.id)===key)
  ||archivedReels.find(item=>String(item.id)===key)
  ||savedReelItems.find(item=>String(item.id)===key);
 if(!reel&&isValidUserUuid(key)){
  try{
   const {data,error}=await supabaseClient.from('reels').select('*').eq('id',key).maybeSingle();
   if(error) throw error;
   if(data){
    reel=normalizeReel(data,0);
    if(!reels.some(item=>String(item.id)===key)) reels.unshift(reel);
   }
  }catch(error){
   console.error('Bookmark reel lookup error:',error);
   toast(error?.message||'Unable to save this post.');
   return;
  }
 }
 if(reel){await toggleSaveReel(reel.id);return;}
 const wasSaved=saved.has(key);
 if(!wasSaved) triggerInteractionFeedback();
 if(wasSaved) saved.delete(key);
 else saved.add(key);
 const persisted=persistLocalSavedPosts();
 if(!persisted){
  if(wasSaved) saved.add(key);
  else saved.delete(key);
 }
 updateBookmarkButtons();
 renderSaved();
 renderProfile();
 if(persisted) toast(wasSaved?'Removed from saved':'Saved to collection');
}

async function toggleFollow(userId){
 if(!currentUser){openAuthModal('login');return;}
 const targetId=String(userId);
 const followerId=String(currentUser.id);
 if(targetId===followerId || pendingFollows.has(targetId)) return;
 if(!followStates.has(followerId)){
  try { await loadFollowData(currentUser.id); }
  catch(error){console.error('Own follow count load error:',error);toast(error?.message||'Unable to load follow counts.');return;}
 }
 if(!followStates.has(targetId)){
  try { await loadFollowData(userId); }
  catch(error){console.error('Follow state load error:',error);toast(error?.message||'Unable to check follow status.');return;}
 }
 const state=followStates.get(targetId)||{followers:0,following:0,isFollowing:follows.has(targetId)};
 const wasFollowing=state.isFollowing;
 const profile=users.find(item=>String(item.id)===targetId);
 const previousState={...state};
 const previousOwnState={...(followStates.get(followerId)||{followers:me.followers,following:me.following,isFollowing:false})};
 const nextState={...state,followers:Math.max(0,state.followers+(wasFollowing?-1:1)),isFollowing:!wasFollowing};
 pendingFollows.add(targetId);
 followStates.set(targetId,nextState);
 if(profile) profile.followers=nextState.followers;
 const ownNextState={...previousOwnState,following:Math.max(0,previousOwnState.following+(wasFollowing?-1:1))};
 followStates.set(followerId,ownNextState);
 me.following=ownNextState.following;
 if(wasFollowing) follows.delete(targetId); else follows.add(targetId);
 renderFeed();
 renderOtherProfile();
 renderSearchResults();
 renderProfile();
 try {
  if(wasFollowing){
   const {error}=await supabaseClient.from('user_follows').delete().eq('follower_id',currentUser.id).eq('following_id',userId);
   if(error) throw error;
  }else{
   const {error}=await supabaseClient.from('user_follows').insert({follower_id:currentUser.id,following_id:userId});
   if(error) throw error;
   await createActivityNotification(userId,'follow');
  }
  toast(wasFollowing?'Unfollowed':'Following');
 } catch(error) {
  followStates.set(targetId,previousState);
  if(profile) profile.followers=previousState.followers;
  followStates.set(followerId,previousOwnState);
  me.following=previousOwnState.following;
  if(wasFollowing) follows.add(targetId); else follows.delete(targetId);
  renderFeed();
  console.error('Follow update error:',error);
  toast(error?.message||'Unable to update follow status.');
 } finally {
  pendingFollows.delete(targetId);
  renderOtherProfile();
  renderSearchResults();
  renderProfile();
  renderFeed();
  renderActivityNotifications();
 }
}

function sharePost(postId){
 note(`Shared post ${postId}`); toast('Post shared');
}

async function shareReel(reelId){
 const reel=reels.find(item=>String(item.id)===String(reelId));
 if(!reel) return;
 if(!currentUser){openAuthModal('login');return;}
 reelShareTargetId=String(reel.id);
 const drawer=document.getElementById('reelShareDrawer');
 drawer?.classList.add('open');
 drawer?.setAttribute('aria-hidden','false');
 try{
  await loadDMInbox();
  renderReelShareContacts();
 }catch(error){
  console.error('Recent DM contacts lookup error:',error);
  toast(error?.message||'Unable to load recent DM contacts.');
 }
}

function renderReelShareContacts(){
 const list=document.getElementById('reelShareContacts');
 const reel=reels.find(item=>String(item.id)===String(reelShareTargetId));
 if(!list||!reel) return;
 const contacts=dmConversations.filter(item=>item.lastMessage);
 if(!contacts.length){list.innerHTML='<div class="dm-empty">No recent DM conversations to share with.</div>';return;}
 list.innerHTML=contacts.map(({userId})=>{
  const person=dmProfile(userId);
  return `<div class="reel-share-contact"><img src="${safe(avatarSrc(person.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""><span>${safe(person.name||person.username||'VYBE user')}<br><small>@${safe(person.username||'user')}</small></span><button type="button" onclick="sendReelToDM('${safe(userId)}')">Send</button></div>`;
 }).join('');
}

function closeReelShareDrawer(){
 const drawer=document.getElementById('reelShareDrawer');
 drawer?.classList.remove('open');
 drawer?.setAttribute('aria-hidden','true');
 reelShareTargetId=null;
}

async function sendReelToDM(receiverId){
 if(!currentUser||!isValidUserUuid(receiverId)) return;
 const reel=reels.find(item=>String(item.id)===String(reelShareTargetId));
 if(!reel) return;
 const shareUrl=new URL(window.location.href);
 shareUrl.searchParams.set('reel',String(reel.id));
 const messageText=`[[reel-card:${encodeURIComponent(shareUrl.href)}:${encodeURIComponent(reel.caption||'Watch this reel on VYBE')}]]`;
 try{
  const {data,error}=await supabaseClient.from('direct_messages').insert({
   sender_id:currentUser.id,
   receiver_id:receiverId,
   message_text:messageText
  }).select('*').single();
  if(error) throw error;
  if(!data) throw new Error('The reel share was not returned after sending.');
  handleDMRealtimeMessage(data);
  closeReelShareDrawer();
  toast('Reel sent');
 }catch(error){
  console.error('Reel DM share error:',error);
  toast(error?.message||'Unable to share this reel.');
 }
}

function addComment(postId){
 const input=document.getElementById(`comment-${postId}`);
 if(!input) return;
 const text=input.value.trim();
 if(!text) return;
 const post=posts.find(p=>String(p.id)===String(postId)); if(!post) return;
 post.comments.push({user:0,text});
 triggerInteractionFeedback();
 input.value='';
 renderFeed();
 if(currentUser && post.user && String(post.user)!==String(currentUser.id)){
  void createActivityNotification(post.user,'comment',{reelId:post.id,commentText:text});
 }
}

function openPost(id){
 const post=posts.find(p=>String(p.id)===String(id));
 if(!post){ return; }
 const postDetail=document.getElementById('postDetail');
 if(!postDetail) return;
 const author=user(post.user);
 const media = post.video ? `<video class="postmedia" controls playsinline src="${safe(post.src)}"></video>` : `<img class="postmedia" src="${safe(post.src)}" alt="Post">`;
 postDetail.innerHTML=`<div class="post glass"><div class="post-media-stage" data-like-media data-like-kind="post" data-like-id="${safe(post.id)}">${media}</div><div class="caption"><b>${safe(author.name)}</b> ${renderTaggedText(post.caption)}</div></div>`;
 show('postModal');
}

function openReel(id){
 const reel=reels.find(item=>String(item.id)===String(id)) || archivedReels.find(item=>String(item.id)===String(id)) || likedReelItems.find(item=>String(item.id)===String(id));
 if(!reel) return;
 const postDetail=document.getElementById('postDetail');
 if(!postDetail) return;
 const author=user(reel.user);
 const authorName=reelAuthorName(reel);
 const liked=likedReels.has(String(reel.id));
 const media=reel.video?`<video class="postmedia" controls autoplay playsinline src="${safe(reel.src)}"></video>`:`<img class="postmedia" src="${safe(reel.src)}" alt="Post">`;
 postDetail.innerHTML=`<div class="post glass explore-lightbox">
  <div class="explore-lightbox-creator">
   <img src="${safe(avatarSrc(author.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt="">
   <button type="button" onclick="viewProfile('${safe(reel.user)}')">@${safe(authorName)}</button>
  </div>
  <div class="explore-lightbox-media">${media}</div>
  <div class="explore-lightbox-actions">
   <button class="action ${liked?'active':''}" data-reel-like="${safe(reel.id)}" aria-label="${liked?'Unlike reel':'Like reel'}" aria-pressed="${liked}" onclick="toggleReelLike('${safe(reel.id)}')">♥</button>
   <span data-reel-like-count="${safe(reel.id)}">${Number(reel.likes||0).toLocaleString()}</span>
   <button type="button" aria-label="View comments" onclick="openCommentsDrawer('${safe(reel.id)}')">💬</button>
   <span data-reel-comment-count="${safe(reel.id)}">${Number(reel.commentCount||0).toLocaleString()}</span>
   <button type="button" aria-label="Share reel" onclick="shareReel('${safe(reel.id)}')">↗</button>
  </div>
  <div class="explore-lightbox-caption"><b>@${safe(authorName)}</b> ${renderTaggedText(reel.caption)}</div>
 </div>`;
 show('postModal');
 const video=postDetail.querySelector('video');
 if(video) void video.play().catch(error=>console.info('Post video autoplay was blocked:',error));
}

async function playReelInPlayer(id){
 let reel=reels.find(item=>String(item.id)===String(id));
 if(!reel){
  await loadReels();
  reel=reels.find(item=>String(item.id)===String(id));
 }
 if(!reel){toast('This reel is no longer available.');return;}
 go('reels');
 requestAnimationFrame(()=>{
  const card=[...document.querySelectorAll('#reelList [data-reel-card]')].find(item=>item.dataset.reelCard===String(id));
  if(!card){
   toast('This reel could not be opened in the player.');
   return;
  }
  card.scrollIntoView({behavior:'smooth',block:'start'});
  const video=card.querySelector('video');
  if(video){
   video.muted=Boolean(window.isReelsMuted);
   activeReelVideo=video;
   video.play().catch(error=>console.info('Profile reel playback was blocked:',error));
  }
 });
}

async function createPost(){
if(creatingPost) return;
const file=document.getElementById('mediaUploadInput')?.files?.[0];
if(!file){ setCreateStatus('Choose an image or video first.', 'error'); return; }
if(!currentUser){ setCreateStatus('Please log in before sharing a post.', 'error'); return; }
const postingUser=currentUser;

const shareButton=document.getElementById('sharePostButton');
const spinner=document.getElementById('uploadSpinner');
const label=document.getElementById('sharePostLabel');
const uploadProgress=document.getElementById('uploadProgress');
const progressFill=document.getElementById('uploadProgressFill');
const progressPercent=document.getElementById('uploadProgressPercent');
const progressStatus=document.getElementById('uploadProgressStatus');
const captionText=(document.getElementById('caption')?.value || '').trim();
const extension=(file.name.match(/\.([a-z0-9]{1,10})$/i)?.[1] || (file.type.split('/')[1]||'bin').replace(/[^a-z0-9]/gi,'')).toLowerCase();
const uniqueId=window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2,14);
const fileName=`${postingUser.id}/${Date.now()}_${uniqueId}.${extension||'bin'}`;
creatingPost=true;

if(shareButton) shareButton.disabled=true;
document.querySelectorAll('#cancelPostButton, #cancelPostCloseButton').forEach(button=>button.disabled=true);
document.querySelectorAll('.media-picker, .aspect-ratio-tools button').forEach(button=>button.disabled=true);
if(spinner) spinner.classList.remove('hidden');
if(label) label.textContent='Posting...';
if(uploadProgress) uploadProgress.hidden=false;
if(progressFill) progressFill.style.width='0%';
if(progressPercent) progressPercent.textContent='0%';
if(progressStatus) progressStatus.textContent='Uploading media';
setCreateStatus('Uploading your media...', 'info');

try {
 const uploadData=await uploadFileWithProgress('posts',fileName,file,percent=>{
  if(progressFill) progressFill.style.width=`${percent}%`;
  if(progressPercent) progressPercent.textContent=`${percent}%`;
 });
 if(!uploadData) throw new Error('The media upload did not return a file.');
 if(progressStatus) progressStatus.textContent='Publishing post';

 const publicUrl = uploadData.publicUrl || supabaseClient.storage.from('posts').getPublicUrl(uploadData.path || fileName)?.data?.publicUrl;
 if(!publicUrl) throw new Error('Could not get a public URL for the uploaded media.');

 const insertPayload={
   user_id: postingUser.id,
   media_url: publicUrl,
   caption: captionText
 };
 const { data: insertedReel, error: insertError } = await supabaseClient.from('reels').insert(insertPayload).select().single();
 if(insertError){
  console.error('Reel insert error:',insertError.message);
  setCreateStatus(insertError.message,'error');
  if(progressStatus) progressStatus.textContent='Publishing failed';
  toast(insertError.message);
  return;
 }

 const reel=normalizeReel({
   ...insertedReel,
   media_url: insertedReel?.media_url || publicUrl,
   caption: insertedReel?.caption ?? captionText,
   user_id: insertedReel?.user_id ?? postingUser.id,
   is_archived: insertedReel?.is_archived ?? false,
   media_type: file.type || (isVideoFile(file) ? 'video/unknown' : 'image/unknown')
 }, 0);
 reels=[reel,...reels.filter(item=>String(item.id)!==String(reel.id))];
 creatingPost=false;
 cancelCreate();
 profileTab='posts';
 homeFeedMode='forYou';
 renderReels(); renderExplore(); renderProfile();renderFeed();
 go('home');
 renderFeed();
 requestAnimationFrame(()=>{
  const freshItem=[...document.querySelectorAll('#feed [data-feed-id]')].find(item=>item.dataset.feedId===`reel:${String(reel.id)}`);
  freshItem?.scrollIntoView({behavior:'smooth',block:'start'});
 });
 toast('✓ Post shared successfully');
} catch(error) {
 console.error('Media post upload error:', error);
 if(progressStatus) progressStatus.textContent='Upload failed';
 setCreateStatus(error?.message || 'Unable to upload your post. Please try again.', 'error');
} finally {
 if(shareButton) shareButton.disabled=false;
 document.querySelectorAll('#cancelPostButton, #cancelPostCloseButton').forEach(button=>button.disabled=false);
 document.querySelectorAll('.media-picker, .aspect-ratio-tools button').forEach(button=>button.disabled=false);
 if(spinner) spinner.classList.add('hidden');
 if(label) label.textContent='Share';
 creatingPost=false;
}
}

async function uploadFileWithProgress(bucket,filePath,file,onProgress){
 const publicUrl = await uploadToCloudinary(file, onProgress);
 return { path: filePath, publicUrl };
}

async function saveProfile(){
 if(!currentUser){ openAuthModal('login'); return; }
 const nameInput=document.getElementById('name');
 const userInput=document.getElementById('uname');
 const bioInput=document.getElementById('bio');
 const picInput=document.getElementById('pic');
 const nextName=nameInput?.value.trim() || me.name;
 const nextUsername=normalizeUsername(userInput?.value||currentProfile||me.username);
 const nextBio=bioInput?.value.trim() || '';
 const metadata={...(currentUser.user_metadata||{}),full_name:nextName,name:nextName,bio:nextBio,username:nextUsername};
 const photo=picInput?.files?.[0];
 try {
  if(nextUsername!==normalizeUsername(currentProfile||me.username)){
   const availability=await checkUsernameAvailableForUser(nextUsername,currentUser.id);
   if(!availability.available) throw new Error(availability.error||'That username is unavailable.');
  }else if(!nextUsername||nextUsername.length<3){
   throw new Error('Username must be at least 3 characters long.');
  }
  if(photo){
   const fileName=`${currentUser.id}/profile/avatar-${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
   const avatarUrl = await uploadToCloudinary(photo);
   metadata.profile_avatar_url = avatarUrl;
  }
  const {data,error}=await supabaseClient.auth.updateUser({data:metadata});
  if(error) throw error;
  currentUser=data.user || {...currentUser,user_metadata:metadata};
  const profileUpdate={
   id:currentUser.id,
   username:nextUsername,
   full_name:nextName,
   bio:nextBio,
   ...(photo?{avatar_url:metadata.profile_avatar_url}:{})
  };
  const {error:profileError}=await supabaseClient.from('profiles').upsert(profileUpdate,{onConflict:'id'});
  if(profileError) throw profileError;
  currentProfile=nextUsername;
  me.username=nextUsername;
  me.name=nextName;
  me.bio=nextBio;
  if(photo) me.pic=metadata.profile_avatar_url;
  hide('editModal');
  renderStories(); renderProfile(); renderFeed();
  toast('Profile updated');
 } catch(error) {
  console.error('Profile update error:',error);
  toast(error?.message || 'Unable to update your profile.');
 }
}

function closePeopleDrawer(){
 const drawer=document.getElementById('peopleDrawer');
 drawer?.classList.remove('open');
 drawer?.setAttribute('aria-hidden','true');
 document.body.style.overflow=peopleDrawerPreviousOverflow;
 peopleDrawerPreviousOverflow='';
}

async function showPeopleList(title, profileUserId){
 const drawer=document.getElementById('peopleDrawer');
 const titleEl=document.getElementById('peopleDrawerTitle');
 const contentEl=document.getElementById('peopleDrawerList');
 if(!drawer||!titleEl||!contentEl) return;
 const isFollowers=title==='Followers';
 titleEl.textContent=title;
 contentEl.innerHTML='<div class="people-drawer-empty">Loading people...</div>';
 peopleDrawerPreviousOverflow=document.body.style.overflow;
 drawer.classList.add('open');
 drawer.setAttribute('aria-hidden','false');
 document.body.style.overflow='hidden';
 try{
  const column=isFollowers?'follower_id':'following_id';
  const filter=isFollowers?'following_id':'follower_id';
  const {data:relations,error:relationError}=await supabaseClient.from('user_follows').select(column).eq(filter,profileUserId);
  if(relationError) throw relationError;
  const ids=[...new Set((relations||[]).map(row=>String(row[column])).filter(Boolean))];
  if(!ids.length){
   contentEl.innerHTML='<div class="people-drawer-empty">No people to show yet.</div>';
   return;
  }
  const {data:profiles,error:profileError}=await supabaseClient.from('profiles').select('id, username, full_name, avatar_url, bio').in('id',ids);
  if(profileError) throw profileError;
  const byId=new Map((profiles||[]).map(profile=>[String(profile.id),profile]));
  const ordered=ids.map(id=>byId.get(id)).filter(Boolean);
  ordered.forEach(profile=>{
   const username=profile.username||String(profile.id).slice(0,8);
   const known={id:profile.id,name:profile.full_name||profile.display_name||username,username,pic:profile.avatar_url||avatarPlaceholder,bio:profile.bio||''};
   users=users.filter(existing=>String(existing.id)!==String(known.id));
   users.push(known);
  });
  contentEl.innerHTML=ordered.length?ordered.map(profile=>{
   const username=profile.username||String(profile.id).slice(0,8);
   const name=profile.full_name||profile.display_name||username;
   return `<button class="people-drawer-item" type="button" onclick="closePeopleDrawer();viewProfile('${safe(profile.id)}')"><img src="${safe(avatarSrc(profile.avatar_url))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt=""><span class="people-drawer-copy"><span class="people-drawer-name">${safe(name)}</span><span class="people-drawer-username">@${safe(username)}</span></span><span aria-hidden="true">›</span></button>`;
  }).join(''):'<div class="people-drawer-empty">Profiles are unavailable.</div>';
 }catch(error){
  console.error(`${title} list load error:`,error);
  contentEl.innerHTML='<div class="people-drawer-empty">Unable to load this list. Please try again.</div>';
  toast(error?.message||`Unable to load ${title.toLowerCase()}.`);
 }
}

function closeSearchSuggestions(){
 const suggestions=document.getElementById('searchSuggestions');
 const input=document.getElementById('topSearchInput');
 suggestions?.classList.remove('open');
 input?.setAttribute('aria-expanded','false');
}

function clearSearchSuggestions({clearInput=false}={}){
 clearTimeout(searchDebounceTimer);
 searchRequestToken++;
 searchedProfiles.clear();
 closeSearchSuggestions();
 if(clearInput){
  const input=document.getElementById('topSearchInput');
  if(input) input.value='';
  document.getElementById('searchWrap')?.classList.remove('has-query');
  searchTerm='';
  exploreHashtagQuery='';
 }
}

function renderSearchSuggestions(state='results'){
 const suggestions=document.getElementById('searchSuggestions');
 if(!suggestions) return;
 if(state==='loading'){
  suggestions.innerHTML='<div class="search-suggestion-state">Searching profiles...</div>';
  return;
 }
 if(state==='error'){
  suggestions.innerHTML='<div class="search-suggestion-state">Unable to search profiles. Try again.</div>';
  return;
 }
 if(!searchedProfiles.size){
  suggestions.innerHTML='<div class="search-suggestion-state">No users found.</div>';
  return;
 }
 suggestions.innerHTML=[...searchedProfiles.values()].map(profile=>`
  <button class="search-suggestion" type="button" role="option" data-profile-id="${safe(profile.id)}">
   <img src="${safe(avatarSrc(profile.pic))}" onerror="this.onerror=null;this.src='${avatarPlaceholder}'" alt="">
   <span class="search-suggestion-copy"><span class="search-suggestion-name">${safe(profile.name)}</span><span class="search-suggestion-username">@${safe(profile.username)}</span></span>
  </button>`).join('');
 suggestions.querySelectorAll('[data-profile-id]').forEach(button=>button.addEventListener('click',()=>openSearchedProfile(button.dataset.profileId)));
}

function searchPosts(term){
 searchTerm=String(term||'');
 clearTimeout(searchDebounceTimer);
 const hashtagMatch=searchTerm.trim().match(/^#([\p{L}\p{N}_]+)$/u);
 if(hashtagMatch){
  searchRequestToken++;
  searchedProfiles.clear();
  exploreHashtagQuery=hashtagMatch[1].toLowerCase();
  document.getElementById('searchWrap')?.classList.add('has-query');
  closeSearchSuggestions();
  if(!document.getElementById('explore')?.classList.contains('active')) go('explore');
  renderExplore();
  return;
 }
 const hadHashtagFilter=Boolean(exploreHashtagQuery);
 exploreHashtagQuery='';
 if(hadHashtagFilter) renderExplore();
 const query=searchTerm.trim().replace(/^@/,'').replace(/[^\p{L}\p{N}_. -]/gu,' ').replace(/\s+/g,' ').trim();
 const wrapper=document.getElementById('searchWrap');
 const input=document.getElementById('topSearchInput');
 const suggestions=document.getElementById('searchSuggestions');
 wrapper?.classList.toggle('has-query',Boolean(searchTerm));
 if(!query){
  searchRequestToken++;
  searchedProfiles.clear();
  closeSearchSuggestions();
  renderExplore();
  if(document.getElementById('searchResults')?.classList.contains('active')) go('explore');
  return;
 }
 if(!document.getElementById('explore')?.classList.contains('active')) go('explore');
 suggestions?.classList.add('open');
 input?.setAttribute('aria-expanded','true');
 renderSearchSuggestions('loading');
 const token=++searchRequestToken;
 searchDebounceTimer=setTimeout(async()=>{
  try{
   const {data,error}=await supabaseClient.from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(10);
   if(error) throw error;
   if(token!==searchRequestToken) return;
   searchedProfiles.clear();
   (data||[]).forEach(profile=>{
    if(!profile.id) return;
    const username=normalizeUsername(profile.username)||String(profile.id).slice(0,8);
    searchedProfiles.set(String(profile.id),{
     id:profile.id,
     name:profile.full_name||profile.display_name||profile.name||username,
     username,
     pic:profile.avatar_url||profile.profile_avatar_url||avatarPlaceholder,
     bio:profile.bio||'',
     followers:Number(profile.followers||0),
     following:Number(profile.following||0)
    });
   });
   renderSearchSuggestions();
  }catch(error){
   if(token!==searchRequestToken) return;
   console.error('Profile search error:',error);
   renderSearchSuggestions('error');
  }
 },250);
}

async function openTaggedProfile(username){
 const normalized=normalizeUsername(username);
 if(!normalized) return;
 if(currentUser&&normalized.toLowerCase()===String(currentProfile||me.username).toLowerCase()){go('profile');return;}
 const cached=users.find(profile=>String(profile.username||'').toLowerCase()===normalized.toLowerCase());
 if(cached){viewProfile(cached.id);return;}
 try{
  const {data,error}=await supabaseClient.from('profiles').select('id, username, full_name, avatar_url, bio').eq('username',normalized).maybeSingle();
  if(error) throw error;
  if(!data?.id){toast(`@${normalized} was not found.`);return;}
  const profile={id:data.id,name:data.full_name||data.display_name||normalized,username:data.username||normalized,pic:data.avatar_url||avatarPlaceholder,bio:data.bio||''};
  users=users.filter(existing=>String(existing.id)!==String(profile.id));
  users.push(profile);
  viewProfile(profile.id);
 }catch(error){
  console.error('Mention profile lookup error:',error);
  toast(error?.message||'Unable to open this profile.');
 }
}

function openHashtag(hashtag){
 const normalized=String(hashtag||'').replace(/^#/,'').trim();
 if(!normalized) return;
 searchTerm=`#${normalized}`;
 const input=document.getElementById('topSearchInput');
 if(input) input.value=searchTerm;
 document.getElementById('searchWrap')?.classList.add('has-query');
 clearTimeout(searchDebounceTimer);
 searchRequestToken++;
 searchedProfiles.clear();
 closeSearchSuggestions();
 exploreHashtagQuery=normalized.toLowerCase();
 if(!document.getElementById('explore')?.classList.contains('active')) go('explore');
 renderExplore();
}

document.getElementById('topSearchInput')?.addEventListener('input',event=>searchPosts(event.currentTarget.value));
document.getElementById('searchClearButton')?.addEventListener('click',()=>{
 const input=document.getElementById('topSearchInput');
 if(input){input.value='';input.focus();}
 searchPosts('');
});
document.addEventListener('click',event=>{
 if(!event.target.closest('.search-wrap')) closeSearchSuggestions();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape') closeSearchSuggestions();
});

async function initializeApp(){
 try {
  const {data,error}=await supabaseClient.auth.getSession();
  if(error) throw error;
  const sessionUser=data?.session?.user;
  if(sessionUser){
   currentUser=sessionUser;
   enterApp(sessionUser);
   await syncCurrentProfile();
   await loadReels();
   await loadSavedReels();
   await loadStories();
   subscribeToActivityNotifications();
   await loadActivityNotifications();
  }else{
   openAuthModal('login');
  }
 } catch(error) {
  console.error('Authentication session load error:',error);
  toast(error?.message || 'Unable to restore your session.');
  openAuthModal('login');
 }
 authInitialized=true;
 renderStories();
 renderFeed();
 renderExplore();
 renderSaved();
 renderChats();
 renderNotifications();
 renderProfile();
}

void initializeApp();
if ('serviceWorker' in navigator) {
 window.addEventListener('load', () => {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
   .then(reg => console.log('SW Registered', reg.scope))
   .catch(err => console.error('SW Error:', err));
 });
}

function killNetlify() {
    document.querySelectorAll('[data-netlify-badge], .netlify-badge, #netlify-badge, netlify-drawer, iframe[src*="netlify"], a[href*="netlify.com"]').forEach(el => el.remove());
    document.querySelectorAll('div').forEach(el => {
      if (el.innerText && (el.innerText.includes('Powered by Netlify') || el.innerText.includes('Build your own site with Netlify'))) {
        el.style.display = 'none';
        el.remove();
      }
    });
  }
  killNetlify();
  setInterval(killNetlify, 500);