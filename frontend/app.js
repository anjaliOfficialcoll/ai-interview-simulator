
    const API_BASE = "https://interviewiq-production-b2a2.up.railway.app";
    
    // State Management
    let currentRole = "";
    let currentDifficulty = "Medium";
    let currentQuestion = "";
    let currentQuestionNumber = 1;
    let totalQuestions = 0;
    let scores = [];
    let resumeFile = null;

    // Section Navigation
    function goToSection(sectionId) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(sectionId).classList.add('active');
    }

    // Resume Upload
    function handleResumeUpload(event) {
      const file = event.target.files[0];
      if (file && file.type === 'application/pdf') {
        resumeFile = file;
        document.getElementById('fileName').textContent = `Selected: ${file.name}`;
        document.getElementById('analyzeBtn').disabled = false;
        document.getElementById('resumeAnalysisCard').style.display = 'none';
      } else if (file) {
        alert('Please upload a PDF file only.');
      }
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const base64 = result.split(',')[1] || '';
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    }

    function tryPrefillRoleAndDifficulty(analysisText) {
      const roleOptions = Array.from(document.querySelectorAll('.dropdown-option')).map(el => el.dataset.value);
      const lower = analysisText.toLowerCase();
      const matchedRole = roleOptions.find(role => lower.includes(role.toLowerCase()));

      if (matchedRole) {
        roleValue.value = matchedRole;
        roleTrigger.textContent = matchedRole;
        currentRole = matchedRole;
      }

      let suggestedDifficulty = 'Medium';
      if (lower.includes('suggested difficulty: hard') || lower.includes('difficulty: hard')) {
        suggestedDifficulty = 'Hard';
      } else if (lower.includes('suggested difficulty: easy') || lower.includes('difficulty: easy')) {
        suggestedDifficulty = 'Easy';
      }

      document.getElementById('difficulty').value = suggestedDifficulty;
      currentDifficulty = suggestedDifficulty;
    }

    async function analyzeResume() {
      if (!resumeFile) {
        alert('Please upload a PDF resume first.');
        return;
      }

      const loading = document.getElementById('resumeLoading');
      const analyzeBtn = document.getElementById('analyzeBtn');
      const analysisCard = document.getElementById('resumeAnalysisCard');
      const analysisTextElement = document.getElementById('resumeAnalysisText');

      loading.classList.add('show');
      analyzeBtn.disabled = true;
      analysisCard.style.display = 'none';

      try {
        const resumeBase64 = await fileToBase64(resumeFile);

        const response = await fetch(`${API_BASE}/analyze-resume`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeBase64,
            mimeType: resumeFile.type || 'application/pdf',
            fileName: resumeFile.name || 'resume.pdf'
          })
        });

        const data = await response.json();
        const analysis = data.analysis || 'No analysis returned.';
        analysisTextElement.textContent = analysis;
        analysisCard.style.display = 'block';
        tryPrefillRoleAndDifficulty(analysis);
      } catch (error) {
        analysisTextElement.textContent = 'Resume analysis is currently unavailable. You can continue by selecting role and difficulty manually.';
        analysisCard.style.display = 'block';
      } finally {
        loading.classList.remove('show');
        analyzeBtn.disabled = false;
      }
    }

    // Role Dropdown
    const roleDropdown = document.getElementById('roleDropdown');
    const roleTrigger = document.getElementById('roleTrigger');
    const roleMenu = document.getElementById('roleMenu');
    const roleValue = document.getElementById('roleValue');

    roleTrigger.addEventListener('click', () => {
      roleDropdown.classList.toggle('open');
    });

    roleMenu.addEventListener('click', (e) => {
      const option = e.target.closest('.dropdown-option');
      if (option) {
        const value = option.dataset.value;
        roleValue.value = value;
        roleTrigger.textContent = value;
        currentRole = value;
        roleDropdown.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (!roleDropdown.contains(e.target)) {
        roleDropdown.classList.remove('open');
      }
    });

    // Interview Flow
    async function startInterview() {
      currentRole = roleValue.value;
      currentDifficulty = document.getElementById('difficulty').value;

      if (!currentRole) {
        alert('Please select a role');
        return;
      }

      currentQuestionNumber = 1;
      totalQuestions = 0;
      scores = [];
      
      goToSection('interviewSection');
      await loadQuestion();
    }

    async function loadQuestion() {
      const questionText = document.getElementById('questionText');
      const loading = document.getElementById('questionLoading');
      
      questionText.textContent = '';
      loading.classList.add('show');
      document.getElementById('questionNumber').textContent = `Question ${currentQuestionNumber}`;
      document.getElementById('answerText').value = '';

      try {
        const res = await fetch(`${API_BASE}/generate-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: currentRole, difficulty: currentDifficulty })
        });

        const data = await res.json();
        currentQuestion = data.question || 'Failed to load question';
        questionText.textContent = currentQuestion;
      } catch (error) {
        questionText.textContent = 'Error loading question. Please try again.';
      } finally {
        loading.classList.remove('show');
      }

      updateProgress();
    }

    async function submitAnswer() {
      const answer = document.getElementById('answerText').value.trim();
      
      if (!answer) {
        alert('Please write an answer before submitting');
        return;
      }

      const loading = document.getElementById('evaluationLoading');
      loading.classList.add('show');
      document.getElementById('submitAnswerBtn').disabled = true;

      try {
        const res = await fetch(`${API_BASE}/evaluate-answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: currentQuestion, answer })
        });

        const data = await res.json();
        displayFeedback(data.feedback);
        totalQuestions++;
        goToSection('feedbackSection');
      } catch (error) {
        alert('Error evaluating answer. Please try again.');
      } finally {
        loading.classList.remove('show');
        document.getElementById('submitAnswerBtn').disabled = false;
      }
    }

    function displayFeedback(feedback) {
      // Parse feedback for score, strengths, improvements, model answer
      const scoreMatch = feedback.match(/score[:\s]*(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      scores.push(score);

      document.getElementById('feedbackScore').textContent = `${score}/10`;
      
      // Simple parsing - split by common section headers
      const sections = feedback.split(/\n(?=[✅🔍💡📝📊])/);
      
      document.getElementById('feedbackStrengths').innerHTML = `<p>${feedback.includes('Strengths') || feedback.includes('✅') ? 
        feedback.split(/strengths|✅/i)[1]?.split(/improvement|🔍|missing|💡/i)[0] || 'Good effort!' : 'Good effort!'}</p>`;
      
      document.getElementById('feedbackImprovements').innerHTML = `<p>${feedback.includes('Improvement') || feedback.includes('🔍') ? 
        feedback.split(/improvement|areas for improvement|🔍/i)[1]?.split(/model|answer|💡|📝/i)[0] || 'Keep practicing!' : 'Keep practicing!'}</p>`;
      
      document.getElementById('feedbackModelAnswer').innerHTML = `<p>${feedback.includes('Model') || feedback.includes('📝') ? 
        feedback.split(/model answer|📝/i)[1] || feedback : feedback}</p>`;

      updateProgress();
    }

    function nextQuestion() {
      currentQuestionNumber++;
      goToSection('interviewSection');
      loadQuestion();
    }

    function updateProgress() {
      document.getElementById('questionsAttempted').textContent = totalQuestions;
      
      if (scores.length > 0) {
        const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        document.getElementById('averageScore').textContent = avg;
      }

      const progress = Math.min((totalQuestions / 5) * 100, 100);
      document.getElementById('progressBar').style.width = `${progress}%`;
    }

    function viewProgress() {
      // Populate summary page with current stats
      document.getElementById('summaryRole').textContent = currentRole || '-';
      document.getElementById('summaryDifficulty').textContent = currentDifficulty || '-';
      document.getElementById('summaryQuestionsTotal').textContent = totalQuestions;
      
      if (scores.length > 0) {
        const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
        const high = Math.max(...scores);
        const low = Math.min(...scores);
        
        document.getElementById('summaryAvgScore').textContent = avg;
        document.getElementById('summaryHighScore').textContent = high;
        document.getElementById('summaryLowScore').textContent = low;
        
        // Update progress bar
        const progress = Math.min((totalQuestions / 5) * 100, 100);
        document.getElementById('summaryProgressBar').style.width = `${progress}%`;
        
        // Display score history
        const scoreHistory = document.getElementById('scoreHistory');
        scoreHistory.innerHTML = scores.map((score, idx) => 
          `<span class="score-badge">Q${idx + 1}: ${score}/10</span>`
        ).join('');
      } else {
        document.getElementById('summaryAvgScore').textContent = '-';
        document.getElementById('summaryHighScore').textContent = '-';
        document.getElementById('summaryLowScore').textContent = '-';
        document.getElementById('scoreHistory').innerHTML = '<p style="color: var(--muted);">No scores yet</p>';
      }
      
      goToSection('progressSection');
    }

    function restartInterview() {
      currentQuestionNumber = 1;
      totalQuestions = 0;
      scores = [];
      currentRole = '';
      currentDifficulty = 'Medium';
      document.getElementById('roleValue').value = '';
      document.getElementById('roleTrigger').textContent = 'Select a role';
      goToSection('roleSection');
    }
 