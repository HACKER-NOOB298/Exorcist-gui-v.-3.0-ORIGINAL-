// --- SISTEMA DE ÁUDIO MAGNA V3.5 ---
let playerMusica = new Audio();
let synth = window.speechSynthesis;
let utteranceAtual = null;
let vozes = [];

// Variáveis de Estado
let modoAtual = null; 
let textoAtual = "";
let arquivoAtual = "";
let loopsTotais = 1;
let loopsExecutados = 0;
let isPausado = false; 
let watcherInterval = null; 

// --- INICIALIZAÇÃO ---
window.onload = () => { 
    carregarVozes(); 
    const salvo = localStorage.getItem('tema_preferido');
    if(salvo) mudarTema(salvo);

    playerMusica.setAttribute('playsinline', 'true');
    playerMusica.setAttribute('webkit-playsinline', 'true');
    playerMusica.preload = 'auto';
};

synth.onvoiceschanged = carregarVozes;

function carregarVozes() { vozes = synth.getVoices(); }

function toggleMenu() { document.getElementById('sidebar').classList.toggle('closed'); }

// --- TRADUÇÃO (SISTEMA TOGGLE) ---
function toggleTraducao(btn) {
    // Pega o card pai
    const card = btn.closest('.prayer-container');
    const latinText = card.querySelector('.latin');
    const tradText = card.querySelector('.traducao');

    if (tradText.style.display === 'none') {
        // Mostrar Tradução
        latinText.style.display = 'none';
        tradText.style.display = 'block';
        btn.innerText = "📜 Ver Latim";
        btn.style.borderColor = "var(--gold)";
        btn.style.color = "var(--gold)";
    } else {
        // Mostrar Latim
        latinText.style.display = 'block';
        tradText.style.display = 'none';
        btn.innerText = "🌐 Traduzir";
        btn.style.borderColor = "#555";
        btn.style.color = "#888";
    }
}

// --- NAVEGAÇÃO ---
function navegar(idTela) {
    controlarAudio('stop');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(idTela).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => {
        if(b.getAttribute('onclick').includes(idTela)) b.classList.add('active');
    });

    if(idTela === 'dicionario') renderizarDicionario(dicionarioDB);
}

function mudarTema(tema) {
    document.body.classList.remove('theme-magna', 'theme-classic', 'theme-dark');
    document.body.classList.add('theme-' + tema);
    localStorage.setItem('tema_preferido', tema);
    atualizarStatus("Tema: " + tema.toUpperCase());
}

function configurarLoop() {
    let input = prompt("Quantas vezes deseja repetir a oração?", "1");
    let num = parseInt(input);
    if (!isNaN(num) && num > 0) {
        loopsTotais = num;
        atualizarStatus(`Repetição: ${num}x`);
    } else {
        loopsTotais = 1;
    }
}

function atualizarStatus(msg) { document.getElementById('status-display').innerText = msg; }

// --- ÁUDIO BLINDADO ---
function controlarAudio(acao) {
    if (acao === 'stop') {
        pararVigia();
        synth.cancel(); playerMusica.pause(); playerMusica.currentTime = 0;
        loopsExecutados = 0; isPausado = false; modoAtual = null;
        atualizarStatus("Parado"); 
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "none";
        return;
    }
    if (acao === 'pause') {
        isPausado = true;
        if (modoAtual === 'tts') synth.pause();
        if (modoAtual === 'mp3') playerMusica.pause();
        atualizarStatus("Pausado");
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
    }
    if (acao === 'resume') {
        if (isPausado) {
            isPausado = false;
            if (modoAtual === 'tts') synth.resume();
            if (modoAtual === 'mp3') { playerMusica.play(); iniciarVigia(); }
            atualizarStatus("Reproduzindo...");
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
        }
    }
}

function iniciarVigia() {
    if (watcherInterval) clearInterval(watcherInterval);
    watcherInterval = setInterval(() => {
        if (!isPausado && playerMusica.paused && modoAtual === 'mp3') {
            playerMusica.play().catch(e => console.log("Force-play"));
        }
    }, 1000);
}
function pararVigia() { if (watcherInterval) clearInterval(watcherInterval); }

// --- TTS ---
function falarPalavra(texto) {
    controlarAudio('stop');
    const u = new SpeechSynthesisUtterance(texto);
    const v = vozes.find(v => v.lang.includes('it-IT')) || vozes.find(v => v.lang.includes('es-ES'));
    if (v) u.voice = v;
    u.rate = 0.8; synth.speak(u);
}

function iniciarTTS(btnElement) {
    controlarAudio('stop'); 
    // Sempre pega o texto em Latim, mesmo se a tradução estiver visível
    const card = btnElement.closest('.prayer-container');
    textoAtual = card.querySelector('.latin').innerText;
    
    modoAtual = 'tts'; loopsExecutados = 0; tocarTTSLoop();
}

function tocarTTSLoop() {
    if (loopsExecutados >= loopsTotais) return;
    loopsExecutados++;
    atualizarStatus(`Recitando ${loopsExecutados}/${loopsTotais}`);
    utteranceAtual = new SpeechSynthesisUtterance(textoAtual);
    const vozLatina = vozes.find(v => v.lang.includes('it-IT')) || vozes.find(v => v.lang.includes('es-ES'));
    if (vozLatina) utteranceAtual.voice = vozLatina;
    utteranceAtual.rate = 0.8;
    
    let resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) clearInterval(resumeInterval);
        else window.speechSynthesis.resume();
    }, 14000);

    utteranceAtual.onend = () => { 
        clearInterval(resumeInterval);
        if (loopsExecutados < loopsTotais && !isPausado) tocarTTSLoop(); 
    };
    synth.speak(utteranceAtual);
}

// --- MP3 ---
function iniciarMusica(arquivo) {
    controlarAudio('stop'); arquivoAtual = arquivo; modoAtual = 'mp3';
    loopsExecutados = 0; 
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: arquivo.replace('.mp3', '').toUpperCase(),
            artist: 'Schola Exorcistae',
            album: 'Codex Magna v3.5',
            artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/107/107831.png', sizes: '512x512', type: 'image/png' }]
        });
        navigator.mediaSession.setActionHandler('play', () => controlarAudio('resume'));
        navigator.mediaSession.setActionHandler('pause', () => controlarAudio('pause'));
        navigator.mediaSession.setActionHandler('stop', () => controlarAudio('stop'));
    }
    tocarMP3Loop();
}

function tocarMP3Loop() {
    if (loopsExecutados >= loopsTotais) return;
    loopsExecutados++;
    atualizarStatus(`Cantando ${loopsExecutados}/${loopsTotais}`);
    playerMusica.src = "mp3/" + arquivoAtual;
    playerMusica.onpause = () => { if (!isPausado) playerMusica.play().catch(e => {}); };
    playerMusica.onended = () => { if (loopsExecutados < loopsTotais) tocarMP3Loop(); };
    playerMusica.play().then(() => iniciarVigia()).catch(() => atualizarStatus("Erro MP3"));
}

// --- DICIONÁRIO (80+ PALAVRAS) ---
const dicionarioDB = [
    { latin: "Absolutio", pt: "Absolvição" }, { latin: "Abyssus", pt: "Abismo" },
    { latin: "Adsum", pt: "Aqui estou" }, { latin: "Aeternum", pt: "Eterno" },
    { latin: "Agnus Dei", pt: "Cordeiro de Deus" }, { latin: "Altare", pt: "Altar" },
    { latin: "Amen", pt: "Assim seja" }, { latin: "Angele", pt: "Anjo" },
    { latin: "Anima", pt: "Alma" }, { latin: "Antichristus", pt: "Anticristo" },
    { latin: "Apostolus", pt: "Apóstolo" }, { latin: "Aqua", pt: "Água" },
    { latin: "Archangelus", pt: "Arcanjo" }, { latin: "Ascensio", pt: "Ascensão" },
    { latin: "Baptisma", pt: "Batismo" }, { latin: "Basilica", pt: "Basílica" },
    { latin: "Beatus", pt: "Bem-aventurado" }, { latin: "Bellum", pt: "Guerra" },
    { latin: "Benedicere", pt: "Abençoar" }, { latin: "Benedictus", pt: "Bendito" },
    { latin: "Bonum", pt: "Bem" }, { latin: "Caelum", pt: "Céu" },
    { latin: "Calix", pt: "Cálice" }, { latin: "Cantus", pt: "Canto" },
    { latin: "Caritas", pt: "Caridade" }, { latin: "Clerus", pt: "Clero" },
    { latin: "Confiteor", pt: "Eu confesso" }, { latin: "Corpus", pt: "Corpo" },
    { latin: "Creatura", pt: "Criatura" }, { latin: "Credo", pt: "Eu creio" },
    { latin: "Crux", pt: "Cruz" }, { latin: "Custos", pt: "Guardião" },
    { latin: "Daemon", pt: "Demônio" }, { latin: "Deus", pt: "Deus" },
    { latin: "Diabolus", pt: "Diabo" }, { latin: "Dies", pt: "Dia" },
    { latin: "Divinus", pt: "Divino" }, { latin: "Dominus", pt: "Senhor" },
    { latin: "Ecclesia", pt: "Igreja" }, { latin: "Episcopus", pt: "Bispo" },
    { latin: "Et", pt: "E" }, { latin: "Eucharistia", pt: "Eucaristia" },
    { latin: "Exorcista", pt: "Exorcista" }, { latin: "Exorcizamus", pt: "Exorcizamos" },
    { latin: "Fides", pt: "Fé" }, { latin: "Filius", pt: "Filho" },
    { latin: "Flamma", pt: "Chama" }, { latin: "Gloria", pt: "Glória" },
    { latin: "Gratia", pt: "Graça" }, { latin: "Habemus", pt: "Temos" },
    { latin: "Heresis", pt: "Heresia" }, { latin: "Hostia", pt: "Vítima/Hóstia" },
    { latin: "Ignis", pt: "Fogo" }, { latin: "Immaculata", pt: "Imaculada" },
    { latin: "Imperium", pt: "Império" }, { latin: "Infernum", pt: "Inferno" },
    { latin: "Inimicus", pt: "Inimigo" }, { latin: "Initium", pt: "Início" },
    { latin: "Inri", pt: "Jesus Rei dos Judeus" }, { latin: "Ira", pt: "Ira" },
    { latin: "Judicium", pt: "Julgamento" }, { latin: "Justitia", pt: "Justiça" },
    { latin: "Kyrie Eleison", pt: "Senhor piedade" }, { latin: "Laudes", pt: "Louvores" },
    { latin: "Lex", pt: "Lei" }, { latin: "Liber", pt: "Livro" },
    { latin: "Libera nos", pt: "Livrai-nos" }, { latin: "Lumen", pt: "Luz" },
    { latin: "Lux", pt: "Luz" }, { latin: "Magister", pt: "Mestre" },
    { latin: "Maledicte", pt: "Maldito" }, { latin: "Malo", pt: "Mal" },
    { latin: "Martyr", pt: "Mártir" }, { latin: "Mater", pt: "Mãe" },
    { latin: "Mea Culpa", pt: "Minha culpa" }, { latin: "Miserere", pt: "Tende piedade" },
    { latin: "Missale", pt: "Missal" }, { latin: "Mortuus", pt: "Morto" },
    { latin: "Mundus", pt: "Mundo" }, { latin: "Mysterium", pt: "Mistério" },
    { latin: "Nomen", pt: "Nome" }, { latin: "Omnipotens", pt: "Todo-poderoso" },
    { latin: "Ora pro nobis", pt: "Rogai por nós" }, { latin: "Oratio", pt: "Oração" },
    { latin: "Papa", pt: "Papa" }, { latin: "Paradisus", pt: "Paraíso" },
    { latin: "Pater", pt: "Pai" }, { latin: "Pax", pt: "Paz" },
    { latin: "Peccatum", pt: "Pecado" }, { latin: "Perditio", pt: "Perdição" },
    { latin: "Pontifex", pt: "Pontífice" }, { latin: "Preces", pt: "Preces" },
    { latin: "Propheta", pt: "Profeta" }, { latin: "Purgatorium", pt: "Purgatório" },
    { latin: "Redemptor", pt: "Redentor" }, { latin: "Regnum", pt: "Reino" },
    { latin: "Requiem", pt: "Repouso" }, { latin: "Resurrectio", pt: "Ressurreição" },
    { latin: "Rex", pt: "Rei" }, { latin: "Rituale", pt: "Ritual" },
    { latin: "Sacerdos", pt: "Sacerdote" }, { latin: "Sacra", pt: "Sagrada" },
    { latin: "Sacramentum", pt: "Sacramento" }, { latin: "Salus", pt: "Salvação" },
    { latin: "Sanctus", pt: "Santo" }, { latin: "Sanguis", pt: "Sangue" },
    { latin: "Sapientia", pt: "Sabedoria" }, { latin: "Satanas", pt: "Satanás" },
    { latin: "Scriptura", pt: "Escritura" }, { latin: "Signum", pt: "Sinal" },
    { latin: "Spiritus", pt: "Espírito" }, { latin: "Stella", pt: "Estrela" },
    { latin: "Tenebrae", pt: "Trevas" }, { latin: "Terra", pt: "Terra" },
    { latin: "Thronus", pt: "Trono" }, { latin: "Trinitas", pt: "Trindade" },
    { latin: "Umbra", pt: "Sombra" }, { latin: "Vade Retro", pt: "Afasta-te" },
    { latin: "Verbum", pt: "Verbo" }, { latin: "Veritas", pt: "Verdade" },
    { latin: "Via", pt: "Caminho" }, { latin: "Victoria", pt: "Vitória" },
    { latin: "Vita", pt: "Vida" }, { latin: "Vocatio", pt: "Vocação" }
];

function renderizarDicionario(lista) {
    const container = document.getElementById('lista-palavras');
    container.innerHTML = lista.map(i => `
        <div class="dict-item">
            <div><strong style="color:var(--gold)">${i.latin}</strong> ➔ ${i.pt}</div>
            <button class="btn-play" style="flex:none; min-width:auto; padding:5px 10px;" onclick="falarPalavra('${i.latin}')">🔊</button>
        </div>
    `).join('');
}

function pesquisar() {
    const t = document.getElementById('searchInput').value.toLowerCase();
    const f = dicionarioDB.filter(i => i.latin.toLowerCase().includes(t) || i.pt.toLowerCase().includes(t));
    renderizarDicionario(f);
}
