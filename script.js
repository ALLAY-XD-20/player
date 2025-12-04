// --- CONFIGURATION ---
const API_KEY = 'AIzaSyBGEdG7wJx6eaVP0cUuP6-zY43ae8viC6w';
let player;

// Initial Data to populate grid (Fallback/Landing)
const INITIAL_VIDEOS = [
    { id: { videoId: 'jfKfPfyJRdk' }, snippet: { title: 'lofi hip hop radio - beats to relax/study to', channelTitle: 'Lofi Girl', thumbnails: { high: { url: 'https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg' } } } },
    { id: { videoId: 'DWcJFNfaw9c' }, snippet: { title: 'Alice Deejay - Better Off Alone', channelTitle: 'Alice Deejay', thumbnails: { high: { url: 'https://img.youtube.com/vi/DWcJFNfaw9c/maxresdefault.jpg' } } } },
    { id: { videoId: 'kJQP7kiw5Fk' }, snippet: { title: 'Luis Fonsi - Despacito', channelTitle: 'Luis Fonsi', thumbnails: { high: { url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg' } } } },
    { id: { videoId: '3tmd-ClpJxA' }, snippet: { title: 'Alan Walker - Faded', channelTitle: 'Alan Walker', thumbnails: { high: { url: 'https://img.youtube.com/vi/3tmd-ClpJxA/maxresdefault.jpg' } } } }
];

// --- YouTube API Setup ---
// Note: This function must be globally accessible for the YouTube API to find it.
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: '',
        host: 'https://www.youtube.com',
        playerVars: {
            'playsinline': 1,
            'controls': 1,
            'rel': 0,
            'origin': window.location.origin, // Crucial for mobile permission errors
            'enablejsapi': 1
        },
        events: {
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
};

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        // Enforce current speed setting when video starts or resumes
        let speed = document.getElementById('speed-slider').value;
        player.setPlaybackRate(parseFloat(speed));
    }
}

function onPlayerError(event) {
    console.log("YouTube Player Error:", event.data);
    // Error 150/101/153: Restricted embedding by video owner
    if([101, 150, 153].includes(event.data)) {
        const url = player.getVideoUrl();
        document.getElementById('fallback-link').href = url;
        document.getElementById('error-overlay').style.display = 'flex';
        document.getElementById('youtube-player').style.opacity = '0.1';
    }
}

// --- Smart Input Logic ---
async function handleSmartSearch() {
    const input = document.getElementById('search-input').value.trim();
    if (!input) return;

    let videoId = "";

    // 1. Check if it's a Direct Link (Parsing Logic)
    if (input.includes("youtube.com/watch?v=")) {
        videoId = input.split("v=")[1].split("&")[0];
    } else if (input.includes("youtu.be/")) {
        videoId = input.split("youtu.be/")[1].split("?")[0];
    }

    // 2. Execution
    if (videoId) {
        // It's a Link -> Play Directly
        playVideo(videoId, "Direct Link Video", "YouTube");
    } else {
        // It's a Keyword -> Search via API
        await performSearch(input);
    }
}

async function performSearch(query) {
    const titleElem = document.getElementById('section-title');
    const gridElem = document.getElementById('video-grid');
    
    titleElem.innerHTML = `<i class="fa-solid fa-search text-divine-primary"></i> Results for "${query}"`;
    gridElem.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-divine-primary"></i></div>';

    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            alert('YouTube API Error: ' + data.error.message);
            renderVideos([]);
            return;
        }
        renderVideos(data.items);
        
        // Scroll down to results
        document.getElementById('content-container').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error(error);
        alert('Search failed. Please check your internet connection.');
    }
}

function renderVideos(videos) {
    const grid = document.getElementById('video-grid');
    grid.innerHTML = '';
    
    if (!videos || videos.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-500">No videos found.</div>';
        return;
    }

    videos.forEach(video => {
        // Handle cases where ID might be different based on API response type
        const vidId = video.id.videoId || video.id;
        const title = video.snippet.title;
        const channel = video.snippet.channelTitle;
        const thumb = video.snippet.thumbnails.high ? video.snippet.thumbnails.high.url : video.snippet.thumbnails.medium.url;

        const card = document.createElement('div');
        card.className = 'bg-divine-card rounded-xl overflow-hidden hover:bg-gray-800 transition cursor-pointer border border-white/5 shadow-lg group';
        card.onclick = () => playVideo(vidId, title, channel);
        
        card.innerHTML = `
            <div class="relative aspect-video">
                <img src="${thumb}" class="w-full h-full object-cover group-hover:opacity-80 transition">
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <i class="fa-solid fa-play text-white text-3xl drop-shadow-lg"></i>
                </div>
            </div>
            <div class="p-3">
                <h4 class="font-bold text-white text-sm line-clamp-2">${title}</h4>
                <p class="text-xs text-gray-400 mt-1">${channel}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function playVideo(videoId, title, channel) {
    const wrapper = document.getElementById('player-wrapper');
    wrapper.classList.remove('hidden');
    
    // Reset Error UI
    document.getElementById('error-overlay').style.display = 'none';
    document.getElementById('youtube-player').style.opacity = '1';
    
    document.getElementById('current-title').innerText = title;
    document.getElementById('current-channel').innerText = channel;

    if (player && player.loadVideoById) {
        player.loadVideoById(videoId);
    }
    
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateSpeed(val) {
    document.getElementById('speed-val').innerText = val + 'x';
    if (player && player.setPlaybackRate) {
        player.setPlaybackRate(parseFloat(val));
    }
}

function changeAudioMode() {
    const mode = document.getElementById('audio-track-select').value;
    const slider = document.getElementById('speed-slider');
    
    let targetSpeed = 1.0;
    if(mode === 'nightcore') targetSpeed = 1.25;
    if(mode === 'slowed') targetSpeed = 0.75;
    if(mode === 'fast') targetSpeed = 2.0;

    slider.value = targetSpeed;
    updateSpeed(targetSpeed);
}

function toggleFullscreen() {
    const elem = document.getElementById('youtube-player');
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
}

// UI Toggles
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function closePlayer() {
    document.getElementById('player-wrapper').classList.add('hidden');
    if(player) player.stopVideo();
}

function handleEnter(e) {
    if(e.key === 'Enter') handleSmartSearch();
}

function resetApp() {
    closePlayer();
    renderVideos(INITIAL_VIDEOS);
    document.getElementById('search-input').value = '';
}

// Initialization
window.onload = () => {
    renderVideos(INITIAL_VIDEOS);
};
