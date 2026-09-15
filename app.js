// --- CONFIGURATION SUPABASE ---
// Remplace ces valeurs par tes clés Supabase (Gratuit sur supabase.com)
const SUPABASE_URL = "https://higwxascgbopxjrjjgyc.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_l9mxXNOJ2gh_lGHTK7KlNg_0L4Th3R0";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let quizQuestions = [];
let currentQuestionIndex = 0;
let score = 0;

// Au chargement, initialiser le compteur
document.addEventListener("DOMContentLoaded", updateBadgeCount);

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));

  if (tabName === 'add') {
    document.getElementById('tab-add').classList.remove('hidden');
    document.getElementById('nav-add-btn').classList.add('active');
  } else {
    document.getElementById('tab-quiz').classList.remove('hidden');
    document.getElementById('nav-quiz-btn').classList.add('active');
  }
}

function toggleMediaInputs() {
  const type = document.getElementById('media_type').value;
  if (type === 'quote') {
    document.getElementById('group-quote').classList.remove('hidden');
    document.getElementById('group-url').classList.add('hidden');
  } else {
    document.getElementById('group-quote').classList.add('hidden');
    document.getElementById('group-url').classList.remove('hidden');
  }
}

// Ajout d'une proposition dans Supabase
document.getElementById('proposal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const mediaType = document.getElementById('media_type').value;
  const content = mediaType === 'quote' 
    ? document.getElementById('content_quote').value 
    : document.getElementById('content_url').value;

  const rawOptions = document.getElementById('options').value.split(',').map(s => s.trim()).filter(Boolean);

  const newProposal = {
    category: document.getElementById('category').value,
    media_type: mediaType,
    content: content,
    answer: document.getElementById('answer').value.trim(),
    wrong_options: rawOptions
  };

  const { error } = await supabase.from('proposals').insert([newProposal]);

  if (error) {
    alert("Erreur lors de l'enregistrement : " + error.message);
  } else {
    alert("Proposition ajoutée avec succès !");
    document.getElementById('proposal-form').reset();
    toggleMediaInputs();
    updateBadgeCount();
  }
});

async function updateBadgeCount() {
  const { count } = await supabase.from('proposals').select('*', { count: 'exact', head: true });
  if (count !== null) document.getElementById('count-badge').textContent = count;
}

// Lancement du Quiz
async function startQuiz() {
  const { data, error } = await supabase.from('proposals').select('*');
  
  if (error || !data || data.length === 0) {
    alert("Pas assez de questions dans la base de données pour lancer un quiz !");
    return;
  }

  // Mélanger les questions
  quizQuestions = data.sort(() => 0.5 - Math.random());
  currentQuestionIndex = 0;
  score = 0;

  document.getElementById('quiz-intro').classList.add('hidden');
  document.getElementById('quiz-results').classList.add('hidden');
  document.getElementById('quiz-box').classList.remove('hidden');

  showQuestion();
}

function showQuestion() {
  const q = quizQuestions[currentQuestionIndex];
  document.getElementById('quiz-category').textContent = q.category;
  document.getElementById('quiz-progress').textContent = `Question ${currentQuestionIndex + 1}/${quizQuestions.length}`;
  document.getElementById('next-btn').classList.add('hidden');

  const container = document.getElementById('quiz-media-container');
  container.innerHTML = '';

  // Affichage selon le type de média
  if (q.media_type === 'quote') {
    container.innerHTML = `<div class="quote-box">« ${q.content} »</div>`;
  } else if (q.media_type === 'image') {
    container.innerHTML = `<img src="${q.content}" class="media-img" alt="Quiz image">`;
  } else if (q.media_type === 'video') {
    const embedUrl = getYouTubeEmbedUrl(q.content);
    container.innerHTML = `<div class="video-container"><iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>`;
  }

  // Options de réponses (Bonne + Fausses mélangées)
  const optionsGrid = document.getElementById('quiz-options');
  optionsGrid.innerHTML = '';
  
  const allChoices = [q.answer, ...q.wrong_options].sort(() => 0.5 - Math.random());

  allChoices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = choice;
    btn.onclick = () => selectAnswer(btn, choice, q.answer);
    optionsGrid.appendChild(btn);
  });
}

function selectAnswer(button, selected, correct) {
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(btn => btn.disabled = true);

  if (selected === correct) {
    button.classList.add('correct');
    score++;
  } else {
    button.classList.add('wrong');
    buttons.forEach(btn => {
      if (btn.textContent === correct) btn.classList.add('correct');
    });
  }

  document.getElementById('next-btn').classList.remove('hidden');
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < quizQuestions.length) {
    showQuestion();
  } else {
    document.getElementById('quiz-box').classList.add('hidden');
    document.getElementById('quiz-results').classList.remove('hidden');
    document.getElementById('score-text').textContent = `Votre score : ${score} / ${quizQuestions.length}`;
  }
}

function getYouTubeEmbedUrl(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
}
