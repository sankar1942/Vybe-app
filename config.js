const avatarPlaceholder='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#e5e5e5"/><circle cx="50" cy="38" r="17" fill="none" stroke="#888" stroke-width="6"/><path d="M18 88c3-18 15-28 32-28s29 10 32 28" fill="none" stroke="#888" stroke-width="6" stroke-linecap="round"/></svg>');
const avatar=()=>avatarPlaceholder;
const video1="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const video2="https://www.w3schools.com/html/mov_bbb.mp4";

const supabaseUrl = "https://tpppqqvnjovoealfepfk.supabase.co";
const supabaseAnonKey = "sb_publishable_qSOZ_ABJcPhpcyNo0mY3Cw_gLEyMoB3";
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
const supabaseClient = window.supabaseClient;