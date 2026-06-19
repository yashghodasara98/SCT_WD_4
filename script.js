document.addEventListener('DOMContentLoaded', function () {
    // Selectors
    const taskInput = document.getElementById('new-task');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const priorityOptions = document.querySelectorAll('.priority-option');
    const prioritySelector = document.getElementById('priority-selector');
    const prioritySlider = document.getElementById('priority-slider');
    const taskDateInput = document.getElementById('task-date');
    const taskTimeInput = document.getElementById('task-time');

    // State Variables (Pure temporary runtime memory array)
    let tasks = [];
    let currentfilter = 'all';
    let currentPriority = 'medium';

    // --- Initialization ---
    initPrioritySlider();
    renderTasks();

    // --- Functions ---

    // Set up priority slider position matching active priority
    function initPrioritySlider() {
        priorityOptions.forEach(option => {
            if (option.getAttribute('data-priority') === currentPriority) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        setTimeout(updatePrioritySlider, 50);
    }

    // Update sliding background position and width
    function updatePrioritySlider() {
        const activeOption = document.querySelector('.priority-option.active');
        if (activeOption && prioritySlider) {
            prioritySlider.style.width = `${activeOption.offsetWidth}px`;
            prioritySlider.style.transform = `translateX(${activeOption.offsetLeft - 2}px)`;
        }
    }

    // Date formatting helper
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Tomorrow';
        } else if (diffDays === -1) {
            return 'Yesterday';
        } else {
            const options = { month: 'short', day: 'numeric' };
            if (date.getFullYear() !== today.getFullYear()) {
                options.year = 'numeric';
            }
            return date.toLocaleDateString(undefined, options);
        }
    }

    // Main render function
    function renderTasks() {
        taskList.innerHTML = '';

        // Filter tasks
        const filteredTasks = tasks.filter(task => {
            if (currentfilter === 'active') return !task.completed;
            if (currentfilter === 'completed') return task.completed;
            return true;
        });

        // Update statistics
        const totalCount = tasks.length;
        const completedCount = tasks.filter(t => t.completed).length;

        totalTasksEl.textContent = `${totalCount} task${totalCount !== 1 ? 's' : ''}`;
        completedTasksEl.textContent = `${completedCount} completed`;

        // Check if list is empty
        if (filteredTasks.length === 0) {
            let emptyTitle = 'No tasks yet!';
            let emptySubtitle = 'Add your first task to get started!';

            if (currentfilter === 'active') {
                emptyTitle = 'No active tasks!';
                emptySubtitle = 'All caught up! Time to relax.';
            } else if (currentfilter === 'completed') {
                emptyTitle = 'No completed tasks!';
                emptySubtitle = 'Finish a task to see it here.';
            }

            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>${emptyTitle}</h3>
                    <p>${emptySubtitle}</p>
                </div>
            `;
            return;
        }

        // Render each task item
        filteredTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `task ${task.completed ? 'completed' : ''}`;
            taskEl.setAttribute('data-id', task.id);

            const dueFormatted = formatDate(task.dueDate);
            const dueDisplay = dueFormatted || task.dueTime;

            taskEl.innerHTML = `
                <label class="checkbox-container">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <div class="priority-indicator priority-${task.priority}" title="${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority"></div>
                <div class="task-content">
                    <span class="task-text">${escapeHTML(task.text)}</span>
                    ${dueDisplay ? `
                        <div class="task-due-date">
                            <i class="far fa-clock"></i>
                            <span>
                                ${dueFormatted ? dueFormatted : ''} 
                                ${task.dueTime ? task.dueTime : ''}
                            </span>
                        </div>
                    ` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-btn delete-btn" title="Delete Task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

            // Event Listeners for dynamic elements
            const checkbox = taskEl.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTask(task.id));

            const deleteBtn = taskEl.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task.id, taskEl));

            taskList.appendChild(taskEl);
        });
    }

    // Helper to escape HTML tags to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Add new task
    function addTask() {
        const text = taskInput.value.trim();
        if (!text) {
            taskInput.focus();
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            priority: currentPriority,
            dueDate: taskDateInput.value || null,
            dueTime: taskTimeInput.value || null,
            createdAt: Date.now()
        };

        tasks.push(newTask);

        // Reset input fields
        taskInput.value = '';
        taskDateInput.value = '';
        taskTimeInput.value = '';

        renderTasks();
    }

    // Toggle completion state
    function toggleTask(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        renderTasks();
    }

    // Delete task with collapse/fade animation
    function deleteTask(id, taskEl) {
        taskEl.style.transition = 'all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)';
        taskEl.style.transform = 'scale(0.9) translateY(-10px)';
        taskEl.style.opacity = '0';
        taskEl.style.height = '0';
        taskEl.style.padding = '0';
        taskEl.style.margin = '0';
        taskEl.style.border = 'none';

        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            renderTasks();
        }, 350);
    }

    // --- Event Listeners ---

    // Add button click
    addBtn.addEventListener('click', addTask);

    // Press Enter in input
    taskInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Filters click
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentfilter = this.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Priority option click
    priorityOptions.forEach(option => {
        option.addEventListener('click', function () {
            priorityOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            currentPriority = this.getAttribute('data-priority');
            updatePrioritySlider();
        });
    });

    // Update slider position on window resize
    window.addEventListener('resize', updatePrioritySlider);
});