<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Stress Detection - Discussion Platform</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        h1 {
            text-align: center;
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }

        .stat-card h3 {
            font-size: 2em;
            margin-bottom: 5px;
        }

        .stat-card p {
            opacity: 0.9;
        }

        .input-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
        }

        .user-input {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
        }

        input[type="text"] {
            flex: 1;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
        }

        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }

        textarea {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
        }

        textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
            margin-top: 15px;
        }

        .btn:hover {
            transform: translateY(-2px);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .result-section {
            display: none;
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
        }

        .result-section.show {
            display: block;
            animation: fadeIn 0.5s;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .stress-meter {
            position: relative;
            height: 40px;
            background: linear-gradient(to right, #4ade80 0%, #fbbf24 50%, #ef4444 100%);
            border-radius: 20px;
            margin: 20px 0;
            overflow: hidden;
        }

        .stress-indicator {
            position: absolute;
            top: -10px;
            width: 4px;
            height: 60px;
            background: #000;
            transition: left 0.5s ease;
        }

        .stress-indicator::after {
            content: '';
            position: absolute;
            top: 0;
            left: -6px;
            width: 16px;
            height: 16px;
            background: #000;
            border-radius: 50%;
        }

        .score-display {
            text-align: center;
            font-size: 3em;
            font-weight: bold;
            margin: 20px 0;
        }

        .score-display.green { color: #4ade80; }
        .score-display.yellow { color: #fbbf24; }
        .score-display.red { color: #ef4444; }

        .model-scores {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }

        .model-card {
            background: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border: 2px solid #ddd;
        }

        .model-card h4 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 0.9em;
        }

        .model-card .score {
            font-size: 2em;
            font-weight: bold;
        }

        .keywords {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 15px 0;
        }

        .keyword-tag {
            background: #667eea;
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 0.9em;
        }

        .suggestion-box {
            background: white;
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid #667eea;
            margin: 20px 0;
        }

        .suggestion-box h3 {
            color: #667eea;
            margin-bottom: 10px;
        }

        .explanation-box {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            white-space: pre-line;
            line-height: 1.6;
        }

        .history-section {
            margin-top: 30px;
        }

        .history-item {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 15px;
            border-left: 5px solid #ddd;
        }

        .history-item.green { border-left-color: #4ade80; }
        .history-item.yellow { border-left-color: #fbbf24; }
        .history-item.red { border-left-color: #ef4444; }

        .history-item .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            flex-wrap: wrap;
        }

        .history-item .text {
            color: #666;
            font-style: italic;
            margin-bottom: 10px;
        }

        .loading {
            text-align: center;
            padding: 20px;
            color: #667eea;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .chart-container {
            position: relative;
            height: 300px;
            margin: 30px 0;
            background: white;
            padding: 20px;
            border-radius: 15px;
        }

        .error {
            background: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 10px;
            margin: 15px 0;
            border-left: 5px solid #c33;
        }

        .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 0.9em;
            font-weight: bold;
            z-index: 1000;
        }

        .connection-status.connected {
            background: #4ade80;
            color: white;
        }

        .connection-status.disconnected {
            background: #ef4444;
            color: white;
        }
    </style>
</head>
<body>
    <div class="connection-status disconnected" id="connectionStatus">⚠️ Checking connection...</div>

    <div class="container">
        <h1>🧠 Student Stress Detection</h1>
        <p class="subtitle">AI-Powered Discussion Monitoring & Mental Health Support</p>

        <div class="stats-grid">
            <div class="stat-card">
                <h3 id="totalAnalyses">0</h3>
                <p>Total Analyses</p>
            </div>
            <div class="stat-card">
                <h3 id="avgStress">--</h3>
                <p>Average Stress</p>
            </div>
            <div class="stat-card">
                <h3 id="highStressCount">0</h3>
                <p>High Stress Alerts</p>
            </div>
        </div>

        <div class="input-section">
            <div class="user-input">
                <input type="text" id="userId" placeholder="Enter your Student ID (e.g., student_123)" value="student_demo">
            </div>
            <textarea id="messageInput" placeholder="Type your message or thought here... 

Examples:
- 'I'm feeling overwhelmed with all these assignments'
- 'Really stressed about the exam tomorrow'
- 'Feeling great and confident today!'"></textarea>
            <button class="btn" id="analyzeBtn">🔍 Analyze Stress Level</button>
        </div>

        <div class="result-section" id="resultSection">
            <div class="loading">
                <div class="spinner"></div>
                <p>Analyzing with ML models...</p>
            </div>
        </div>

        <div class="history-section">
            <h2>📜 Recent Analysis History</h2>
            <div id="historyContainer">
                <p style="text-align: center; color: #999; padding: 20px;">No history yet. Start by analyzing a message!</p>
            </div>
        </div>

        <div class="chart-container">
            <canvas id="stressChart"></canvas>
        </div>
    </div>

    <script>
        // Configuration
        const API_URL = 'http://localhost:8080/api';
        let stressChart = null;
        let historyData = [];
        let isBackendConnected = false;

        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Initializing application...');
            
            // Check backend connection
            checkBackendConnection();
            
            // Initialize chart
            initChart();
            
            // Load initial data
            loadStats();
            
            // Add event listeners
            setupEventListeners();
        });

        function setupEventListeners() {
            const analyzeBtn = document.getElementById('analyzeBtn');
            const messageInput = document.getElementById('messageInput');
            
            if (analyzeBtn) {
                analyzeBtn.addEventListener('click', function() {
                    analyzeStress();
                });
            }
            
            if (messageInput) {
                messageInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        analyzeStress();
                    }
                });
            }
        }

        async function checkBackendConnection() {
            const statusEl = document.getElementById('connectionStatus');
            
            try {
                const response = await fetch(`${API_URL}/health`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Backend connected:', data);
                    isBackendConnected = true;
                    statusEl.textContent = '✅ Backend Connected';
                    statusEl.className = 'connection-status connected';
                    
                    setTimeout(() => {
                        statusEl.style.display = 'none';
                    }, 3000);
                } else {
                    throw new Error('Backend not responding');
                }
            } catch (error) {
                console.error('❌ Backend connection failed:', error);
                isBackendConnected = false;
                statusEl.textContent = '❌ Backend Disconnected';
                statusEl.className = 'connection-status disconnected';
                
                showError('Unable to connect to backend server. Please ensure Spring Boot is running on port 8080.');
            }
        }

        async function analyzeStress() {
            const userId = document.getElementById('userId').value.trim();
            const text = document.getElementById('messageInput').value.trim();
            const analyzeBtn = document.getElementById('analyzeBtn');

            if (!userId) {
                alert('⚠️ Please enter your Student ID!');
                return;
            }

            if (!text) {
                alert('⚠️ Please enter a message to analyze!');
                return;
            }

            // Check backend connection
            if (!isBackendConnected) {
                alert('❌ Backend server is not connected. Please start the Spring Boot application.');
                return;
            }

            // Disable button and show loading
            analyzeBtn.disabled = true;
            analyzeBtn.textContent = '⏳ Analyzing...';

            const resultSection = document.getElementById('resultSection');
            resultSection.classList.add('show');
            resultSection.innerHTML = '<div class="loading"><div class="spinner"></div><p>Analyzing with 4 ML models (TF-IDF, Naive Bayes, LSTM, DistilBERT)...</p></div>';

            try {
                const response = await fetch(`${API_URL}/analyze-stress`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        text: text,
                        user_id: userId 
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Analysis result:', result);
                
                displayResults(result, text);
                
                // Refresh stats and history
                await loadStats();
                await loadHistory(userId);
                
                // Clear input
                document.getElementById('messageInput').value = '';

            } catch (error) {
                console.error('Analysis error:', error);
                showError('Failed to analyze stress. Error: ' + error.message);
            } finally {
                // Re-enable button
                analyzeBtn.disabled = false;
                analyzeBtn.textContent = '🔍 Analyze Stress Level';
            }
        }

        function displayResults(result, originalText) {
            const resultSection = document.getElementById('resultSection');
            
            // Safely get keywords
            const keywords = result.top_keywords || [];
            const keywordsHtml = keywords.length > 0 
                ? keywords.map(kw => `<span class="keyword-tag">${escapeHtml(kw)}</span>`).join('')
                : '<span style="color: #999;">No specific keywords detected</span>';
            
            // Safely get models
            const models = result.models || {
                tfidf_logreg: 0,
                naive_bayes: 0,
                lstm_gru: 0,
                distilbert: 0
            };
            
            // Build result HTML
            resultSection.innerHTML = `
                <h2>📊 Analysis Results</h2>
                
                <div class="score-display ${result.color_code || 'yellow'}">${result.final_stress_score || 0}/100</div>
                
                <div class="stress-meter">
                    <div class="stress-indicator" style="left: ${result.final_stress_score || 0}%"></div>
                </div>

                <div class="model-scores">
                    <div class="model-card">
                        <h4>TF-IDF + Logistic</h4>
                        <div class="score">${models.tfidf_logreg || 0}</div>
                    </div>
                    <div class="model-card">
                        <h4>Naive Bayes</h4>
                        <div class="score">${models.naive_bayes || 0}</div>
                    </div>
                    <div class="model-card">
                        <h4>LSTM/GRU</h4>
                        <div class="score">${models.lstm_gru || 0}</div>
                    </div>
                    <div class="model-card">
                        <h4>DistilBERT</h4>
                        <div class="score">${models.distilbert || 0}</div>
                    </div>
                </div>

                <div class="suggestion-box">
                    <h3>💡 Personalized Suggestion</h3>
                    <p>${escapeHtml(result.suggestion || 'No suggestion available')}</p>
                </div>

                <div class="explanation-box">${escapeHtml(result.explanation || 'No explanation available')}</div>

                <h4>🏷️ Key Stress Indicators</h4>
                <div class="keywords">${keywordsHtml}</div>

                <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 10px;">
                    <strong>Confidence:</strong> ${result.confidence || 0}% | 
                    <strong>Emotion:</strong> ${(result.dominant_emotion || 'unknown').replace(/_/g, ' ')} |
                    <strong>Level:</strong> ${(result.stress_level || 'unknown').toUpperCase()}
                </div>
            `;
            
            // Add to history
            historyData.unshift({
                timestamp: new Date().toISOString(),
                score: result.final_stress_score || 0,
                emotion: result.dominant_emotion || 'unknown',
                color: result.color_code || 'yellow',
                text: originalText
            });
            
            updateChart();
        }

        async function loadStats() {
            try {
                const response = await fetch(`${API_URL}/stress-stats?days=7`);
                
                if (!response.ok) {
                    throw new Error('Failed to load stats');
                }
                
                const data = await response.json();
                
                if (data.success && data.stats) {
                    document.getElementById('totalAnalyses').textContent = data.stats.total_analyses || 0;
                    
                    const avgStress = data.stats.total_analyses > 0 
                        ? data.stats.average_stress.toFixed(1) 
                        : '--';
                    document.getElementById('avgStress').textContent = avgStress;
                    
                    // Count high stress from local history
                    const highStress = historyData.filter(h => h.score > 70).length;
                    document.getElementById('highStressCount').textContent = highStress;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        async function loadHistory(userId) {
            try {
                const response = await fetch(`${API_URL}/stress-history?userId=${userId}&limit=10`);
                
                if (!response.ok) {
                    throw new Error('Failed to load history');
                }
                
                const data = await response.json();
                
                if (data.success && data.history && data.history.length > 0) {
                    const container = document.getElementById('historyContainer');
                    container.innerHTML = data.history.map(item => {
                        const colorClass = item.finalScore >= 71 ? 'red' : item.finalScore >= 41 ? 'yellow' : 'green';
                        const dateStr = new Date(item.timestamp).toLocaleString();
                        const shortText = item.text.substring(0, 100) + (item.text.length > 100 ? '...' : '');
                        
                        return `
                            <div class="history-item ${colorClass}">
                                <div class="header">
                                    <strong>Score: ${item.finalScore}/100</strong>
                                    <span>${dateStr}</span>
                                </div>
                                <div class="text">"${escapeHtml(shortText)}"</div>
                                <div style="margin-top: 10px;">
                                    <span style="background: #667eea; color: white; padding: 4px 8px; border-radius: 5px; font-size: 0.85em;">
                                        ${(item.emotion || 'unknown').replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } catch (error) {
                console.error('Error loading history:', error);
            }
        }

        function initChart() {
            const ctx = document.getElementById('stressChart');
            
            if (!ctx) {
                console.error('Chart canvas not found');
                return;
            }
            
            stressChart = new Chart(ctx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Stress Level Over Time',
                        data: [],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        title: {
                            display: true,
                            text: 'Stress Trend Analysis',
                            font: {
                                size: 16
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                                display: true,
                                text: 'Stress Score (0-100)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Analysis Entry'
                            }
                        }
                    }
                }
            });
        }

        function updateChart() {
            if (!stressChart || historyData.length === 0) return;
            
            const last10 = historyData.slice(0, 10).reverse();
            const labels = last10.map((_, i) => `#${i + 1}`);
            const data = last10.map(h => h.score);
            
            stressChart.data.labels = labels;
            stressChart.data.datasets[0].data = data;
            stressChart.update();
        }

        function showError(message) {
            const resultSection = document.getElementById('resultSection');
            resultSection.classList.add('show');
            resultSection.innerHTML = `<div class="error">❌ ${escapeHtml(message)}</div>`;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Retry connection every 10 seconds if disconnected
        setInterval(function() {
            if (!isBackendConnected) {
                checkBackendConnection();
            }
        }, 10000);
    </script>
</body>
</html>
