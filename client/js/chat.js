document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // --- ✅ User Session Check ---
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.id) {
        window.location.href = "login.html";
        throw new Error("User not logged in");
    }

    console.log("✅ Logged in as:", currentUser.name);

    // ✅ Corrected: using currentUser.id (not currentUserSession)
    const currentUserId = currentUser.id;

    // Each user's chat history is stored separately
    const historyStorageKey = `mindEaseChatHistory_${currentUserId}`;

    // --- DOM Elements ---
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');
    const apiKeyWarning = document.getElementById('api-key-warning');
    const logoutBtn = document.getElementById('logout-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('history-list');
    const chatDateHeader = document.getElementById('chat-date-header');

    // --- State Management ---
    let currentChatDate = getTodayDateString();
    let currentUserChatHistory = {};

    // --- Helper Functions ---
    function getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }

    function formatDateForDisplay(dateStr) {
        if (dateStr === getTodayDateString()) return "Today";
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (dateStr === yesterday.toISOString().split('T')[0]) return "Yesterday";
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    // --- Local Storage ---
    const loadUserHistory = () => {
        const stored = localStorage.getItem(historyStorageKey);
        currentUserChatHistory = stored ? JSON.parse(stored) : {};
    };

    const saveUserHistory = () => {
        localStorage.setItem(historyStorageKey, JSON.stringify(currentUserChatHistory));
    };

    // --- UI Rendering ---
    const renderHistorySidebar = () => {
        historyList.innerHTML = '';
        const sortedDates = Object.keys(currentUserChatHistory).sort().reverse();
        sortedDates.forEach(date => {
            const historyItem = document.createElement('button');
            historyItem.className = 'history-item';
            historyItem.textContent = formatDateForDisplay(date);
            historyItem.dataset.date = date;
            if (date === currentChatDate) historyItem.classList.add('active');
            historyItem.addEventListener('click', () => loadChat(date));
            historyList.appendChild(historyItem);
        });
    };

    const addMessageToUI = (text, sender) => {
        const messageWrapper = document.createElement('div');
        const messageBubble = document.createElement('div');
        messageWrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
        messageBubble.className = `max-w-md px-4 py-2 rounded-2xl whitespace-pre-wrap ${
            sender === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`;
        messageBubble.textContent = text;
        messageWrapper.appendChild(messageBubble);
        chatMessages.appendChild(messageWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const loadChat = (date) => {
        currentChatDate = date;
        chatMessages.innerHTML = '';
        chatDateHeader.textContent = `Conversation for ${formatDateForDisplay(date)}`;
        const conversationHistory = currentUserChatHistory[date] || [];

        if (conversationHistory.length === 0) {
            const welcomeText = "Hello! I'm Aura, your personal AI assistant. How can I support you today?";
            addMessageToUI(welcomeText, 'model');
            currentUserChatHistory[date] = [{ role: 'model', parts: [{ text: welcomeText }] }];
            saveUserHistory();
            renderHistorySidebar();
        } else {
            conversationHistory.forEach(msg =>
                addMessageToUI(msg.parts[0].text, msg.role)
            );
        }

        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.toggle('active', item.dataset.date === date);
        });
    };

    // --- Main Chat Functionality ---
    const handleSendMessage = async () => {
        const userInput = messageInput.value.trim();
        if (!userInput) return;

        let conversationHistory = currentUserChatHistory[currentChatDate] || [];

        addMessageToUI(userInput, 'user');
        conversationHistory.push({ role: 'user', parts: [{ text: userInput }] });

        messageInput.value = '';
        messageInput.disabled = true;
        sendButton.disabled = true;
        typingIndicator.classList.remove('hidden');

        try {
            const aiResponse = await getAIResponse(userInput, conversationHistory);
            typingIndicator.classList.add('hidden');
            addMessageToUI(aiResponse, 'model');
            conversationHistory.push({ role: 'model', parts: [{ text: aiResponse }] });

            currentUserChatHistory[currentChatDate] = conversationHistory;
            saveUserHistory();
        } catch (err) {
            console.error(err);
            addMessageToUI("❌ Error fetching AI response.", 'model');
        }

        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    };

    // --- Event Listeners ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    sendButton.addEventListener('click', handleSendMessage);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    newChatBtn.addEventListener('click', () => {
        const today = getTodayDateString();
        currentUserChatHistory[today] = [];
        saveUserHistory();
        loadChat(today);
    });

    // --- Initialize ---
    const initializeApp = () => {
        if (
            typeof API_KEY === 'undefined' ||
            API_KEY === 'PASTE_YOUR_GOOGLE_AI_API_KEY_HERE' ||
            API_KEY === ''
        ) {
            apiKeyWarning.classList.remove('hidden');
        } else {
            messageInput.disabled = false;
            sendButton.disabled = false;
            loadUserHistory();
            renderHistorySidebar();
            loadChat(currentChatDate);
        }
    };

    initializeApp();
});
