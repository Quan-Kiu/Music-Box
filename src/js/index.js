import { debounce } from "../helpers/debounce.js";


const rangerInputElm = document.querySelector('input[type=range]');
const songElm = document.querySelector('audio');
const progressElm = document.querySelector('progress');
const playElm = document.querySelector('.play');
const musicLyricElm = document.querySelector('.lyric');
const musicInfoElm = document.querySelector('.music__info');
const nextControlElm = document.querySelector('.next');
const prevControlElm = document.querySelector('.prev');
const cardPhotoElm = document.querySelector('.card__photo');
const repeatSongElm = document.querySelector('.repeat');
const randomSongElm = document.querySelector('.random');

function autoScrollLyric(index, data) {
    if (data[index].startTimeMs == 0) return;
    const rowElm = musicLyricElm.querySelectorAll('p');
    rowElm[Math.max(index - 3, 0)].className = '';
    rowElm[Math.max(index - 2, 0)].className = 'o-2';
    rowElm[Math.max(index - 1, 0)].className = 'o-4';
    rowElm[Math.min(index, data.length)].className = 'active';
    rowElm[Math.min(index, data.length)].scrollIntoView({ behavior: 'smooth', block: "center" });
    rowElm[Math.min(index + 2, data.length - 1)].className = 'o-2';
    rowElm[Math.min(index + 1, data.length - 1)].className = 'o-4';
}

function resetLyrics() {
    const rowElms = musicLyricElm.querySelectorAll('p');
    rowElms.forEach((row) => row.className = '');
}

const autoScrollLyricDebounce = debounce(autoScrollLyric, 100);

const playSong = (data) => {
    songElm.src = `src/data/${data.url}`;
    musicInfoElm.innerHTML = `
    <h2 class="music__name">${data.name}</h2>
    <h4 class="music__author">${data.artists.join(', ')}</h4>
    `
    songElm.autoplay = true;
    cardPhotoElm.innerHTML = `<img src="${data.background}" alt="${data.name}">`;

    let html = '';

    data.lyrics.forEach((lyric) => {
        html += `<p>${lyric.words}</p>`
    })

    musicLyricElm.innerHTML = html;

}

(async () => {

    const data = await fetch('src/data/data.json')
        .then((response) => response.json())

    let currentTime = 0;
    let songIndex = Math.floor(Math.random() * data.length);
    let currentSong = data[songIndex];
    let isReapetCurrentSong = false;
    let isRandomSong = false;
    playSong(currentSong);

    const handleOnSongChange = (index, data) => {
        currentSong = data[index];
        musicLyricElm.querySelectorAll('p')[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        songIndex = index;
        currentTime = 0;
        playSong(data[index]);

    }

    const handleSongProgressChange = (e) => {
        if (currentSong.lyrics[currentTime]?.startTimeMs - 500 <= e.target.currentTime * 1000) {
            autoScrollLyricDebounce(currentTime++, currentSong.lyrics);
        }
        const progress = (e.target.currentTime / songElm.duration) || 0;
        progressElm.style.setProperty('--progress', progress)
        rangerInputElm.value = progress * 100;
        if (progress >= 1 && songElm.paused) {
            resetLyrics();
            if (isReapetCurrentSong) {
                currentTime = 0;
                songElm.currentTime = 0;
                songElm.play();

            } else if (isRandomSong) {
                let randomIndex = Math.floor(Math.random() * data.length);
                while (randomIndex === songIndex) {
                    randomIndex = Math.floor(Math.random() * data.length);
                }
                handleOnSongChange(randomIndex, data);
            }
            else {

                nextControlElm.click();
            }
            // playElm.classList.remove('active');
        }
    }

    repeatSongElm.onclick = function () {

        if (isRandomSong) return;

        isReapetCurrentSong = !isReapetCurrentSong;
        repeatSongElm.classList.toggle('active');
    }

    randomSongElm.onclick = function () {
        if (isReapetCurrentSong) return;
        isRandomSong = !isRandomSong;
        randomSongElm.classList.toggle('active');
    }

    nextControlElm.onclick = () => {
        handleOnSongChange(songIndex + 1 >= data.length ? 0 : songIndex + 1, data);
    }
    prevControlElm.onclick = () => {
        handleOnSongChange(songIndex - 1 < 0 ? data.length - 1 : songIndex - 1, data);
    }

    if (playElm) {
        playElm.onclick = function () {
            if (songElm.paused) {
                songElm.play();
            } else {
                songElm.pause();
            }
        }

    }

    if (songElm) {

        songElm.addEventListener('timeupdate', handleSongProgressChange)

        songElm.onplay = () => {
            playElm.classList.add('active');
        }
        songElm.onpause = () => {
            playElm.classList.remove('active');
        }
    }

    if (rangerInputElm && progressElm) {
        rangerInputElm.addEventListener('change', (e) => {
            if (currentTime !== 0) {
                resetLyrics();
                const indexOf = currentSong.lyrics.findIndex((item) => item.startTimeMs >= songElm.currentTime * 1000);
                currentTime = indexOf;
                autoScrollLyricDebounce(Math.max(currentTime--, 0), currentSong.lyrics);
            }

        })
        rangerInputElm.addEventListener('input', (e) => {
            const selectedProgress = (songElm.duration * e.target.value) / 100;
            songElm.currentTime = selectedProgress;
        })
    }


})()

